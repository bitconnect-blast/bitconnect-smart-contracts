const hre = require("hardhat");
require("dotenv").config();


async function main(verify) {

  const feeTo = process.env.BITDEX_FEE_TO;
  const feeManager = process.env.BLAST_FEE_MANAGER; //(memory in-session env)

  const [deployer] = await hre.ethers.getSigners();
  const feeToSetter = deployer.address;//for testing
  
  // const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
  // const factory = await Factory.connect(deployer).deploy(feeToSetter);

  const BitDexFactory = await hre.ethers.getContractFactory("BitDexFactory");
  const bitDexFactory = await BitDexFactory.connect(deployer).deploy(
    feeToSetter,
    feeManager
  );

  await bitDexFactory.deployed();

  // set feeTo
  const setFeeToTx = await bitDexFactory.connect(deployer).setFeeTo(feeTo);
  await setFeeToTx.wait();

  //get init commit hash
  const initCodeHash = await bitDexFactory.INIT_CODE_HASH();
  
  if(verify){
    let FACTORY_VERIFIED = false;
    while(!FACTORY_VERIFIED){
      try{
          //wait 5 seconds
          await new Promise(r => setTimeout(r, 5000));

          console.log('Verifying Factory contract on Etherscan...');
              await hre.run('verify:verify', {
              address: bitDexFactory.address,
              constructorArguments: [
                  deployer.address, 
                  feeManager
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
    factoryInstance: bitDexFactory,
    initCodeHash: initCodeHash.replace(/^0x/, '') //trim off 0x for replacement in BitDexLibrary
  }

  return outStruct;
}

module.exports = {
  main
}
