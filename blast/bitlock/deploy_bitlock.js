const hre = require("hardhat");

async function main() {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();
  const factoryAddress = "0x02E8a1343701d236F74D145a69bAF0FE40E7e207"; // our uni v2 fork factory address

  /**
   * Later, add address and amount for bitconnect token which will be used as referral token
   */

  const Locker = await hre.ethers.getContractFactory("UniswapV2Locker");
  const locker = await Locker.connect(deployer).deploy(factoryAddress);

  await locker.deployed();

  console.log(
    `========================
    \nLocker Deployed to: ${locker.address}
    \nUniswap Factory Input: ${factoryAddress}
    \n========================`
  );

  let LOCKER_VERIFIED = false;

  while(!LOCKER_VERIFIED){
  try{
      //wait 5 seconds
      await new Promise(r => setTimeout(r, 5000));

      console.log('Verifying Locker contract on Etherscan...');
          await hre.run('verify:verify', {
          address: locker.address,
          constructorArguments: [
              factoryAddress, 
          ],
      });

      console.log('Factory contract verified on Etherscan');  
      LOCKER_VERIFIED = true;  

  } catch(error) {
      console.log('Factory contract verification failed');
      console.log(error);
      //if error contains "already" then contract is already verified and set VERIFIED to true
      if(error.toString().includes("already")) {
      console.log('Factory contract already verified on Etherscan');
      LOCKER_VERIFIED = true;
      } else {
      console.log('Factory contract not verified. Trying again...');
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
