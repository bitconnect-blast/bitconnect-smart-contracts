require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");
require("dotenv").config();
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");
require("hardhat-contract-sizer");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const useContracts07 = process.env.USE_CONTRACTS_07 === "true";

module.exports = {
  paths: {
    sources: useContracts07 ? "./contracts07" : "./contracts08",
  },
  solidity: {
    allowUnlimitedContractSize: true,
    compilers: useContracts07 ? [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ] : [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      chainId: 5,
      url: process.env.ETH_GOERLI_TESTNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY_GOERLI !== undefined
          ? [process.env.PRIVATE_KEY_GOERLI]
          : [],
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.ETH_SEPOLIA_TESTNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY_GOERLI !== undefined
          ? [process.env.PRIVATE_KEY_GOERLI]
          : [],
    },
    mainnet: {
      chainId: 1,
      url: process.env.ETH_MAINNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY_MAINNET !== undefined
          ? [process.env.PRIVATE_KEY_MAINNET]
          : [],
    },
    snowtrace: {
      chainId: 43114,
      url: process.env.AVALANCHE_MAINNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY_AVALANCHE !== undefined
          ? [process.env.PRIVATE_KEY_AVALANCHE]
          : [],
    },
    fuji: {
      chainId: 43113,
      url: process.env.AVALANCHE_TESTNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY_FUJI !== undefined
          ? [process.env.PRIVATE_KEY_FUJI]
          : [],
    },
    blast_sepolia: {
      chainId: 168587773,
      url: 'https://sepolia.blast.io',
      accounts: [process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION]
    },
    // for the local dev environment
    localhost: {
      url: "http://localhost:8545",
      accounts:
        process.env.PRIVATE_KEY_GOERLI !== undefined
          ? [process.env.PRIVATE_KEY_GOERLI]
          : [],
    },
    hardhat : {
      forking: {
        url: 'https://sepolia.blast.io',
        blockNumber: 1380465,      
        accounts: [process.env.PRIVATE_KEY_BLAST_SEPOLIA_PRODUCTION]
      },


    }
  },
  // etherscan: {
  //     apiKey: etherscan_api_key,
  // },
  // etherscan: {
  //   apiKey: {
  //     snowtrace: "snowtrace",
  //   },
  //   customChains: [
  //     {
  //       network: "snowtrace",
  //       chainId: 43114,
  //       urls: {
  //         apiURL:
  //           "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
  //         browserURL: "https://avalanche.routescan.io",
  //       },
  //     },
  //   ],
  // },
  etherscan: {
    apiKey: {
      blast_sepolia: "blast_sepolia", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "blast_sepolia",
        chainId: 168587773,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan",
          browserURL: "https://testnet.blastscan.io"
        }
      }
    ]
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    gasPrice: 30,
    url: "localhost:8545",
  },
  abiExporter: {
    path: "./abi/hardhat_abi_export",
    format: "json",
  },
};
