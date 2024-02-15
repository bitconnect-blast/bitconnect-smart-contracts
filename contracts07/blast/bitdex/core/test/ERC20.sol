pragma solidity =0.5.16;

import '../BitDexERC20.sol';

contract ERC20 is BitDexERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
