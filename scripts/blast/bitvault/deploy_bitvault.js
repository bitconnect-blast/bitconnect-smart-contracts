const hre = require("hardhat");

async function main(verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const BitVault = await hre.ethers.getContractFactory("BitVault");

  //  constructor(address _bitToken, address _feeManager, uint256 _minClaimRateBips, address _gasFeeTo)
  const bitVault = await BitVault.connect(deployer).deploy(
    process.env.BITCONNECT_TOKEN_ADDRESS,
    process.env.BLAST_FEE_MANAGER,
    process.env.MIN_CLAIM_RATE_BIPS,
    process.env.BLAST_GAS_FEE_TO
  );

  await bitVault.deployed();

  console.log("BitVault deployed to:", bitVault.address);

  if(verify){
    let BITVAULT_VERIFIED = false; //leave as true if not verifying

    while(!BITVAULT_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying BitVault contract on Etherscan...');
            await hre.run('verify:verify', {
            address: bitVault.address,
            constructorArguments: [
                process.env.BITCONNECT_TOKEN_ADDRESS,
                process.env.BLAST_FEE_MANAGER,
                process.env.MIN_CLAIM_RATE_BIPS,
                process.env.BLAST_GAS_FEE_TO
            ],
        });

        console.log('BitVault contract verified on Etherscan');  
        BITVAULT_VERIFIED = true;  

    } catch(error) {
        console.log('BitVault contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
        console.log('BitVault contract already verified on Etherscan');
        BITVAULT_VERIFIED = true;
        } else {
        console.log('BitVault contract not verified. Trying again...');
        }
    }    
    }
  }

  return bitVault;
}

module.exports = {
  main
};