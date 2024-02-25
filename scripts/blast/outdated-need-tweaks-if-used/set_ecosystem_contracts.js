const hre = require("hardhat");

//npx hardhat run scripts/blast/utils/set_ecosystem_contracts.js --network blast_sepolia

async function main() {
    const feeManagerAddress = process.env.BLAST_FEE_MANAGER; 
    const ecosystemContracts = [
        process.env.BLAST_DISPERSE, //disperse (bitsend)
    ]; //from last deploy

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const FeeManager = await hre.ethers.getContractFactory("FeeManager");
    const feeManager = FeeManager.attach(feeManagerAddress);

    const setEcosystemContracts = await feeManager.connect(deployer).setEcosystemContracts(ecosystemContracts);
    await setEcosystemContracts.wait();

    console.log("Ecosystem contracts set to: ", ecosystemContracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


