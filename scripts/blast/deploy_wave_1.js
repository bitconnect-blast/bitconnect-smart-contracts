const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});
const deployFeeManager = require("./utils/deploy_fee_manager").main;
const deployBitDexFactory = require("./bitdex/deploy_factory").main; 
const deployBitDexRouter = require("./bitdex/deploy_router").main;
const deployMulticall = require("./utils/deploy_multicall").main;
const deployBitconnect = require("./bitconnect/deploy_bitconnect_token").main;
const deployBitVest = require("./bitvest/deploy_vesting").main;
const deployBitSend = require("./bitsend/deploy_bitsend").main;

//verify all contracts in run?
VERIFY = true;

async function main() {
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION, ethers.provider);

    // //deploy fee manager with >0.8
    // process.env.USE_CONTRACTS_07 = "false";
    // const feeManager = await deployFeeManager(VERIFY);
    // process.env.BLAST_FEE_MANAGER = feeManager;

    //deploy bitdex contracts with <0.8
    process.env.USE_CONTRACTS_07 = "true";
    const bitDexFactory = await deployBitDexFactory(VERIFY);
    process.env.BITDEX_FACTORY_ADDRESS = bitDexFactory.factoryInstance.address;
    process.env.BITDEX_INIT_CODE_HASH = bitDexFactory.initCodeHash;
    replaceAnyInitCodeHash(bitDexFactory.initCodeHash);
    
    const router = await deployBitDexRouter(VERIFY);
    process.env.BITDEX_ROUTER_ADDRESS = router.address;
    
    const multicall = await deployMulticall(VERIFY);
    process.env.MULTICALL_ADDRESS = multicall.address;

    //back to >0.8 for the rest
    process.env.USE_CONTRACTS_07 = "false";
    const bitconnect = await deployBitconnect(VERIFY);
    process.env.BITCONNECT_TOKEN_ADDRESS = bitconnect.address;

    //set vesting start time to 1 minute from now
    process.env.VESTING_START_TIME = Math.floor(new Date().getTime() / 1000) + 60;
    const bitVest = await deployBitVest(VERIFY);
    process.env.BITVEST_ADDRESS = bitVest.address;

    const bitSend = await deployBitSend(VERIFY);
    process.env.BITSEND_ADDRESS = bitSend.address;

    if(hre.network.name != "hardhat") writeEnvToJson(deployer);

    console.log("DEPLOY ADDRESSES: ");
    console.log("FeeManager Address: ", process.env.BLAST_FEE_MANAGER);
    console.log("BitDexFactory Address: ", process.env.BITDEX_FACTORY_ADDRESS);
    console.log("BitDexRouter Address: ", process.env.BITDEX_ROUTER_ADDRESS);
    console.log("Multicall Address: ", process.env.MULTICALL_ADDRESS);
    console.log("BitConnect Address: ", process.env.BITCONNECT_TOKEN_ADDRESS);
    console.log("BitVest Address: ", process.env.BITVEST_ADDRESS);
    console.log("BitSend Address: ", process.env.BITSEND_ADDRESS);
}

//==================================================================
// Helpers
//==================================================================

function writeEnvToJson(deployer) {
    //writes the process.env values for certain keys to a .json file
    const env = process.env;
    const keys = [
        "timestamp",
        "deployer",
        "BLAST_FEE_MANAGER",
        "BITDEX_FACTORY_ADDRESS",
        "BITDEX_INIT_CODE_HASH",
        "BITDEX_ROUTER_ADDRESS",
        "MULTICALL_ADDRESS",
        "BITVEST_ADDRESS",
        "BITVAULT_ADDRESS",
        "BITLOCK_ADDRESS",
        "BITSEND_ADDRESS",
        "BITMINER_ADDRESS",
        "BITCONNECT_TOKEN_ADDRESS",
        "NOTES"
    ];
    //write each of these keys to a .json file if they aren't blank
    //json file name is based on address of fee manager (first 8 chars)
    const feeManager = env.BLAST_FEE_MANAGER;
    const feeManagerShort = feeManager.substring(0, 8);
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const jsonFileName = `deploys/deployed_${feeManagerShort}_${timestamp}.json`;
    const json = {};
    keys.forEach(key => {
        if(key === "timestamp"){
            json[key] = timestamp;
        } else if(key === "deployer"){
            json[key] = deployer.address;
        } else if (!env[key]) {
            json[key] = "null";
        } else {
            json[key] = env[key];
        }
    });
    fs.writeFileSync(jsonFileName, JSON.stringify(json, null, 2));
    console.log(`Wrote deployed addresses to ${jsonFileName}`);
}

// Function to replace the init code hash in BitDexLibrary.sol
async function replaceAnyInitCodeHash(newHash) {
    const filePath = path.join(__dirname, '../../contracts07/blast/bitdex/periphery/libraries/BitDexLibrary.sol');
    // const filePath = path.join(__dirname, '../../contracts07/blast/uniswap-v2-fork-reference/periphery/libraries/UniswapV2Library.sol');
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // This regex matches any hex string in the format hex'...'
        const oldHashRegex = /hex'[0-9a-fA-F]{64}'/g;
        const newHashFormatted = `hex'${newHash}'`;
        content = content.replace(oldHashRegex, newHashFormatted);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Init code hash replaced successfully.');
    } catch (error) {
        console.error('Error replacing init code hash:', error);
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

