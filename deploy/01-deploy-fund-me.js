const { network } = require("hardhat");
const { devlopmentChains, networkConfig, LOCK_TIME,CONFIRMATIONS } = require("../helper-hardhat-config.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts();
    const { deploy } = deployments;
    let dataFeedAddr;
    const SEPOLIA_CHAIN_ID = network.config.chainId;
    let confirmations
  if (devlopmentChains.includes(network.name)) {
    const mockV3Aggregator = await deployments.get("MockV3Aggregator");
    dataFeedAddr = mockV3Aggregator.address;
    confirmations = 0

  } else {
    dataFeedAddr = networkConfig[SEPOLIA_CHAIN_ID].ethUsdDataFeed;
    confirmations = CONFIRMATIONS
  }

  const fundMe = await deploy("FundMe", {
    from: firstAccount,
    args: [LOCK_TIME, dataFeedAddr],
    log: true,
    waitConfirmations: confirmations
  });
      
  // if (SEPOLIA_CHAIN_ID === 11155111 && process.env.ETHERSCAN_API_KEY) {
  //   await hre.run("verify:verify", {
  //     address: fundMe.address,
  //     constructorArguments: [LOCK_TIME, dataFeedAddr],
  //   });
  // } else {
  //   console.log("Network is not sepolia, verification skipped...");
  // }
};

module.exports.tags = ["all", "fundme"];