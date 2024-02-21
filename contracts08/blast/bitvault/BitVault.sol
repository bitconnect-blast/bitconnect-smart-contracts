// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BitVault is Ownable, ReentrancyGuard {
    uint256 public constant BASE = 100;
    uint256 public constant ONE_DAY = 86400;

    //blast
    IBlast constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
    address public feeManager;
    address public gasFeeTo;
    uint256 public minClaimRateBips;
    //N/100 times a gas fee goes to the gasFeeTo vs the feeManager.
    uint256 public intervalToTransferToFeeManager = 90;
    uint256 public transactionCount;

    // State variables
    mapping(address => mapping(address => uint256)) public lastUpdate;
    mapping(address => mapping(address => uint256)) public userWeightedTokenSeconds;
    mapping(address => mapping(address => uint256)) public userBalances;

    mapping(address => uint256) public tokenMultiplerAddPerDay;
    mapping(address => bool) public authorizedTokenAddress;

    event Deposit(address indexed user, uint256 amount, address token);
    event Withdraw(address indexed user, uint256 amount, address token);

    constructor(address _bitToken, address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo) {
        authorizedTokenAddress[_bitToken] = true;
        tokenMultiplerAddPerDay[_bitToken] = 3; //3%/day added to multiplier

        feeManager = _feeManager;
        //sets up the blast contract to be able to claim gas fees
        BLAST.configureClaimableGas();      
        //sets the minimum claim rate for gas fees
        minClaimRateBips = _minClaimRateBips;
        gasFeeTo = _gasFeeTo;
    }

    modifier distributeAfterCall() {
        transactionCount++;

        _;

        address target = transactionCount % 100 < intervalToTransferToFeeManager ? gasFeeTo : feeManager;

        (bool success,) = address(BLAST).call(abi.encodeWithSignature("claimGasAtMinClaimRate(address,address,uint256)", address(this), target, minClaimRateBips));
    }

    // Deposit function
    function deposit(address _tokenAddress, uint256 _amount) external nonReentrant distributeAfterCall {
        require(_amount > 0, "Amount must be greater than 0");
        require(authorizedTokenAddress[_tokenAddress], "Token not authorized");
        
        updateUserWeightedTokenSeconds(_tokenAddress, msg.sender);
        
        //set the last update time if it is the first deposit
        if(lastUpdate[_tokenAddress][msg.sender] == 0) {
            lastUpdate[_tokenAddress][msg.sender] = block.timestamp;
        }        
        
        userBalances[_tokenAddress][msg.sender] += _amount;

        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _amount, _tokenAddress);
    }

    // Withdraw function
    function withdraw(address _tokenAddress, uint256 _amount) external nonReentrant distributeAfterCall {
        require(_amount > 0, "Amount must be greater than 0");
        require(userBalances[_tokenAddress][msg.sender] >= _amount, "Insufficient balance");
        
        updateUserWeightedTokenSeconds(_tokenAddress, msg.sender);

        lastUpdate[_tokenAddress][msg.sender] = block.timestamp;
        userBalances[_tokenAddress][msg.sender] -= _amount;

        IERC20(_tokenAddress).transfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _amount, _tokenAddress);
    }

    // Helper function to update user's weighted token-seconds
    function updateUserWeightedTokenSeconds(address _tokenAddress, address _userAddress) internal {
        uint256 timeElapsed = block.timestamp - lastUpdate[_tokenAddress][_userAddress];
        if (timeElapsed > 0 && userBalances[_tokenAddress][_userAddress] > 0) {
            userWeightedTokenSeconds[_tokenAddress][_userAddress] = getUserWeightedTokenSeconds(_tokenAddress, _userAddress);
        }
    }

    function getUserMultiplier(address _tokenAddress, address _userAddress) internal view returns (uint256) {
        uint256 elapsedDays = (block.timestamp - lastUpdate[_tokenAddress][_userAddress]) / ONE_DAY;
        // Multiply first to avoid truncation error
        return BASE + (tokenMultiplerAddPerDay[_tokenAddress] * elapsedDays);
    }

    // View function to get the current weighted token-seconds for a user
    function getUserWeightedTokenSeconds(address _tokenAddress, address _userAddress) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdate[_tokenAddress][_userAddress];
        uint256 currentWeightedTokenSeconds = userWeightedTokenSeconds[_tokenAddress][_userAddress];
        if (timeElapsed > 0 && userBalances[_tokenAddress][_userAddress] > 0) {
            // Apply the multiplier directly in the calculation to avoid truncation
            currentWeightedTokenSeconds += (timeElapsed * userBalances[_tokenAddress][_userAddress] * getUserMultiplier(_tokenAddress, _userAddress)) / BASE;
        }
        return currentWeightedTokenSeconds;
    }

    function batchGetUserWeightedTokenSeconds(address[] calldata _tokenAddresses, address[] calldata _userAddresses) external view returns (uint256[] memory) {
        require(_tokenAddresses.length == _userAddresses.length, "Array length mismatch");
        uint256[] memory weightedTokenSeconds = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            weightedTokenSeconds[i] = getUserWeightedTokenSeconds(_tokenAddresses[i], _userAddresses[i]);
        }
        return weightedTokenSeconds;
    }

    //-----------------------------

    function addNewAuthorizedTokenAndMultiplier(address _tokenAddress, uint256 _multiplierPercentageAddPerDay) external onlyOwner {
        authorizedTokenAddress[_tokenAddress] = true;
        tokenMultiplerAddPerDay[_tokenAddress] = _multiplierPercentageAddPerDay;
    }

    function removeAuthorizedToken(address _tokenAddress) external onlyOwner {
        authorizedTokenAddress[_tokenAddress] = false;
    }

    function setMultiplierPercentageAddPerDay(address _tokenAddress, uint256 _multiplierPercentageAddPerDay) external onlyOwner {
        tokenMultiplerAddPerDay[_tokenAddress] = _multiplierPercentageAddPerDay;
    }

    function setMinClaimRateBips(uint256 _minClaimRateBips) external onlyOwner {
        minClaimRateBips = _minClaimRateBips;
    }

    function setIntervalToTransferToFeeManager(uint256 _intervalToTransferToFeeManager) external onlyOwner {
        intervalToTransferToFeeManager = _intervalToTransferToFeeManager;
    }

    function setGasFeeTo(address _gasFeeTo) external onlyOwner {
        gasFeeTo = _gasFeeTo;
    }

    function setFeeManager(address _feeManager) external onlyOwner {
        feeManager = _feeManager;
    }

    function claimGasAtMinClaimRateManual() external onlyOwner {
        BLAST.claimGasAtMinClaimRate(address(this), feeManager, minClaimRateBips);
    }

    function claimMaxGasManual() external onlyOwner {
        BLAST.claimMaxGas(address(this), feeManager);
    }

    function claimAllGasManual() external onlyOwner {
        BLAST.claimAllGas(address(this), feeManager);
    }
}