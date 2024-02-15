/**
 * The overall script to deploy all ecosystem components and set all state variables
 * 1. Deploy bitconnect dex (BitDex, Uniswap V2 Fork)
 *  - Factory (in script: feeManager, feeToSetter, feeTo)
 *  - Router (in script: feeManager, factory, WETH)
 *  - Multicall
 * 2. Deploy bitconnect token ($BIT)
 *  - constructor takes: fee manager address
 * 3. Deploy bitconnect token vesting (BitVest) and set vesting state variables 
 *  - constructor takes fee manager address
 *  - constructor takes bitconnect token address
 *  - set vesting schedule start time (shortly after dex pool is up and running)
 * 4. Deploy staking + reward vault (BitVault)
 *  - constructor takes fee manager address
 *  - constructor takes bitconnect token address
 * 5. Deploy Token Locker (BitLock)
 *  - constructor takes fee manager address
 * 6. Deploy Disperse (BitSend)
 *  - constructor takes fee manager address
 * 7. Deploy Miner (BitMiner)
 *  - TODO: figure this out with elz
 *  - after this is deployed, call setGasFeeTo on every contract where it's present and assigned manually (i.e. not read via interface to another contract) - includes factory, router, bitsend, .. likely all contracts

 * After all deploys, saves a .json file with all contract addresses and state variables
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const deployFeeManager = require("./utils/deploy_fee_manager").main;
const deployBitDexFactory = require("./bitdex/deploy_factory").main; 
const deployBitDexRouter = require("./bitdex/deploy_router").main;
const deployMockERC20 = require("./utils/deploy_mock_erc20").main;
const deployBitconnect = require("./bitconnect/deploy_bitconnect_token").main;

const USING_MODIFIED_UNIV2 = true;
const TEST_ADD_LIQUIDITY = true;
const TESTING_MOCK_TOKEN_ADDRESS ="0x18963E91d55E3178c84D65B02CDed4CFA2dC1a7f";//"0xbD5cBa686748EE152b92A3D6fE74C3BD97af3378"; //or 0x18963E91d55E3178c84D65B02CDed4CFA2dC1a7f seems to have worked.
const TEST_FEE_MANAGER_ADDRESS = "0xca0Df8fe3235263a18CbFBfF9929E36022Ec8695";

const DEPLOY_TEST_TOKEN = true;
const DEPLOY_FEE_MANAGER = true;
const DEPLOY_BITDEX = true;
const DEPLOY_MULTICALL = false;
const DEPLOY_BITCONNECT = false;
const DEPLOY_BITVEST = false;
const DEPLOY_BITVAULT = false;
const DEPLOY_BITLOCK = false;
const DEPLOY_BITSEND = false;
const DEPLOY_BITMINER = false;

const VERIFY_TEST_TOKEN = false;
const VERIFY_FEE_MANAGER = false;
const VERIFY_BITDEX = false;
const VERIFY_MULTICALL = false;
const VERIFY_BITCONNECT = false;
const VERIFY_BITVEST = false;
const VERIFY_BITVAULT = false;
const VERIFY_BITLOCK = false;
const VERIFY_BITSEND = false;
const VERIFY_BITMINER = false;

const LOGGING = true;

//test-tester on test-wallets.txt
const TEMP_GAS_FEE_TO = "0x7128966d2a9D4E0cEc363aDE4eEb822a4b33F49E";

const mintToForTestToken = [
    "0x06527674dFd9d706469fFf1E5aEe8b24884E0C77",
    "0x26744f27272bFA7dBaCda49F8E842BBc1A2395C9",
    "0xf4aa692736191401BB1a797342B38780F93160cd"
];
const mintAmountsForTestToken = [
    "1000000000000000000000",
    "1000000000000000000000",
    "1000000000000000000000"
];

async function main() {
    //REVIEW DEPLOY INFO
    console.log("Review Deployment Configuration:");
    console.log(`USING_MODIFIED_UNIV2: ${USING_MODIFIED_UNIV2}`);
    console.log(`TEST_ADD_LIQUIDITY: ${TEST_ADD_LIQUIDITY}`);
    console.log(`TESTING_MOCK_TOKEN_ADDRESS: ${TESTING_MOCK_TOKEN_ADDRESS}`);
    console.log(`TEST_FEE_MANAGER_ADDRESS: ${TEST_FEE_MANAGER_ADDRESS}`);
    console.log(`DEPLOY_TEST_TOKEN: ${DEPLOY_TEST_TOKEN}`);
    console.log(`DEPLOY_FEE_MANAGER: ${DEPLOY_FEE_MANAGER}`);
    console.log(`DEPLOY_BITDEX: ${DEPLOY_BITDEX}`);
    console.log(`DEPLOY_MULTICALL: ${DEPLOY_MULTICALL}`);
    console.log(`DEPLOY_BITCONNECT: ${DEPLOY_BITCONNECT}`);
    console.log(`DEPLOY_BITVEST: ${DEPLOY_BITVEST}`);
    console.log(`DEPLOY_BITVAULT: ${DEPLOY_BITVAULT}`);
    console.log(`DEPLOY_BITLOCK: ${DEPLOY_BITLOCK}`);
    console.log(`DEPLOY_BITSEND: ${DEPLOY_BITSEND}`);
    console.log(`DEPLOY_BITMINER: ${DEPLOY_BITMINER}`);
    console.log(`VERIFY_TEST_TOKEN: ${VERIFY_TEST_TOKEN}`);
    console.log(`VERIFY_FEE_MANAGER: ${VERIFY_FEE_MANAGER}`);
    console.log(`VERIFY_BITDEX: ${VERIFY_BITDEX}`);
    console.log(`VERIFY_MULTICALL: ${VERIFY_MULTICALL}`);
    console.log(`VERIFY_BITCONNECT: ${VERIFY_BITCONNECT}`);
    console.log(`VERIFY_BITVEST: ${VERIFY_BITVEST}`);
    console.log(`VERIFY_BITVAULT: ${VERIFY_BITVAULT}`);
    console.log(`VERIFY_BITLOCK: ${VERIFY_BITLOCK}`);
    console.log(`VERIFY_BITSEND: ${VERIFY_BITSEND}`);
    console.log(`VERIFY_BITMINER: ${VERIFY_BITMINER}`);
    console.log(`LOGGING: ${LOGGING}`);
    console.log(`TEMP_GAS_FEE_TO: ${TEMP_GAS_FEE_TO}`);

    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    let enterPressedCount = 0;
    
    function waitForEnterPress() {
        readline.question("Press ENTER twice to confirm and continue, or type 'CANCEL' and press ENTER to cancel execution.", input => {
            if (input.toUpperCase() === 'CANCEL') { // Check if the user typed 'CANCEL'
                console.log("Execution cancelled.");
                readline.close(); // Close the readline interface
                process.exit(1); // Exit the process
            } else {
                enterPressedCount++;
                if (enterPressedCount < 2) {
                    // If Enter has been pressed less than twice, prompt again.
                    waitForEnterPress();
                } else {
                    // Enter has been pressed twice, proceed with execution.
                    readline.close(); // Close the readline interface
                    // Place the rest of your execution code here or call the next function.
                }
            }
        });
    }
    
    waitForEnterPress();

    //DEPLOY!

    const [deployer] = await hre.ethers.getSigners();
    console.log("DEPLOYER: ", deployer.address);

    //compile in both <0.8 and >0.8 to start
    process.env.USE_CONTRACTS_07 = "true";
    await hre.run('compile');
    process.env.USE_CONTRACTS_07 = "false";
    await hre.run('compile');

    /**
     * Deploy Step 1: Fee Manager
     * Solc > 0.8.0
     */
    process.env.USE_CONTRACTS_07 = "false";
    if(DEPLOY_FEE_MANAGER){
        try{
            const feeManager = await deployFeeManager(VERIFY_FEE_MANAGER);
            process.env.BLAST_FEE_MANAGER = feeManager;
            if(LOGGING){
                console.log('FeeManager Deployed to:', feeManager);
            }
        } catch (error) {
            console.error('Error deploying FeeManager:', error);
            //stop execution
            process.exit(1);
        }
    } else {
        process.env.BLAST_FEE_MANAGER = TEST_FEE_MANAGER_ADDRESS;
    }

    /**
     * Deploy Step 2: BitDex (Uniswap V2 Fork) Factory and Router + Setup
     * BitDex with USE_CONTRACTS_07="true" because solidity < 0.8.0
     */
    process.env.USE_CONTRACTS_07 = "true";
    if(LOGGING){
        console.log('Set compiler to <0.8.0...');
    }
    if(DEPLOY_BITDEX){
        try{
            const deployFactory = await deployBitDexFactory(VERIFY_BITDEX);
            process.env.BITDEX_FACTORY_ADDRESS = deployFactory.factoryAddress;
            process.env.BITDEX_INIT_CODE_HASH = deployFactory.initCodeHash;

            //replace the init code hash in BitDexLibrary.sol
            //sample f3a935c7aad2548eb834046d70d6181c365b0942ff865d8a3e7b0eadb5f0b497
            replaceAnyInitCodeHash(deployFactory.initCodeHash);

            const routerAddress = await deployBitDexRouter(VERIFY_BITDEX);
            process.env.BITDEX_ROUTER_ADDRESS = routerAddress;

            // const multicallAddress = await deployMulticall(VERIFY_MULTICALL);
            // process.env.MULTICALL_ADDRESS = multicallAddress;

            if(LOGGING){            
                console.log('Factory Deployed to:', deployFactory.factoryAddress);
                console.log('INIT_CODE_HASH:', deployFactory.initCodeHash);
                console.log('Router Deployed to:', routerAddress);
            }
        } catch (error) {
            console.error('Error deploying BitDex:', error);
            //stop execution
            process.exit(1);
        }

        if(DEPLOY_TEST_TOKEN){
            process.env.USE_CONTRACTS_07 = "false";
            if(LOGGING){
                console.log('Set compiler to >=0.8.0...');
            }
            try {
                const mockERC20Address = await deployMockERC20(mintToForTestToken, mintAmountsForTestToken, VERIFY_TEST_TOKEN);
                process.env.MOCK_TOKEN_ADDRESS = mockERC20Address;
                if(LOGGING){
                    console.log('Mock ERC20 Deployed to:', mockERC20Address);
                }
            } catch (error) {
                console.error('Error deploying Mock ERC20:', error);
                //stop execution
                process.exit(1);
            }
        } else {
            process.env.MOCK_TOKEN_ADDRESS = TESTING_MOCK_TOKEN_ADDRESS;
        }
    }

    /**
     * Deploy Steps 2 + 3 + 4: Bitconnect Token + Vesting + Staking + Reward Vault
     * USE_CONTRACTS_07="false" in .env for deployments that use solidity 0.8.0+
     */
    process.env.USE_CONTRACTS_07 = "false";
    if(LOGGING){
        console.log('Set compiler to >=0.8.0...');
    }

    if(DEPLOY_BITCONNECT){}
    if(DEPLOY_BITVAULT){}
    if(DEPLOY_BITLOCK){}
    if(DEPLOY_BITVEST){}

    //TODO: deploy miner based on Solidity version in this contract
    if(DEPLOY_BITMINER){}

    //set variables after deploys are done and addresses are known
    if(DEPLOY_FEE_MANAGER){
        try{} catch (error) {}
    }    

    if(DEPLOY_BITDEX && USING_MODIFIED_UNIV2){
        try{
            //set gasFeeTo
            const Factory = await hre.ethers.getContractFactory("BitDexFactory");
            const factory = await Factory.attach(process.env.BITDEX_FACTORY_ADDRESS);
            const setGasFeeToTx = await factory.connect(deployer).setGasFeeTo(TEMP_GAS_FEE_TO);
            await setGasFeeToTx.wait();

            const Router = await hre.ethers.getContractFactory("BitDexRouter");
            const router = await Router.attach(process.env.BITDEX_ROUTER_ADDRESS);
            const setGasFeeToTxRouter = await router.connect(deployer).setGasFeeTo(TEMP_GAS_FEE_TO);
            await setGasFeeToTxRouter.wait();

            if(LOGGING){
                console.log("GasFeeTo set on Factory and Router...");
            }
        } catch (error) {
            console.log('Error setting variables after BitDex deploys:', error);
            process.exit(1);
        }
    }

    if(TEST_ADD_LIQUIDITY) {
        try {
            if(LOGGING){
                console.log("TEST_ADD_LIQUIDITY ==>")
                console.log("Router: ", process.env.BITDEX_ROUTER_ADDRESS);
                console.log("Factory: ", process.env.BITDEX_FACTORY_ADDRESS);
                console.log("Mock Token: ", process.env.MOCK_TOKEN_ADDRESS);
            }

            const Factory = await hre.ethers.getContractFactory("BitDexFactory");
            const Router = await hre.ethers.getContractFactory("BitDexRouter");
            // const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
            // const Router = await hre.ethers.getContractFactory("UniswapV2Router02");
            const Token = await hre.ethers.getContractFactory("MockERC20");

            const factory = Factory.attach(process.env.BITDEX_FACTORY_ADDRESS);
            const router = Router.attach(process.env.BITDEX_ROUTER_ADDRESS);
            const token = Token.attach(process.env.MOCK_TOKEN_ADDRESS);

            //approve token to router
            const approveTxn = await token.connect(deployer).approve(router.address, hre.ethers.utils.parseEther("10000000"));
            await approveTxn.wait();

            if(LOGGING) console.log(`Token at ${token.address} approved for Router`);

            //wait 5 seconds for any potential lag
            console.log("Waiting 5 seconds for potential lag to dissipate...")
            await new Promise(r => setTimeout(r, 5000));

            const addLiquidityTxn = await router.connect(deployer).addLiquidityETH(
                process.env.MOCK_TOKEN_ADDRESS,
                hre.ethers.utils.parseEther("100"),
                hre.ethers.utils.parseEther("90"),
                hre.ethers.utils.parseEther("0.000001"),
                deployer.address,
                Math.floor(Date.now() / 1000) + 60 * 20, //20 minutes
                { value: hre.ethers.utils.parseEther("0.000001") }
            );
            await addLiquidityTxn.wait();
            const wethAddress = await router.WETH();
            
            if(LOGGING) console.log("WETH: ", wethAddress);

            const pairAddress = await factory.getPair(process.env.MOCK_TOKEN_ADDRESS, wethAddress);

            if(LOGGING) console.log("Pair: ", pairAddress);

            console.log(`Liquidity was added to pair ${pairAddress}...`);
        } catch (error) {
                console.log(`Test add liquidity error: ${error}`);
                console.log(`Error stack: ${error.stack}`);
                process.exit(1);
        }
    }

    
    if(hre.network.name != "hardhat") writeEnvToJson(deployer);

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
        "BITCONNECT_ADDRESS",
        "BITVEST_ADDRESS",
        "BITVAULT_ADDRESS",
        "BITLOCK_ADDRESS",
        "BITSEND_ADDRESS",
        "BITMINER_ADDRESS",
        "MOCK_TOKEN_ADDRESS",
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
