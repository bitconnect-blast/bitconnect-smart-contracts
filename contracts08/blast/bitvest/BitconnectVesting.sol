//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BitconnectVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public token;

    IBlast constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
    address public feeManager;
    address public gasFeeTo;
    uint256 public minClaimRateBips;
    //N/100 times a gas fee goes to the gasFeeTo vs the feeManager.
    uint256 public intervalToTransferToFeeManager = 90;
    uint256 public transactionCount;

    mapping(address => uint256) public userAmountToBeVested;
    mapping(address => uint256) public userClaimedAmount;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public vestingStartTime;
    uint256 public vestingDuration = 10 days;
    uint256 public proportionClaimableAtStart = 2000; //20% available at start

    error AmountIsGreaterThanWithdrawable(); 
    error InsufficientContractBalance();   
    error VestingHasNotStarted();


    constructor(address _token, uint256 _vestingStartTime, address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo) {

        //transfer _vestedTokenTotalAmount tokens to be vested here
        token = IERC20(_token);        

        vestingStartTime = _vestingStartTime;

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

    //-----------------VESTING-----------------

    function claim(uint256 _amount) external nonReentrant distributeAfterCall {
        if(block.timestamp < vestingStartTime){
            revert VestingHasNotStarted();
        }

        if (_amount > getVestedAmount(msg.sender) - userClaimedAmount[msg.sender]) {
            revert AmountIsGreaterThanWithdrawable();        
        }
    
        userClaimedAmount[msg.sender] += _amount;

        token.safeTransfer(msg.sender, _amount);
    }

    // if vesting has not started, or vestingStartTime hasn't been set, return 0
    function getVestedAmount(address _user) public view returns(uint256){
        uint256 amountToBeVested = userAmountToBeVested[_user];

        if(
            block.timestamp < vestingStartTime || 
            vestingStartTime == 0
        ){
            return 0;
        } else if (block.timestamp >= vestingStartTime + vestingDuration){
            return amountToBeVested;
        } else {
            // returns claimableAtStart + proportion of remainder to be vested based on schedule
            uint256 claimableAtStart = (amountToBeVested * proportionClaimableAtStart) / DENOMINATOR;
            return ( 
                claimableAtStart + 
                ( ((amountToBeVested - claimableAtStart) * (block.timestamp - vestingStartTime)) / vestingDuration ) 
            );
        }
    }

    function secondsUntilVestingStarts() public view returns (uint256) {
        return vestingStartTime > block.timestamp ? vestingStartTime - block.timestamp : 0;
    }

    //-----------------ADMIN-------------------

    //call after approving vesting contract as spender
    function depositBit(uint256 _amount) external onlyOwner {
        token.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function setUserAmountToBeVested(
        address _user,
        uint256 _totalAmount
    ) external onlyOwner {
        userAmountToBeVested[_user] = _totalAmount;
    }

    function batchSetUserAmountToBeVested(
        address[] calldata _users,
        uint256[] calldata _totalAmounts
    ) external onlyOwner {
        require(_users.length == _totalAmounts.length, "length mismatch");
        for (uint256 i = 0; i < _users.length; i++) {
            userAmountToBeVested[_users[i]] = _totalAmounts[i];
        }
    }

    function setToken(address _token) external onlyOwner {
        token = IERC20(_token);
    }

    function setVestingStartTime(uint256 _vestingStartTime) external onlyOwner {
        vestingStartTime = _vestingStartTime;
    }

    function setVestingDuration(uint256 _vestingDuration) external onlyOwner {
        vestingDuration = _vestingDuration;
    }

    function setProportionClaimableAtStart(uint256 _proportionClaimableAtStart) external onlyOwner {
        proportionClaimableAtStart = _proportionClaimableAtStart;
    }

    function withdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    function setFeeManager(address _feeManager) external onlyOwner {
        feeManager = _feeManager;
    }

    function setGasFeeTo(address _gasFeeTo) external onlyOwner {
        gasFeeTo = _gasFeeTo;
    }

    function setIntervalToTransferToFeeManager(uint256 _intervalToTransferToFeeManager) external onlyOwner {
        intervalToTransferToFeeManager = _intervalToTransferToFeeManager;
    }

    function setMinClaimRateBips(uint256 _minClaimRateBips) external onlyOwner {
        minClaimRateBips = _minClaimRateBips;
    }
}
