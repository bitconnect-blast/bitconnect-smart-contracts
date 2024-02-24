const hre = require("hardhat");
const deployFeeManager = require("./utils/deploy_fee_manager").main;
const deployBitconnect = require("./bitconnect/deploy_bitconnect_token").main;
const deployBitLock = require("./bitlock/deploy_bitlock").main;
const deployBitVest = require("./bitvest/deploy_vesting").main;
const deployBitVault = require("./bitvault/deploy_bitvault").main;
const deployBitSend = require("./bitsend/deploy_bitsend").main;

/**
 * see deploys/testing.json for existing addresses used to fill in here
 */

async function main() {
  process.env.USE_CONTRACTS_07 = "false";
  const verify = true;
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION, ethers.provider);
  //deploy fee manager with >0.8
  const feeManager = await deployFeeManager(verify);
  process.env.BLAST_FEE_MANAGER = feeManager;
  console.log("FeeManager Address: ", feeManager.address);

  // const feeManager = await deployFeeManagerScratchpad(verify);

  // // const bitConnect = await deployBitconnectScratchpad(verify);
  // // process.env.BITCONNECT_TOKEN_ADDRESS = "0x504Bf0Ba6B63fDef91eE61f8b9EaD4741f6F437e"
  // // const bitConnect = await hre.ethers.getContractAt("BITCONNECT", process.env.BITCONNECT_TOKEN_ADDRESS);
  // // const bitVest = await deployBitVestScratchpad(verify);
  // // await bitconnectExemptEcosystemContractsFromLimits(bitConnect, bitVest, deployer);
  // // await approveBitVestAsBitSpenderAndDeposit(bitConnect, bitVest, deployer);

  // //after this, manually set vesting schedule for deployer as a test, then set vesting schedule start timestamp, check vested amounts, and claim.

  // // const bitSend = await deployBitSendScratchpad(verify);

  // // const bitLock = await deployBitLockScratchpad(verify);
  const bitVault = await deployBitVaultScratchpad(verify);
}

async function deployBitLockScratchpad(verify) {
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const bitLock = await deployBitLock(verify);
  return bitLock;
}

async function deployBitSendScratchpad(verify) {
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const bitSend = await deployBitSend(verify);
  console.log("BitSend Address: ", bitSend.address);
  return bitSend;
}

//4. BitVest (bitTokenAddress, vestedTokenTotalAmount, vestingStartTime, feeManager, minClaimRateBips, gasFeeTo)
async function deployBitVaultScratchpad(verify) {
  process.env.BITCONNECT_TOKEN_ADDRESS = "0x504Bf0Ba6B63fDef91eE61f8b9EaD4741f6F437e";
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;  
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const bitVault = await deployBitVault(verify);
  console.log("BitVault Address: ", bitVault.address);
  return bitVault;
}

async function deployBitVestScratchpad(verify) {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  process.env.BITCONNECT_TOKEN_ADDRESS = "0x504Bf0Ba6B63fDef91eE61f8b9EaD4741f6F437e";
  process.env.TOTAL_AMOUNT_BIT_TO_VEST = "9500000000000000000000000"; //9.5M (18-decimal)
  process.env.VESTING_START_TIME = timestampBefore + 3600; // +60 minutes unless set to be sooner
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;  
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const bitVest = await deployBitVest(verify);
  console.log("BitVest Address: ", bitVest.address);
  return bitVest;
}

async function bitconnectExemptEcosystemContractsFromLimits(bitConnect, bitVest, deployer) {
  //TODO: THIS WOULD NORMALLY BE IN ENV VARS!
  const exemptedContracts = [
    "0xfF0F72894d5Ad3E6051765cDe810c18A656947f6", // BitLock
    bitVest.address, // BitVest
    "0x4B0B5308CD3B4eFA64740db3aa6D54D8135dEb83", // BitVault
  ];
  // await bitConnect.connect(deployer).exemptFromLimits(exemptedContracts);
  console.log("Ecosystem contracts exempted from limits");
}

async function approveBitVestAsBitSpenderAndDeposit(bitconnect, bitVest, deployer) {
  process.env.TOTAL_AMOUNT_BIT_TO_VEST = "9500000000000000000000000"; //9.5M (18-decimal)
  await bitconnect.connect(deployer).approve(bitVest.address, process.env.TOTAL_AMOUNT_BIT_TO_VEST);
  await bitVest.connect(deployer).depositBit(process.env.TOTAL_AMOUNT_BIT_TO_VEST);
  console.log("BitVest approved as spender and deposit complete");
}

async function deployTheScammersNftScratchpad() {}

async function deployBitconnectScratchpad(verify) {
  /**
   * Deploy Bitconnect Testnet Token
   */

  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.BITDEX_ROUTER_ADDRESS = "0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756";
  // process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;  
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const bitconnectAddress = await deployBitconnect(verify);

  console.log("Bitconnect Address: ", bitconnectAddress);
}

// async function deployFeeManagerScratchpad(verify) {
//     const feeManager = await deployFeeManager(verify);
//     console.log("FeeManager Address: ", feeManager.address);
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });