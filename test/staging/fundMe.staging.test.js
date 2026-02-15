const { ethers,deployments, getNamedAccounts } = require("hardhat")
const { assert , expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config")
//集成测试
devlopmentChains.includes(network.name) 
? describe.skip
: describe("test fundme contract",async function(){
    let fundMe
    let firstAccount
    beforeEach(async function(){
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt("FundMe",fundMeDeployment.address)
    })

    //test fund and getFund successfully
    it("fund and getFund successfully",
        async function(){
            await fundMe.fund({value:ethers.parseEther("0.5")})
            await new Promise(resolve => setTimeout(resolve,181 * 1000))
            const getFundTx = await fundMe.getFund() //这里发送交易
            const getFundReceipt = await getFundTx.wait()//这里等待确认入块
            expect(getFundReceipt)
                .to.be.emit(fundMe,"FundWithdrawByOwner")
                .withArgs(ethers.parseEther("0.5"))
        }
    )
    //test fund add refund successfull
    it("fund and refund succssfully",
        async function() {
                   await fundMe.fund({value: ethers.parseEther("0.1")})
                   await new Promise(resolve => setTimeout(resolve,181 * 1000))
                   const reFundTx = await fundMe.reFund()
                   const refundReceipt = await reFundTx.wait()
                   expect(refundReceipt)
                       .to.be.emit(fundMe,"RefundByFunder")
                       .withArgs(firstAccount,ethers.parseEther("0.1"))
               } 
    )

})