const hre = require("hardhat");

async function main(verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.connect(deployer).deploy();

  await feeManager.deployed();

  // console.log(

  //   `========================
  //   \n FeeManager Deployed to: ${feeManager.address}
  //   \n========================`
  // );
  if(verify){
    let FEEMANAGER_VERIFIED = true; //leave as true if not verifying

    while(!FEEMANAGER_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying FeeManager contract on Etherscan...');
            await hre.run('verify:verify', {
            address: feeManager.address,
            constructorArguments: [],
        });

        console.log('FeeManager contract verified on Etherscan');  
        FEEMANAGER_VERIFIED = true;  

    } catch(error) {
        console.log('FeeManager contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
        console.log('FeeManager contract already verified on Etherscan');
        FEEMANAGER_VERIFIED = true;
        } else {
        console.log('FeeManager contract not verified. Trying again...');
        }
    }    
    }
  }

  return feeManager.address;
}

module.exports = {
  main
};