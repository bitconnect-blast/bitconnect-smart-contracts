    const hre = require("hardhat");

    async function main() {

    //CHECK BEFORE RUN********************************************************************************
    const factoryAddress = "0x7477926E19A0e27A6d1421dEEeDDa04d8373cB81"; //from last deploy
    const routerAddress = "0x8433510Cc7afdF148ad99DA61a2aC99a1011DE9E"; //from last deploy
    const WETH_Address = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"; //goerli: 0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6
    //************************************************************************************************

    //get deployer address
    const [deployer] = await hre.ethers.getSigners();

    const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
    const factory = Factory.attach(factoryAddress);

    const Router = await hre.ethers.getContractFactory("UniswapV2Router02");
    const router = Router.attach(routerAddress);

    console.log(

    `========================
    \nFactory Deployed at: ${factory.address}
    \nRouter Deployed at: ${router.address}
    \n===================   =====`
    );
    
    let FACTORY_VERIFIED = false;
    let ROUTER_VERIFIED = false;

    while(!FACTORY_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying Factory contract on Etherscan...');
            await hre.run('verify:verify', {
            address: factoryAddress,
            constructorArguments: [
                deployer.address, 
            ],
        });

        console.log('Factory contract verified on Etherscan');  
        FACTORY_VERIFIED = true;  

    } catch(error) {
        console.log('Factory contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
        console.log('Factory contract already verified on Etherscan');
        FACTORY_VERIFIED = true;
        } else {
        console.log('Factory contract not verified. Trying again...');
        }
    }    
    }

    while(!ROUTER_VERIFIED){
    try{
        //wait 5 seconds
        await new Promise(r => setTimeout(r, 5000));

        console.log('Verifying Router contract on Etherscan...');
        await hre.run('verify:verify', {
            address: routerAddress,
            constructorArguments: [
                factoryAddress, 
                WETH_Address, 
            ],
        });

        console.log('Router contract verified on Etherscan');  
        ROUTER_VERIFIED = true;  

    } catch(error) {
        console.log('Router contract verification failed');
        console.log(error);
        //if error contains "already" then contract is already verified and set VERIFIED to true
        if(error.toString().includes("already")) {
        console.log('Router contract already verified on Etherscan');
        ROUTER_VERIFIED = true;
        } else {
        console.log('Router contract not verified. Trying again...');
        }
    }    
    }


    }

    // We recommend this pattern to be able to use async/await everywhere
    // and properly handle errors.
    main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
    });


