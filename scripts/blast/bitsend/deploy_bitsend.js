const hre = require("hardhat");
require("dotenv").config();

async function main(verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Disperse = await hre.ethers.getContractFactory("BitSend");

  // constructor(address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo)
  const disperse = await Disperse.connect(deployer).deploy(
    process.env.BLAST_FEE_MANAGER
  );

  await disperse.deployed();

  let DISPERSE_VERIFIED = false; //leave as true if not verifying
  
  if(verify){
    while(!DISPERSE_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying Disperse contract on Etherscan...');
            await hre.run('verify:verify', {
            address: disperse.address,
            constructorArguments: [
              process.env.BLAST_FEE_MANAGER
            ],
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

  return disperse;

}

module.exports = { main };
