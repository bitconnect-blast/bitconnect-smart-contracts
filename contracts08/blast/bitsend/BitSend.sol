//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
    Gas Notes: This contract is the fee governor, so that during routine transactions it can claim gas yield and send it to the gasFeeTo address without further input from any admin contract.
 */

contract BitSend is Ownable {
    IBlast constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
    address public feeManager;
    address public gasFeeTo;
    uint256 public minClaimRateBips;
    //N/100 times a gas fee goes to the gasFeeTo vs the feeManager.
    uint256 public intervalToTransferToFeeManager = 90;
    uint256 public transactionCount;
    bool public autoCollectFees = true;

    constructor(address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo) {
        feeManager = _feeManager;
        //sets up the blast contract to be able to claim gas fees
        BLAST.configureClaimableGas();      
        //sets the minimum claim rate for gas fees
        minClaimRateBips = _minClaimRateBips;
        gasFeeTo = _gasFeeTo;
    }

    modifier distributeAfterCall() {
        if(autoCollectFees) {
            transactionCount++;

            _;

            address target = transactionCount % 100 < intervalToTransferToFeeManager ? gasFeeTo : feeManager;

            (bool success,) = address(BLAST).call(abi.encodeWithSignature("claimGasAtMinClaimRate(address,address,uint256)", address(this), target, minClaimRateBips));
        } else {
            _;
        }
    }

    function disperseEther(address[] memory recipients, uint256[] memory values) external payable distributeAfterCall {
        for (uint256 i = 0; i < recipients.length; i++) {
            address payable recipient = payable(recipients[i]);
            (bool success, ) = recipient.call{value: values[i]}("");
            require(success, "Ether transfer failed");
        }
        uint256 balance = address(this).balance;
        if (balance > 0) {
            address payable sender = payable(msg.sender);
            (bool success, ) = sender.call{value: balance}("");
            require(success, "Refund transfer failed");
        }

    }

    function disperseToken(IERC20 token, address[] memory recipients, uint256[] memory values) external distributeAfterCall {
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            total += values[i];
        }
        require(token.transferFrom(msg.sender, address(this), total), "TransferFrom failed");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(token.transfer(recipients[i], values[i]), "Token transfer failed");
        }
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

    function setAutoCollectFees(bool _autoCollectFees) external onlyOwner {
        autoCollectFees = _autoCollectFees;
    }
}
