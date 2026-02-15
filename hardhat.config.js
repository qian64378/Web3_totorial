// 1. 引入 env-enc 工具（专门处理加密的 .env.enc）
require("@chainlink/env-enc").config({ path: __dirname + "/test/.env.enc" });
// 2. 加载 Hardhat 工具包
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy")
require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-deploy-ethers");

// 调试：验证解密后的私钥长度（应该是 66）
console.log("解密后私钥长度：", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : "未读取到");

// 读取配置
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1 || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: "0.8.31",
  defaultNetwork:"hardhat",
  mocha:{
    timeout:300000
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY,PRIVATE_KEY_1],
      chainId:11155111,
      timeout: 120000 // 增加超时时间到120秒å
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  namedAccounts:{
    firstAccount:{
      default:0
    },
    secondAccount:{
      default:1
    }
  },
  gasReporter:{
    enabled:false
  }

};

