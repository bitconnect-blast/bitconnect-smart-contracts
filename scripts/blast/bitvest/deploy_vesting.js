const hre = require("hardhat");
require("dotenv").config();

async function main() {

  //INPUT: FEE MANAGER ADDRESS
  const feeManagerAddress = process.env.BLAST_FEE_MANAGER; 

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Vesting = await hre.ethers.getContractFactory("BitconnectVesting");
  const vesting = await Vesting.connect(deployer).deploy(feeManagerAddress);

  await vesting.deployed();

  console.log(

    `========================
    \n BitconnectVesting Deployed to: ${vesting.address}
    \n========================`
  );

  let VESTING_VERIFIED = true; //leave as true if not verifying

  while(!VESTING_VERIFIED){
  try{
      //wait 5 seconds
      await new Promise(r => setTimeout(r, 5000));

      console.log('Verifying Vesting contract on Etherscan...');
          await hre.run('verify:verify', {
          address: vesting.address,
          constructorArguments: [feeManagerAddress],
      });

      console.log('Vesting contract verified on Etherscan');  
      VESTING_VERIFIED = true;  

  } catch(error) {
      console.log('Vesting contract verification failed');
      console.log(error);
      //if error contains "already" then contract is already verified and set VERIFIED to true
      if(error.toString().includes("already")) {
      console.log('Vesting contract already verified on Etherscan');
      VESTING_VERIFIED = true;
      } else {
      console.log('Vesting contract not verified. Trying again...');
      }
  }    
  }

  // Return an object with vesting contract address and fee manager address
  return {
    vesting: {
      address: vesting.address,
      feeManagerAddress: feeManagerAddress
    }
  };
}

// Export the main function to be callable from another script
module.exports = { deployVesting: main };

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
