//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { IBlastPoints } from "../../../contractsShared/blast/IBlastPoints.sol";

interface IBitSend {
    function disperseEther(address[] memory recipients, uint256[] memory values) external payable;
}

contract FeeManager is Ownable {
    IBlast immutable BLAST;

    uint256 private constant BPS_DENOMINATOR = 10000;
    uint256 public maxFeeOutputs = 20;
    
    address public bitSend;
    address[] private feeOutputs;
    uint256[] private feeBps;

    constructor(address _blast, address _blastPoints, address _pointsOperator) {
        BLAST = IBlast(_blast);
        IBlast(_blast).configureClaimableYield();
        IBlastPoints(_blastPoints).configurePointsOperator(_pointsOperator);
    }
    
    receive() external payable {}
    
    //call the bitsend contract to disperse the fees
    function disperseFees(uint256 _disperseAmount) external onlyOwner {
        //calculate split
        uint256[] memory amounts = new uint256[](feeOutputs.length);
        for (uint256 i = 0; i < feeOutputs.length; i++) {
            amounts[i] = _disperseAmount * feeBps[i] / BPS_DENOMINATOR;
        }
        IBitSend(bitSend).disperseEther{value: _disperseAmount}(feeOutputs, amounts);
    }

    function transferEth(address payable _to, uint256 _amount) external onlyOwner {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "FeeManager: Transfer failed");
    }

    function setFeeOutputs(address[] memory _outputs, uint256[] memory _bps) external onlyOwner {
        require(_outputs.length == _bps.length, "FeeManager: Invalid input");
        require(_outputs.length > 0, "FeeManager: Invalid input");
        require(_outputs.length < maxFeeOutputs, "FeeManager: Too many outputs");
        feeOutputs = _outputs;
        feeBps = _bps;
    }

    function setMaxFeeOutputs(uint256 _maxFeeOutputs) external onlyOwner {
        maxFeeOutputs = _maxFeeOutputs;
    }
    
    function setBitSendAddress(address _bitsend) external onlyOwner {
        bitSend = _bitsend;
    }

	function claimYield(uint256 amount) external onlyOwner {
		BLAST.claimYield(address(this), address(this), amount);
    }

	function claimAllYield() external onlyOwner {
		BLAST.claimAllYield(address(this), address(this));
    }
}

