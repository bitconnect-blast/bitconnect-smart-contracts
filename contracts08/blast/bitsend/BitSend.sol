//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { IBlastPoints } from "../../../contractsShared/blast/IBlastPoints.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
    Gas Notes: This contract is the fee governor, so that during routine transactions it can claim gas yield and send it to the gasFeeTo address without further input from any admin contract.
 */

contract BitSend is Ownable {
    IBlast immutable BLAST;
    address public feeManager;
    bool private locked;

    constructor(address _feeManager, address _blast, address _blastPoints, address _pointsOperator) {
        feeManager = _feeManager;
        BLAST = IBlast(_blast);
        IBlast(_blast).configureClaimableGas();
        IBlastPoints(_blastPoints).configurePointsOperator(_pointsOperator);
    }

    function disperseEther(address[] memory recipients, uint256[] memory values) external payable {
        require(!locked, "Reentrant call detected");
        locked = true;

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

        locked = false;
    }

    function disperseToken(IERC20 token, address[] memory recipients, uint256[] memory values) external {
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            total += values[i];
        }
        require(token.transferFrom(msg.sender, address(this), total), "TransferFrom failed");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(token.transfer(recipients[i], values[i]), "Token transfer failed");
        }
    }

    function setFeeManager(address _feeManager) external onlyOwner {
        feeManager = _feeManager;
    }

    function claimGasAtMinClaimRateManual(uint256 _bips) external onlyOwner {
        BLAST.claimGasAtMinClaimRate(address(this), feeManager, _bips);
    }

    function claimMaxGasManual() external onlyOwner {
        BLAST.claimMaxGas(address(this), feeManager);
    }

    function claimAllGasManual() external onlyOwner {
        BLAST.claimAllGas(address(this), feeManager);
    }
}
