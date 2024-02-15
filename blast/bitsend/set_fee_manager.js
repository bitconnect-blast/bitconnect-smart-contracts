const hre = require("hardhat");

async function main() {
    //CHECK BEFORE RUN********************************************************************************
    const disperseAddress = "0xa6A2cFCE6EAE855E3189fa087e67541F80B7ef54"; //check for latest deploy
    const feeManagerAddress = "0x88D4FfA816Bee9E7312F162a6cd1E41d1ce3A9f3";
    //************************************************************************************************

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const Disperse = await hre.ethers.getContractFactory("Disperse");
    const disperse = Disperse.attach(disperseAddress);

    const setFeeManager = await disperse.connect(deployer).setGovernor(feeManagerAddress);
    await setFeeManager.wait();

    console.log("Disperse/Bitsend fee manager set to: ", feeManagerAddress);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


