//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BitLock is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IBlast constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
    address public feeManager;
    address public gasFeeTo;
    uint256 public minClaimRateBips;
    //N/100 times a gas fee goes to the gasFeeTo vs the feeManager.
    uint256 public intervalToTransferToFeeManager = 90;
    uint256 public transactionCount;

    uint256 public lockId;

    struct LockData {
        uint256 lockStartTimestamp;
        uint256 lockDuration;
        address lockedTokenAddress;
        uint256 lockedTokenAmount;
        bool isWithdrawn;
    }

    mapping(address => mapping(uint256 => LockData)) public userLocks;
    mapping(address => uint256[]) public userLockIds;

    event Lock(
        address indexed user, 
        uint256 lockId, 
        address token, 
        uint256 amount, 
        uint256 duration
    );
    
    event Withdraw(
        address indexed user, 
        uint256 lockId
    );

    constructor(address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo) {
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

    //ERC20 Case
    function lock(
        address _tokenToLock, 
        uint256 _tokenAmountToLock,
        uint256 _lockDuration
    ) public nonReentrant distributeAfterCall returns (uint256) {
        require(_tokenAmountToLock > 0, "Amount to lock must be greater than 0");
        require(_lockDuration > 0, "Lock duration must be greater than 0");

        ++lockId;

        userLockIds[msg.sender].push(lockId);

        userLocks[msg.sender][lockId] = LockData(
            block.timestamp, 
            _lockDuration, 
            _tokenToLock, 
            _tokenAmountToLock,
            false
        );

        IERC20(_tokenToLock).safeTransferFrom(msg.sender, address(this), _tokenAmountToLock);

        emit Lock(msg.sender, lockId, _tokenToLock, _tokenAmountToLock, _lockDuration);

        return lockId;
    }

    function withdraw(uint256 _lockId) public nonReentrant distributeAfterCall {
        LockData storage lockData = userLocks[msg.sender][_lockId];
        require(block.timestamp > lockData.lockStartTimestamp + lockData.lockDuration, "Lock is still active");
        require(!lockData.isWithdrawn, "Lock already withdrawn");

        IERC20(lockData.lockedTokenAddress).safeTransfer(msg.sender, lockData.lockedTokenAmount);

        lockData.isWithdrawn = true;

        emit Withdraw(msg.sender, _lockId);
    }

    //------------------
    
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