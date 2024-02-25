const hre = require("hardhat");
require("dotenv").config();

async function main(bitconnect, presaleAddresses, presaleAmounts, verify) {
  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const Vesting = await hre.ethers.getContractFactory("BitconnectVesting");

  // constructor(address _token, uint256 _vestedTokenTotalAmount, uint256 _vestingStartTime, address _feeManager, address _blast, address _blastPoints, address _pointOperator)

  const vesting = await Vesting.connect(deployer).deploy(
    process.env.BITCONNECT_TOKEN_ADDRESS,
    process.env.VESTING_START_TIME,
    process.env.BLAST_FEE_MANAGER,
    process.env.BLAST_ADDRESS,
    process.env.BLAST_POINTS_ADDRESS,
    process.env.BLAST_POINTS_OPERATOR_ADDRESS
  );

  //deployer sends tokens to BitVest ()
  const sendBitToBitVest = await bitconnect.connect(deployer).transfer(vesting.address, ethers.utils.parseEther("500000000"));
  await sendBitToBitVest.wait();
  console.log("BIT Funds transferred to BitVest (50%): ", hre.ethers.utils.formatEther(hre.ethers.utils.parseEther("500000000")));

  //vesting schedules are set for each presale user
  const setSchedules = await vesting.batchSetUserAmountToBeVested(presaleAddresses, presaleAmounts);
  const setSchedulesReceipt = await setSchedules.wait();
  console.log("Vesting Schedules Set...");
  console.log(`Gas used for setting vesting schedules of length ${presaleAddresses.length}: ${setSchedulesReceipt.gasUsed.toString()}`);
  const estimatedGasPerAddress = setSchedulesReceipt.gasUsed.div(presaleAddresses.length);
  const estimatedTotalGasFor300Addresses = estimatedGasPerAddress.mul(300);
  console.log(`Estimated gas for setting vesting schedules for 300 addresses: ${estimatedTotalGasFor300Addresses.toString()}`);

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
                process.env.BLAST_FEE_MANAGER,
                process.env.BLAST_ADDRESS,
                process.env.BLAST_POINTS_ADDRESS,
                process.env.BLAST_POINTS_OPERATOR_ADDRESS
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
