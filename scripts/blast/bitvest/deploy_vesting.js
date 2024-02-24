const hre = require("hardhat");
require("dotenv").config();

async function main(verify) {
  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Vesting = await hre.ethers.getContractFactory("BitconnectVesting");

  // constructor(address _token, uint256 _vestedTokenTotalAmount, uint256 _vestingStartTime, address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo)

  const vesting = await Vesting.connect(deployer).deploy(
    process.env.BITCONNECT_TOKEN_ADDRESS,
    process.env.VESTING_START_TIME,
    process.env.BLAST_FEE_MANAGER
  );

  await vesting.deployed();

  if(verify){
    let VESTING_VERIFIED = false; //leave as true if not verifying

    while(!VESTING_VERIFIED){
      try{
          //wait 5 seconds
          await new Promise(r => setTimeout(r, 5000));

          console.log('Verifying Vesting contract on Etherscan...');
              await hre.run('verify:verify', {
              address: vesting.address,
              constructorArguments: [
                process.env.BITCONNECT_TOKEN_ADDRESS,
                process.env.VESTING_START_TIME,
                process.env.BLAST_FEE_MANAGER
              ],
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
  }

  // Return an object with vesting contract address and fee manager address
  return vesting;
}

// Export the main function to be callable from another script
module.exports = { main };

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
