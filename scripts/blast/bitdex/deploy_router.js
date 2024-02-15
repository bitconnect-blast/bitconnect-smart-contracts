const hre = require("hardhat");
require("dotenv").config();

async function main(verify) {

  const factoryAddress = process.env.BITDEX_FACTORY_ADDRESS; //from last deploy, set in deploy_factory
  const WETH_Address = process.env.WETH_ADDRESS; 
  const feeManager = process.env.BLAST_FEE_MANAGER;
  const minClaimRateBips = process.env.MIN_CLAIM_RATE_BIPS; //N/10000

  console.log("Confirm all parameters:");
  console.log("factory: ", factoryAddress);
  console.log("WETH: ", WETH_Address);
  

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();
  const feeToSetter = deployer.address;

  // const Router = await hre.ethers.getContractFactory("UniswapV2Router02");
  // const router = await Router.connect(deployer).deploy(factoryAddress, WETH_Address);  
  const Router = await hre.ethers.getContractFactory("BitDexRouter");
  const router = await Router.connect(deployer).deploy(factoryAddress, WETH_Address, feeManager, feeToSetter, minClaimRateBips);


  await router.deployed();


  // console.log(

  //   `========================
  //   \nRouter Deployed to: ${router.address}
  //   \n========================`
  // );
  if(verify){
    let ROUTER_VERIFIED = false;
    while(!ROUTER_VERIFIED){
      try{
          //wait 5 seconds
          await new Promise(r => setTimeout(r, 5000));

          console.log('Verifying Router contract on Etherscan...');
          await hre.run('verify:verify', {
              address: router.address,
              constructorArguments: [
                  factoryAddress, 
                  WETH_Address, 
                  feeManager,
                  feeToSetter,
                  minClaimRateBips
              ],
          });

          console.log('Router contract verified on Etherscan');  
          ROUTER_VERIFIED = true;  

      } catch(error) {
          console.log('Router contract verification failed');
          console.log(error);
          //if error contains "already" then contract is already verified and set VERIFIED to true
          if(error.toString().includes("already")) {
          console.log('Router contract already verified on Etherscan');
          ROUTER_VERIFIED = true;
          } else {
          console.log('Router contract not verified. Trying again...');
          }
      }    
    }
  }

  return router.address;
}

module.exports = {
  main
}

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
