const hre = require("hardhat");

async function main() {

//CHECK BEFORE RUN********************************************************************************
const routerAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; //from last deploy
const tokenAddressToAddLiq = "0xbD5cBa686748EE152b92A3D6fE74C3BD97af3378";
//************************************************************************************************

//get deployer address
const [deployer] = await hre.ethers.getSigners();

// const Router = await hre.ethers.getContractFactory("BitDexRouter");
const Router = await hre.ethers.getContractFactory("UniswapV2Router02");
const Token = await hre.ethers.getContractFactory("MockERC20");

const router = Router.attach(routerAddress);
const token = Token.attach(tokenAddressToAddLiq);

//approve token to router
const approveTxn = await token.approve(router.address, hre.ethers.utils.parseEther("10000000"));
await approveTxn.wait();
console.log("Token approved for Router");

// function addLiquidityETH(
//     address token,
//     uint amountTokenDesired,
//     uint amountTokenMin,
//     uint amountETHMin,
//     address to,
//     uint deadline
const addLiquidityTxn = await router.addLiquidityETH(
    tokenAddressToAddLiq,
    hre.ethers.utils.parseEther("100"),
    hre.ethers.utils.parseEther("90"),
    hre.ethers.utils.parseEther("0.000001"),
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 20, //20 minutes
    { value: hre.ethers.utils.parseEther("0.000001") }
);

await addLiquidityTxn.wait();

console.log("Liquidity added to BitSwapRouter");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


