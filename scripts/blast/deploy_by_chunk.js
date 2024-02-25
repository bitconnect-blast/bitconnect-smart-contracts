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
const deployBitVault = require("./bitvault/deploy_bitvault").main;
const deployBitLock = require("./bitlock/deploy_bitlock.js").main;


//CHECK BEFORE EACH RUN!
// compile with both settings just at beginning
const chunk = 3;
const VERIFY = true;

async function main() {
    await new Promise(r => setTimeout(r, 5000));
    console.log("be sure you've compiled with USE_CONTRACTS_07=\"true\" and \"false\" before starting the deploy run, correct value for chunk and VERIFY are set");

    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION, ethers.provider);
    process.env.BLAST_POINTS_OPERATOR_ADDRESS = deployer.address;

    if(chunk==1){
        if(process.env.USE_CONTRACTS_07=="true"){
            console.log("be sure correct value for USE_CONTRACTS_07 is set to false in .env, and other contract addresses are as well. Exiting...");
            process.exit(1);
        }
        //deploy fee manager with >0.8
        process.env.USE_CONTRACTS_07 = "false";
        const feeManager = await deployFeeManager(VERIFY);
        process.env.BLAST_FEE_MANAGER = feeManager.address;
        console.log("CHUNK 1:");
        console.log("FeeManager Address: ", process.env.BLAST_FEE_MANAGER);
    }
    if(chunk==2){
        //set based on above output
        process.env.BLAST_FEE_MANAGER = "0x2D60Ff307D18b5dE15E84980DCC10aEb5E6de300";

        if(process.env.USE_CONTRACTS_07=="false"){
            console.log("be sure correct value for USE_CONTRACTS_07 is set to true in .env, and other contract addresses are as well. Exiting...");
            process.exit(1);
        }
        // //deploy bitdex contracts with <0.8
        process.env.USE_CONTRACTS_07 = "true";
        const bitDexFactory = await deployBitDexFactory(VERIFY);
        process.env.BITDEX_FACTORY_ADDRESS = bitDexFactory.factoryInstance.address;
        process.env.BITDEX_INIT_CODE_HASH = bitDexFactory.initCodeHash;
        replaceAnyInitCodeHash(bitDexFactory.initCodeHash);
        
        const router = await deployBitDexRouter(VERIFY);
        process.env.BITDEX_ROUTER_ADDRESS = router.address;
        
        const multicall = await deployMulticall(VERIFY);
        process.env.MULTICALL_ADDRESS = multicall.address;

        console.log("CHUNK 2:");
        console.log("Factory Address: ", process.env.BITDEX_FACTORY_ADDRESS);
        console.log("Router Address: ", process.env.BITDEX_ROUTER_ADDRESS);
        console.log("Multicall Address: ", process.env.MULTICALL_ADDRESS);
        console.log("INIT_CODE_HASH: ", process.env.BITDEX_INIT_CODE_HASH);

    }
    if(chunk==3){
        //set based on above outputs
        process.env.BLAST_FEE_MANAGER = "0x2D60Ff307D18b5dE15E84980DCC10aEb5E6de300";
        process.env.BITDEX_FACTORY_ADDRESS = "0x47aB04f788d7835b593D8BB9144C7368Bd5b557e";
        process.env.BITDEX_INIT_CODE_HASH = "cc0ef156a83af80de418d0c7b133235bc1527c3bbdb06dee7c3293083be16976"
        process.env.BITDEX_ROUTER_ADDRESS = "0xFAfd1Ce5BF674E02cdcd0527D77091637F072ad6";
        process.env.MULTICALL_ADDRESS = "0xcca2bEfA2C9556986B0F4E55232A19FD0D6131D6";

        if(process.env.USE_CONTRACTS_07=="true"){
            console.log("be sure correct value for USE_CONTRACTS_07 is set to false in .env, and other contract addresses are as well. Exiting...");
            process.exit(1);
        }
        // //back to >0.8 for the rest
        process.env.USE_CONTRACTS_07 = "false";
        // const bitconnect = await deployBitconnect(VERIFY);
        // process.env.BITCONNECT_TOKEN_ADDRESS = bitconnect.address;
        // console.log("post bit deploy")

        // //set vesting start time to 1 minute from now
        // process.env.VESTING_START_TIME = Math.floor(new Date().getTime() / 1000) + 240;
        // const bitVest = await deployBitVest(bitconnect, presaleAddresses, presaleAmounts, VERIFY);
        // process.env.BITVEST_ADDRESS = bitVest.address;

        // const bitSend = await deployBitSend(VERIFY);
        // process.env.BITSEND_ADDRESS = bitSend.address;

        // const bitVault = await deployBitVault(VERIFY);
        // process.env.BITVAULT_ADDRESS = bitVault.address;

        // //authorize bitconnect (and blastoise) token addresses
        // const authorizeBit = await bitVault.connect(deployer).addNewAuthorizedTokenAndMultiplier(bitconnect.address, 3);
        // await authorizeBit.wait();
        // console.log("$BIT authorized on BitVault with 3%/day multiplier...")
        // // const authorizeBlastoise = await bitVault.connect(deployer).addNewAuthorizedTokenAndMultiplier(blastoiseAddress, 1);
        // // console.log("BLASTOISE authorized on BitVault with 1%/day multiplier...")

        const bitLock = await deployBitLock(VERIFY);
        process.env.BITLOCK_ADDRESS = bitLock.address;

        if(hre.network.name != "hardhat") writeEnvToJson(deployer);

        console.log("DEPLOY ADDRESSES: ");
        // console.log("FeeManager Address: ", process.env.BLAST_FEE_MANAGER);
        // console.log("BitDexFactory Address: ", process.env.BITDEX_FACTORY_ADDRESS);
        // console.log("BitDexRouter Address: ", process.env.BITDEX_ROUTER_ADDRESS);
        // console.log("Multicall Address: ", process.env.MULTICALL_ADDRESS);
        // console.log("BitConnect Address: ", process.env.BITCONNECT_TOKEN_ADDRESS);
        // console.log("BitVest Address: ", process.env.BITVEST_ADDRESS);
        // console.log("BitSend Address: ", process.env.BITSEND_ADDRESS);    
        // console.log("BitVault Address: ", process.env.BITVAULT_ADDRESS);    
        console.log("BitLock Address: ", process.env.BITLOCK_ADDRESS);
    
    }
    if(chunk==4){
        //deploy bitminer
    }
    if(chunk==5){
        //deploy scammers
    }


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

presaleAddresses = [
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9"
];
presaleAmounts = [
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000"),
    hre.ethers.utils.parseEther("5000000")
];

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

