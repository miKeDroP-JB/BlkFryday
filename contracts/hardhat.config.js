/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    0RB SYSTEM - HARDHAT CONFIGURATION                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },

  networks: {
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    hardhat: {
      chainId: 31337
    },

    // Testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },

    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
      chainId: 84532,
      gasPrice: 1000000000
    },

    polygonMumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      chainId: 80001
    },

    // Mainnets
    ethereum: {
      url: process.env.ETHEREUM_RPC || "https://eth.llamarpc.com",
      accounts: [PRIVATE_KEY],
      chainId: 1
    },

    base: {
      url: "https://mainnet.base.org",
      accounts: [PRIVATE_KEY],
      chainId: 8453,
      gasPrice: 1000000000
    },

    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [PRIVATE_KEY],
      chainId: 137
    },

    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 42161
    }
  },

  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      base: BASESCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },

  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  }
};
