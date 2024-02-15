const hre = require("hardhat");
require("dotenv").config();


async function main(verify) {

  const feeTo = process.env.BITDEX_FEE_TO;
  const feeManager = process.env.BLAST_FEE_MANAGER; //(memory in-session env)
  const minClaimRateBips = process.env.MIN_CLAIM_RATE_BIPS;
  const intervalToTransferToFeeManager = process.env.INTERVAL_TO_TRANSFER_TO_FEE_MANAGER;

  const [deployer] = await hre.ethers.getSigners();
  const feeToSetter = deployer.address;//for testing
  
  // const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
  // const factory = await Factory.connect(deployer).deploy(feeToSetter);

  const Factory = await hre.ethers.getContractFactory("BitDexFactory");
  const factory = await Factory.connect(deployer).deploy(
    feeToSetter,
    feeManager,
    minClaimRateBips,
    intervalToTransferToFeeManager
  );

  await factory.deployed();

  // set feeTo
  const setFeeToTx = await factory.connect(deployer).setFeeTo(feeTo);
  await setFeeToTx.wait();

  //get init commit hash
  const initCodeHash = await factory.INIT_CODE_HASH();

  // console.log(

  //   `========================
  //   \nFactory Deployed to: ${factory.address}
  //   \nINIT_CODE_HASH: ${initCodeHash}
  //   \nfeeToSetter: ${feeToSetter.address}
  //   \nfeeTo: ${feeTo}
  //   \nPaste INIT_CODE_HASH into BitDexLibrary.sol Line 24 (excluding 0x)
  //   \n========================`
  // );
  
  if(verify){
    let FACTORY_VERIFIED = false;
    while(!FACTORY_VERIFIED){
      try{
          //wait 5 seconds
          await new Promise(r => setTimeout(r, 5000));

          console.log('Verifying Factory contract on Etherscan...');
              await hre.run('verify:verify', {
              address: factory.address,
              constructorArguments: [
                  deployer.address, 
                  feeManager,
                  minClaimRateBips,
                  intervalToTransferToFeeManager
              ],
          });

          console.log('Factory contract verified on Etherscan');  
          FACTORY_VERIFIED = true;  

      } catch(error) {
          console.log('Factory contract verification failed');
          console.log(error);
          //if error contains "already" then contract is already verified and set VERIFIED to true
          if(error.toString().includes("already")) {
          console.log('Factory contract already verified on Etherscan');
          FACTORY_VERIFIED = true;
          } else {
          console.log('Factory contract not verified. Trying again...');
          }
      }    
    }
  }

  const outStruct = {
    factoryAddress: factory.address,
    initCodeHash: initCodeHash.replace(/^0x/, '') //trim off 0x for replacement in BitDexLibrary
  }

  return outStruct;
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
