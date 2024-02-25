const hre = require("hardhat");

//npx hardhat run scripts/blast/utils/view_gas_params.js --network blast_sepolia

async function main() {
    const feeManagerAddress = process.env.BLAST_FEE_MANAGER; 
    const contractToViewParams = process.env.BLAST_DISPERSE; //disperse (bitsend)

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const FeeManager = await hre.ethers.getContractFactory("FeeManager");
    const feeManager = FeeManager.attach(feeManagerAddress);

    // Call the gasParams function and log the result
    const gasParamsResult = await feeManager.connect(deployer).gasParams(contractToViewParams);

    const gasModes = ['VOID', 'CLAIMABLE']; //see IBlast
    const gasModeString = gasModes[gasParamsResult[3]] || `Unknown (${gasParamsResult[3]})`;

    console.log(`Gas Params for ${contractToViewParams}:`);
    console.log("Ether Seconds:", gasParamsResult[0].toString());
    console.log("Ether Balance:", hre.ethers.utils.formatEther(gasParamsResult[1]));
    console.log("Last Updated:", gasParamsResult[2].toString()); // Displaying raw timestamp
    console.log("Gas Mode:", gasModeString);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});