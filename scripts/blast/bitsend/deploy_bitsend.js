const hre = require("hardhat");
require("dotenv").config();

async function main() {

  //INPUT: FEE MANAGER ADDRESS
  const feeManagerAddress = process.env.BLAST_FEE_MANAGER; 

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Disperse = await hre.ethers.getContractFactory("BitSend");
  const disperse = await Disperse.connect(deployer).deploy(feeManagerAddress);

  await disperse.deployed();

  console.log(

    `========================
    \n Disperse Deployed to: ${disperse.address}
    \n========================`
  );

  let DISPERSE_VERIFIED = true; //leave as true if not verifying

  while(!DISPERSE_VERIFIED){
  try{
      //wait 5 seconds
      await new Promise(r => setTimeout(r, 5000));

      console.log('Verifying Disperse contract on Etherscan...');
          await hre.run('verify:verify', {
          address: disperse.address,
          constructorArguments: [feeManagerAddress],
      });

      console.log('Disperse contract verified on Etherscan');  
      DISPERSE_VERIFIED = true;  

  } catch(error) {
      console.log('Disperse contract verification failed');
      console.log(error);
      //if error contains "already" then contract is already verified and set VERIFIED to true
      if(error.toString().includes("already")) {
      console.log('Disperse contract already verified on Etherscan');
      DISPERSE_VERIFIED = true;
      } else {
      console.log('Disperse contract not verified. Trying again...');
      }
  }    
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//deploys
/**
 * 1. 0xa6A2cFCE6EAE855E3189fa087e67541F80B7ef54
 */