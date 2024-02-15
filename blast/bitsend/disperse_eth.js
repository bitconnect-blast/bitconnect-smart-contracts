const hre = require("hardhat");

//npx hardhat run scripts/blast/disperse/disperse_eth.js --network blast_sepolia

async function main() {
    //CHECK BEFORE RUN********************************************************************************
    const disperseAddress = process.env.BLAST_DISPERSE; 
    const disperseAddresses = [
        "0x7128966d2a9D4E0cEc363aDE4eEb822a4b33F49E", //documented
        "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A",
        "0xc9EEf1AC28378EebaF74f0410586AC8f2E2FC56C"
    ]; 
    const disperseAmounts = [
        hre.ethers.utils.parseEther("0.0000000000011"),
        hre.ethers.utils.parseEther("0.0000000000011"),
        hre.ethers.utils.parseEther("0.0000000000011"),
    ];
    //************************************************************************************************

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const Disperse = await hre.ethers.getContractFactory("Disperse");
    const disperse = Disperse.attach(disperseAddress);

    const totalEthToDisperse = disperseAmounts.reduce((a, b) => a.add(b), hre.ethers.BigNumber.from("0"));

    const disperseEther = await disperse.connect(deployer).disperseEther(disperseAddresses, disperseAmounts, {
        value: totalEthToDisperse
    });
    await disperseEther.wait();
    await disperseEther.wait();

    console.log("Dispersed Ether to: ", disperseAddresses);
    console.log("Dispersed amounts: ", disperseAmounts);
    console.log("Transaction Hash: ", disperseEther.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});


