const deployBitconnect = require("./bitconnect/deploy_bitconnect_token").main;
const deployBitVest = require("./bitvest/deploy_vesting").main;
const deployBitVault = require("./bitvault/deploy_bitvault").main;
/**
 * 
 * {
  "timestamp": 1707361132,
  "deployer": "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
  "BLAST_FEE_MANAGER": "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F",
  "BITDEX_FACTORY_ADDRESS": "0xD222cb17af8f6536466b0D031b675bf47B9E53c2",
  "BITDEX_INIT_CODE_HASH": "de65e754d02863894a956ecb9984b37843313131c7f4ce88df614f7cc1feefd1",
  "BITDEX_ROUTER_ADDRESS": "0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756",
  "MULTICALL_ADDRESS": "0x6179bAec451c2aF7A9695F5d3e9De4B32be9005c",
  "BITCONNECT_ADDRESS": "0x1aCe453160667A265729cd443fAaD14b9a0ED7c9" (tax not working), "0x67895830ECB2c9360ABdacc619029884E8cB01BA" (removed block.number checking for fees)
  "BITVEST_ADDRESS": "null",
  "BITVAULT_ADDRESS": "null",
  "BITLOCK_ADDRESS": "null",
  "BITSEND_ADDRESS": "null",
  "BITMINER_ADDRESS": "null",
  "MOCK_TOKEN_ADDRESS": "0x5c3af666e0A2f2409BAe8C5F926CcbA23F0D96e9",
  "NOTES": "null"
}
 * 
 */

async function main() {
  deployBitVaultScratchpad()
}

//4. BitVest (bitTokenAddress, vestedTokenTotalAmount, vestingStartTime, feeManager, minClaimRateBips, gasFeeTo)
async function deployBitVaultScratchpad() {
  process.env.BITCONNECT_TOKEN_ADDRESS = "0x1aCe453160667A265729cd443fAaD14b9a0ED7c9";
  process.env.TOTAL_AMOUNT_BIT_TO_VEST = "1000000000000000000000000";
  process.env.VESTING_START_TIME = "1707361132";
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";
  process.env.MIN_CLAIM_RATE_BIPS = 7500;  
  process.env.BLAST_GAS_FEE_TO = "0xcfA3a87FA00e9dc5024Da39B887B9056ec73E08A";
  const verify = false;
  const bitVault = await deployBitVault(verify);
  console.log("BitVault Address: ", bitVault.address);
}

async function testBitVault() {}

async function deployBitVestScratchpad() {}


async function deployBitconnectScratchpad() {
  /**
   * Deploy Bitconnect Testnet Token
   */

  process.env.BITDEX_ROUTER_ADDRESS = "0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756";
  process.env.BLAST_FEE_MANAGER = "0xd48e7ECb4f5e6fD813791423680C55F8AFfbB97F";

  const verify = false;
  const bitconnectAddress = await deployBitconnect(verify);

  console.log("Bitconnect Address: ", bitconnectAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });