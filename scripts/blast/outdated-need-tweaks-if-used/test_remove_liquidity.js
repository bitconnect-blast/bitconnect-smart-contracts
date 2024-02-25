const hre = require("hardhat");
require("dotenv").config();

async function main() {

//CHECK BEFORE RUN********************************************************************************
const routerAddress = "0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756"; //from last deploy
const tokenAddressToRemoveLiq = "0x5c3af666e0A2f2409BAe8C5F926CcbA23F0D96e9";
const pairAddress = "0x8fab7BA19531e22817A38141e4b752db5E377554";
//************************************************************************************************

//get deployer address
const deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION, hre.ethers.provider);
console.log("Deployer Address: ", deployer.address);

const Router = await hre.ethers.getContractFactory("BitDexRouter");
const LPToken = await hre.ethers.getContractFactory("BitDexPair");

const router = Router.attach(routerAddress);
const lpToken = LPToken.attach(pairAddress);

//check balance of deployer of LP token
const deployerLpTokenBalance = await lpToken.balanceOf(deployer.address);
console.log("Deployer LP Token Balance:", hre.ethers.utils.formatEther(deployerLpTokenBalance));

//pair reserves
const reserves = await lpToken.getReserves();
console.log("Reserves:", reserves);

//approve token to router
const approveTxn = await lpToken.approve(router.address, hre.ethers.utils.parseEther("10000000"));
await approveTxn.wait();
console.log("lpToken approved for Router");

const liquidityAmount = hre.ethers.utils.parseEther("0.00999");
const amountTokenMin = hre.ethers.utils.parseEther("0.03");
const amountETHMin = hre.ethers.utils.parseEther("0.003");


// function removeLiquidityETH or removeLiquidityETHSupportingFeeOnTransferTokens(
//     address token,
//     uint liquidity,
//     uint amountTokenMin,
//     uint amountETHMin,
//     address to,
//     uint deadline
const removeLiquidityTxn = await router.removeLiquidityETHSupportingFeeOnTransferTokens(
    tokenAddressToRemoveLiq,
    liquidityAmount,
    amountTokenMin,
    amountETHMin,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 120, //120 minutes
)

await removeLiquidityTxn.wait();

console.log("Liquidity removed from BitSwapRouter");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


