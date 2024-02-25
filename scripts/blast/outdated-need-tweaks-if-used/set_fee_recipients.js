const hre = require("hardhat");

//npx hardhat run scripts/blast/utils/set_fee_recipients.js --network blast_sepolia

async function main() {
    //CHECK BEFORE RUN********************************************************************************
    const feeManagerAddress = process.env.BLAST_FEE_MANAGER; 
    const feeRecipients = [
        "0x7128966d2a9D4E0cEc363aDE4eEb822a4b33F49E", //documented
        "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A",
        "0xc9EEf1AC28378EebaF74f0410586AC8f2E2FC56C"
    ]; 
    const feeBps = [5000, 3200, 1800]; //adds to 10000
    //************************************************************************************************

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const FeeManager = await hre.ethers.getContractFactory("FeeManager");
    const feeManager = FeeManager.attach(feeManagerAddress);

    const setEcosystemContracts = await feeManager.connect(deployer).setBps(feeRecipients, feeBps);
    await setEcosystemContracts.wait();

    console.log("Fee recipients set to: ", feeRecipients);
    console.log("Fee bips set to: ", feeBps);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


