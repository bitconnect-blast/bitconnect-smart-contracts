const hre = require("hardhat");

//npx hardhat run scripts/blast/utils/claim_ecosystem_gas.js --network blast_sepolia

async function main() {
    const feeManagerAddress = process.env.BLAST_FEE_MANAGER;

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const FeeManager = await hre.ethers.getContractFactory("FeeManager");
    const feeManager = FeeManager.attach(feeManagerAddress);

    // read feeManager ETH balance before claiming
    const feeManagerBalanceBeforeClaim = await hre.ethers.provider.getBalance(feeManagerAddress);

    // claim all fully vested gas
    const claimFullyVestedGas = await feeManager.connect(deployer).claimVestedGas();
    await claimFullyVestedGas.wait();

    // read feeManager ETH balance after claiming
    const feeManagerBalanceAfterClaimVested = await hre.ethers.provider.getBalance(feeManagerAddress);

    // claim all gas regardless of tax
    const claimAllGas = await feeManager.connect(deployer).claimAllGas();
    await claimAllGas.wait();

    // read feeManager ETH balance after claiming
    const feeManagerBalanceAfterClaimAll = await hre.ethers.provider.getBalance(feeManagerAddress);

    // calculate claimed ETH
    const claimedVestedEth = feeManagerBalanceAfterClaimVested.sub(feeManagerBalanceBeforeClaim);    
    // calculate claimed ETH
    const claimedEthAll = feeManagerBalanceAfterClaimAll.sub(feeManagerBalanceAfterClaimVested);

    console.log("Claimed Fully Vested Gas (Ether):", hre.ethers.utils.formatEther(claimedVestedEth));
    console.log("Claimed All Gas (Ether):", hre.ethers.utils.formatEther(claimedEthAll));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

/**
 * Testing
 * 1. I did a few transactions with disperse and claimed both vested and all gas
 *  Vested: 0.00000000010558488
 *  All:    0.000000000057648968
 * 
 * The question is how to know how much gas is available to claim at what tax rate?
 */