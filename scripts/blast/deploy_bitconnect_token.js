const hre = require("hardhat");
require("dotenv").config();

async function main(verify) {
  const [deployer] = await hre.ethers.getSigners();

  const BitConnect = await hre.ethers.getContractFactory("BITCONNECT");

  // Uniswap router address
  const bitdexRouteraddress = process.env.BITDEX_ROUTER_ADDRESS;

  //=================================================================================
  //================================================================================= 
  //=================================================================================
  //===CHECK BEFORE DEPLOY===========================================================
  const LP_ETH_AMOUNT = hre.ethers.utils.parseEther(process.env.BIT_LP_ETH_AMOUNT); //CHECK!
  const AUTO_ADJUST_LIMITS_AND_TAX = process.env.AUTO_ADJUST_LIMITS_AND_TAX; //CHECK!

  // ENV VARS USED IN DEPLOY IN ADDITION TO THE ABOVE:
  // process.env.TOKEN_NAME, 
  // process.env.TOKEN_SYMBOL, 
  // process.env.BLAST_FEE_MANAGER,
  // process.env.BITDEX_ROUTER_ADDRESS,
  // process.env.BLAST_FEE_MANAGER,
  // process.env.MIN_CLAIM_RATE_BIPS,
  // process.env.BLAST_GAS_FEE_TO
  //================================================================================
  //=================================================================================
  //=================================================================================
  //=================================================================================

  let VERIFIED = false 
  let fundsTransferred = false
  let LPadded = false

  // constructor(
  //   string memory _name, 
  //   string memory _symbol,
  //   address _marketingWallet,
  //   address _uniswapV2RouterAddress,
  //   address _feeManager,
  //   uint256 _minClaimRateBips,
  //   address _gasFeeTo
  const contract = await BitConnect.deploy(
    process.env.TOKEN_NAME, 
    process.env.TOKEN_SYMBOL, 
    process.env.BLAST_FEE_MANAGER,
    process.env.BITDEX_ROUTER_ADDRESS,
    process.env.BLAST_FEE_MANAGER,
    process.env.MIN_CLAIM_RATE_BIPS,
    process.env.BLAST_GAS_FEE_TO
  );

  await contract.deployed();
  console.log(`${process.env.TOKEN_NAME} deployed to: ${contract.address}`);

  while(!fundsTransferred){
    try{
      // Transfer this ERC20 to the contract
      let transferTxn = await contract.connect(deployer).transfer(
        contract.address, 
        hre.ethers.utils.parseEther("950000000")); //950M of 1B
      await transferTxn.wait();
      console.log("Funds transferred: ", hre.ethers.utils.formatEther(hre.ethers.utils.parseEther("950000000")));
      fundsTransferred = true;
    } catch(error) {
      console.log('Funds transfer failed. Trying again...');
      console.log(error);
    }
  }

  while(!LPadded){
    try{
      // Call addLiquidity function with 5 blocks
      let addLiqTxn = await contract.connect(deployer).addLiquidityAndStartTrading(5, {
        value: LP_ETH_AMOUNT
      });
      await addLiqTxn.wait();
      console.log("Liquidity added: ", hre.ethers.utils.formatEther(LP_ETH_AMOUNT));
      LPadded = true;
    } catch(error) {
      console.log('Liquidity add failed. Trying again...');
      console.log(error);
    }
  }  

  if(verify){
    while(!VERIFIED){
      try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying contract on Etherscan...');
        await hre.run('verify:verify', {
          address: contract.address,
          constructorArguments: [
            process.env.TOKEN_NAME, 
            process.env.TOKEN_SYMBOL, 
            process.env.BLAST_FEE_MANAGER,
            process.env.BITDEX_ROUTER_ADDRESS,
            process.env.BLAST_FEE_MANAGER,
            process.env.MIN_CLAIM_RATE_BIPS,
            process.env.BLAST_GAS_FEE_TO
          ],
        });

        console.log('Contract verified on Etherscan');  
        VERIFIED = true;  

      } catch(error) {
        console.log('Contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
          console.log('Contract already verified on Etherscan');
          VERIFIED = true;
        } else {
          console.log('Contract not verified. Trying again...');
        }
      }    
    }
  }


  //================================================================================
  if(AUTO_ADJUST_LIMITS_AND_TAX){
    // max wallet and txn balances are 10k - 50k during this restricted period. starting value is 1 after default value of 10000
    const totalSupply = "1000000000";
    const maxBalances = [
      "4000000", //0.4%
      "6000000", //0.6%
      "8000000", //0.8%
      "10000000", //1%
      "12000000", //1.2%
      "14000000", //1.4%
      "16000000", //1.6%
      "18000000", //1.8%
      "20000000" //2%
    ];

    //starting variable values
    let blockCount = 0;
    let limitPercent = 0.1;
    let lastBlockNumber = await hre.ethers.provider.getBlockNumber();
    
    const BLOCKS_TO_WAIT = 26;

    let setLimitTxn
    let setFeesTxn
    let thisRate
    let thisLimit
    let txnSuccess = false;

    while(blockCount < BLOCKS_TO_WAIT) {
        const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
        console.log("...");
        if (currentBlockNumber > lastBlockNumber) {
          blockCount++;
          console.log("Block number: ", blockCount);

          // Adjust max wallet and transaction limits every 2 blocks
          if (blockCount % 2 === 0 && limitPercent < 1) {
            thisLimit = maxBalances[blockCount/2 - 1];
            while(!txnSuccess){
              try{
                setLimitTxn = await contract.connect(deployer).updateMaxTxnAmount(thisLimit);
                await setLimitTxn.wait(); 
                txnSuccess = true;             
              } catch {
                console.log('Max txn limit update failed. Trying again...');
              }
            }
            txnSuccess = false;

            while(!txnSuccess){
              try{
                setLimitTxn2 = await contract.connect(deployer).updateMaxWalletAmount(thisLimit);
                await setLimitTxn2.wait();
                txnSuccess = true;
              } catch {
                console.log('Max wallet limit update failed. Trying again...');
              }
            }
            txnSuccess = false;
            
            limitPercent = "100"*thisLimit/totalSupply;
            console.log(`Updated limits to ${limitPercent}%`);
          }

          // Adjust tax to 15%
          if (blockCount === 10) {
            thisRate = 15;
            while(!txnSuccess){
              try{
                setFeesTxn = await contract.connect(deployer).updateFees(thisRate, thisRate);
                await setFeesTxn.wait();    
                txnSuccess = true;
              } catch {
                console.log('Tax update failed. Trying again...');
              }        
            }
            txnSuccess = false;

            console.log(`Updated tax to ${thisRate}%`);
          } 

          // Adjust tax to 10%
          if (blockCount === 15) {
            thisRate = 10;
            while(!txnSuccess){
              try{
                setFeesTxn = await contract.connect(deployer).updateFees(thisRate, thisRate);
                await setFeesTxn.wait();
                txnSuccess = true;
              } catch {
                console.log('Tax update failed. Trying again...');
              }
            }
            txnSuccess = false;
            console.log(`Updated tax to ${thisRate}%`);
          }
          
          // Adjust tax to 5%
          if (blockCount === 20) {
            thisRate = 5;
            while(!txnSuccess){
              try{
                setFeesTxn = await contract.connect(deployer).updateFees(thisRate, thisRate);
                await setFeesTxn.wait();
                txnSuccess = true;
              } catch {
                console.log('Tax update failed. Trying again...');
              }
            }
            txnSuccess = false;
            console.log(`Updated tax to ${thisRate}%`);
          }  

          // Adjust tax to 2%
          if (blockCount === 25) {
            thisRate = 2;
            while(!txnSuccess){
              try{
                setFeesTxn = await contract.connect(deployer).updateFees(thisRate, thisRate);
                await setFeesTxn.wait();
                txnSuccess = true;
              } catch { 
                console.log('Tax update failed. Trying again...');
              }
            }
            txnSuccess = false;
            console.log(`Updated tax to ${thisRate}%`);
          }  
          
          // Stop the script when the limits and tax reach the desired values
          if (blockCount >= BLOCKS_TO_WAIT) {
            console.log("Script finished. Final limits and tax are: ");
            console.log(`Max wallet and transaction limits: ${limitPercent}%`);
            console.log(`Tax: ${thisRate}%`);
            process.exit(0);
          }

          lastBlockNumber = currentBlockNumber;
        }
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));
    }
  }

  return contract.address;
}

module.exports = {
  main
}

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
//   });