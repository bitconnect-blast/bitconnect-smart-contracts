// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

/**
check CHAIN_ID before running!

forge script scripts/blast/bitdex/ProvideLiquidity.s.sol:ProvideLiquidity --fork-url $BLAST_TESTNET_URL --private-key $PRIVATE_KEY_BLAST_SEPOLIA_TESTING 

--broadcast

 */
import "lib/forge-std/src/Script.sol";

interface IBitDexRouter {  
    function WETH() external pure returns (address);  
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

}

contract ProvideLiquidity is Script {
    function setUp() public {}

    IBitDexRouter router = IBitDexRouter(0x18096950a5985BfDE4C1df827250A90c76C5E3c7);
    address token = 0xd4773dFF6e3aBa2F5C38203E69E0A27BCC7DA3b7;
    function run() public {
        vm.startBroadcast();

            console.log("router WETH", address(router.WETH()));

            //approve the router to spend my tokens
            IERC20(token).approve(address(router), type(uint256).max);

            // router.addLiquidityETH(
            //     0xd4773dFF6e3aBa2F5C38203E69E0A27BCC7DA3b7, 
            //     100 * 10e18, 
            //     0, 
            //     0, 
            //     msg.sender, 
            //     block.timestamp + 1 days
            // );

        vm.stopBroadcast();
    }
}