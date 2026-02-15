const { ethers, run } = require("hardhat");

// 封装充值函数（带异常处理）
async function fundContract(fundMeContract, signer, amountEth, accountName) {
  try {
    const amount = ethers.parseEther(amountEth);
    console.log(`\n📤 ${accountName} (${signer.address}) 准备充值 ${amountEth} ETH...`);
    
    // 估算Gas（提前检测Gas不足问题）
    const gasEstimate = await fundMeContract.connect(signer).fund.estimateGas({ value: amount });
    // 发送交易（增加Gas缓冲，避免Gas不足）
    const tx = await fundMeContract.connect(signer).fund({
      value: amount,
      gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 增加20% Gas缓冲
    });
    
    // 等待交易确认
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log(`✅ ${accountName} 充值成功! 交易哈希: ${receipt.hash}`);
      return { success: true, amount: amount };
    } else {
      console.log(`❌ ${accountName} 充值失败: 交易未确认`);
      return { success: false, error: "交易未确认" };
    }
  } catch (error) {
    let errorMsg = `❌ ${accountName} 充值失败: `;
    // 分类处理不同类型的错误
    if (error.message.includes("insufficient funds")) {
      errorMsg += "账户余额不足（需要ETH支付Gas + 充值金额）";
    } else if (error.message.includes("reverted")) {
      errorMsg += "合约执行回滚（可能是合约逻辑限制）";
    } else if (error.message.includes("gas")) {
      errorMsg += "Gas不足或Gas价格设置过低";
    } else {
      errorMsg += error.message.substring(0, 200); // 截取关键错误信息
    }
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

async function main() {
  console.log("\n🚀 开始部署 FundMe 合约（Sepolia 测试网）...");

  // 1. 部署合约（带异常处理）
  let fundMe, contractAddress;
  try {
    const FundMe = await ethers.getContractFactory("FundMe");
    fundMe = await FundMe.deploy(180);
    await fundMe.waitForDeployment();
    contractAddress = await fundMe.getAddress();
    console.log(`✅ FundMe 合约部署成功! 地址: ${contractAddress}`);
  } catch (deployError) {
    console.error("❌ 合约部署失败: ", deployError.message);
    process.exit(1); // 部署失败直接退出
  }

  // 2. 验证合约（带异常处理）
  try {
    console.log("\n⌛ 等待区块确认，准备验证合约...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
    
    console.log("🔍 正在 Etherscan 验证合约...");
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [180],
    });
    console.log("✅ 合约验证成功!");
    console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${contractAddress}#code`);
  } catch (verifyError) {
    console.error("❌ 合约验证失败（不影响合约使用）: ", verifyError.message);
  }

  // 3. 多账户充值测试（带完整异常处理）
  console.log("\n===== 多账户充值测试 =====");
  const [firstAccount, secondAccount] = await ethers.getSigners();
  console.log(firstAccount.address, secondAccount.address)
  // 3.1 第一个账户充值
  const firstResult = await fundContract(fundMe, firstAccount, "0.01", "第一个账户");
  if (!firstResult.success) {
    console.warn("⚠️ 第一个账户充值失败，继续执行第二个账户充值...");
  }

  // 3.2 检查合约余额（充值后）
  if (firstResult.success) {
    const balance1 = await ethers.provider.getBalance(contractAddress);
    console.log(`📊 充值后合约余额: ${ethers.formatEther(balance1)} ETH`);
  }

  // 3.3 第二个账户充值
  const secondResult = await fundContract(fundMe, secondAccount, "0.02", "第二个账户");

  // 3.4 最终余额检查
  const finalBalance = await ethers.provider.getBalance(contractAddress);
  console.log(`\n📊 最终合约总余额: ${ethers.formatEther(finalBalance)} ETH`);

  // 3.5 检查充值记录（仅在充值成功时）
  console.log("\n===== 充值记录检查 =====");
  if (firstResult.success) {
    const firstAmount = await fundMe.fundersToAmount(firstAccount.address);
    console.log(`第一个账户充值记录: ${ethers.formatEther(firstAmount)} ETH`);
  }
  if (secondResult.success) {
    const secondAmount = await fundMe.fundersToAmount(secondAccount.address);
    console.log(`第二个账户充值记录: ${ethers.formatEther(secondAmount)} ETH`);
  }

  console.log("\n🎉 脚本执行完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行异常: ", error);
    process.exit(1);
  });