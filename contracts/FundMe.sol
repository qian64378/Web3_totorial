//SPDX-License-Identifier:MIT
pragma solidity ^0.8.31;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 在锁定期内，达到目标值，生产商可以提款
// 4. 在锁定期外，没有达到目标值，投资人可以退款

contract FundMe {
    mapping(address => uint256) public fundersToAmount;
    uint256 constant MINIMUM_VALUE = 10 * 10 ** 18;
    uint256 public constant TARGET = 1000 * 10 ** 18;
    AggregatorV3Interface public dataFeed;
    address public owner;
    uint256 deploumentTimestamp;
    uint256 lockTime;
    address erc20Addr;
    bool public getFundSuccess = false;
   event FundWithdrawByOwner(uint256);
   event RefundByFunder(address,uint256);


    constructor(uint256 _lockTime,address addr){
        dataFeed = AggregatorV3Interface(addr);
        owner = msg.sender;
        deploumentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }
    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH!");
        require(block.timestamp < deploumentTimestamp + lockTime, "window is closed");
        fundersToAmount[msg.sender] += msg.value;
    }
    function convertEthToUsd(uint256 ethAmount) internal view returns (uint256){
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        uint256 ethAmountInUsd = ethPrice * ethAmount / (10 ** 8);
        return ethAmountInUsd;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
        /* uint80 roundId */
        ,
        int256 answer,
        /*uint256 startedAt*/
        ,
        /*uint256 updatedAt*/
        ,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }   

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }
    
    function getFund() external onlyOwner windowClse{
        require(convertEthToUsd(address(this).balance) >= TARGET,"Target is not reached");
        bool success;
        uint256 balance =address(this).balance;
        (success ,) = payable(msg.sender).call{value: address(this).balance}("");
        require(success,"transfer fail");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;
        emit FundWithdrawByOwner(balance);
    }
    

    function reFund() external windowClse {
        require(convertEthToUsd(address(this).balance) < TARGET,"Target is reached");
        require(fundersToAmount[msg.sender] != 0,"you have not fund");
        
        bool success;
        uint256 balance = fundersToAmount[msg.sender];
        require(balance > 0,"balance is null");
        
        fundersToAmount[msg.sender] = 0;
        (success ,) = payable(msg.sender).call{value: balance}("");
        require(success,"transfer tx failed");
        emit RefundByFunder(msg.sender,balance);
    }
    function setFunderToAmount(address funder,uint256 amountToUpdate )public{
        require(msg.sender == erc20Addr,"you do not have permission to call this funtion");
        fundersToAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20addr)public onlyOwner{
        erc20Addr = _erc20addr;
    }
    modifier windowClse() {
        require(block.timestamp >= deploumentTimestamp + lockTime,"window is not closed");
        _;
    }
    modifier onlyOwner(){
        require(msg.sender == owner,"not owner!");
        _;
    }
    
}