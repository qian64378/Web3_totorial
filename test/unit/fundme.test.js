const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert , expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config");
  

!devlopmentChains.includes(network.name) 
? describe.skip
: describe("test fundme contract",async function(){
    let fundMe
    let fundMeSecondAccount
    let firstAccount
    let secondAccount
    let mockV3Aggreator
    beforeEach(async function(){
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        const fundMeDeployment = await deployments.get("FundMe")
        mockV3Aggreator = await deployments.get("MockV3Aggregator")
        fundMe = await ethers.getContractAt("FundMe",fundMeDeployment.address)
        fundMeSecondAccount = await ethers.getContract("FundMe",secondAccount)
    })

    it("test if the owner is msg.sender", async function(){
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()),firstAccount)
    })

    it("test if the dataFeed is correctly", async function(){
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()),mockV3Aggreator.address)
    })
    // fund, getFund, refund
    // unit test for fund
    // window open, value greater then minimun value,funder balance

    //测试超出时间了
    it("window closed value grater than minimum, fund failed",
        async function() {
            //make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.fund({value: ethers.parseEther("0.1")})).to.be.revertedWith("window is closed")
            //value is greater minimum value
        }
    )
    //测试金额少了
    it("window open, value is less than minimum ,fund failed",
        async function() {
            await expect(fundMe.fund({value: ethers.parseEther("0.001")})).to.be.revertedWith("Send more ETH!")
        }
    )
    //测试转账成功后被mapping记录
    it("window open, value is greater minimum,fund success",
        async function(){
            await fundMe.fund({value: ethers.parseEther("0.1")})
            const balance = await fundMe.fundersToAmount(firstAccount)
            expect(balance).to.equal(ethers.parseEther("0.1"))
        }
    )

    //unit for test getFund
    //onlyOwner, windowlose, target reached
    it("not onwer,window closed, target reached, getFund failed", 
        async function(){
            //make sure the target is reached
            await fundMe.fund({value: ethers.parseEther("1")})
            //make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMeSecondAccount.getFund())
                .to.be.revertedWith("not owner!")
        }
    )
    it("window open, target reached, getFund failed",
        async function(){
            await fundMe.fund({value: ethers.parseEther("1")})
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is not closed")
        }
    )
    it("window closed, target not reached getFund failed",
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.be.revertedWith("Target is not reached")
        }
    )
    it("fund and getFund successfully",
        async function() {
            await fundMe.fund({value: ethers.parseEther("1")})
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.be.emit(fundMe,"FundWithdrawByOwner")
                .withArgs(ethers.parseEther("1"))
        }
    )

    //refund
    //windowClosed, target not reached, funder has balance
    it("window open target not reached, funder has balance",
        async function(){
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await expect(fundMe.reFund()).to.be.revertedWith("window is not closed")
        }
    )
    it ("window colse, target reach, funder has balance",
        async function(){
            await fundMe.fund({value: ethers.parseEther("1")})
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.reFund()).to.be.revertedWith("Target is reached")
        }
    )
    it ("window colse, target not reach, funder does not has balance",
        async function(){
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMeSecondAccount.reFund())
                .to.be.revertedWith("you have not fund")
        }
    )
    it("window closed, target not reach, funder does not has balance",
        async function(){
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.reFund())
                .to.be.emit(fundMe,"RefundByFunder")
                .withArgs(firstAccount,ethers.parseEther("0.1"))
            
        }
    )
})