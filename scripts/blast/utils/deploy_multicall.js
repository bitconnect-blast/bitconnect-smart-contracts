const hre = require("hardhat");

async function main(verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Multicall = await hre.ethers.getContractFactory("Multicall");
  const multicall = await Multicall.connect(deployer).deploy();
  await multicall.deployed();

  if(verify){
    let MULTICALL_VERIFIED = false;

    while(!MULTICALL_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying Multicall contract on Etherscan...');
            await hre.run('verify:verify', {
            address: multicall.address,
            constructorArguments: [],
        });

        console.log('Multicall contract verified on Etherscan');  
        MULTICALL_VERIFIED = true;  

    } catch(error) {
        console.log('Multicall contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
        console.log('Multicall contract already verified on Etherscan');
        MULTICALL_VERIFIED = true;
        } else {
        console.log('Multicall contract not verified. Trying again...');
        }
    }    
    }
  }

  return multicall;
}

module.exports = {
  main
};