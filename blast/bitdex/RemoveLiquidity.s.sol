// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

/**
check CHAIN_ID before running!

forge script scripts/blast/bitdex/RemoveLiquidity.s.sol:RemoveLiquidity --fork-url $BLAST_TESTNET_URL --private-key $PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION

--broadcast

 */
import "lib/forge-std/src/Script.sol";

interface IBitDexRouter {  
    function WETH() external pure returns (address);  
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract RemoveLiquidity is Script {
    function setUp() public {}

    IBitDexRouter router = IBitDexRouter(0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756);
    address pair = 0x8fab7BA19531e22817A38141e4b752db5E377554;
    address token = 0x5c3af666e0A2f2409BAe8C5F926CcbA23F0D96e9;
    function run() public {
        vm.startBroadcast();

            //approve the router to spend my tokens
            IERC20(pair).approve(address(router), type(uint256).max);

            router.removeLiquidityETH(
                token, 
                0.009 ether, 
                0, 
                0, 
                msg.sender, 
                block.timestamp + 1 days
            );

        vm.stopBroadcast();
    }
}