const hre = require("hardhat");

async function main(verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Locker = await hre.ethers.getContractFactory("BitLock");

  console.log("Environment Variables:", process.env.BLAST_FEE_MANAGER, process.env.MIN_CLAIM_RATE_BIPS, process.env.BLAST_GAS_FEE_TO);


  // constructor(address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo)
  const locker = await Locker.connect(deployer).deploy(
    process.env.BLAST_FEE_MANAGER,
    process.env.MIN_CLAIM_RATE_BIPS,
    process.env.BLAST_GAS_FEE_TO
  );

  console.log("locker deployed...");
  
  if(verify){
    let LOCKER_VERIFIED = false;

    while(!LOCKER_VERIFIED){
      try{
          //wait 5 seconds
          await new Promise(r => setTimeout(r, 5000));

          console.log('Verifying Locker contract on Etherscan...');
              await hre.run('verify:verify', {
              address: locker.address,
              constructorArguments: [
                process.env.BLAST_FEE_MANAGER,
                process.env.MIN_CLAIM_RATE_BIPS,
                process.env.BLAST_GAS_FEE_TO
              ],
          });

          console.log('Locker contract verified on Etherscan');  
          LOCKER_VERIFIED = true;  

      } catch(error) {
          console.log('Locker contract verification failed');
          console.log(error);
          //if error contains "already" then contract is already verified and set VERIFIED to true
          if(error.toString().includes("already")) {
            console.log('Locker contract already verified on Etherscan');
          LOCKER_VERIFIED = true;
          } else {
            console.log('Locker contract not verified. Trying again...');
          }
      }    
    }      
  }

  return locker;
}

module.exports = {
  main
}
