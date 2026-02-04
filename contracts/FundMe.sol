//SPDX-License-Identifier:MIT
pragma solidity >=0.8.0 <0.9.0;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
contract FundMe {
    mapping(address => uint256) public fundersToAmount;
    uint256 constant MINIMUM_VALUE = 10 * 10 ** 18;
    uint256 public constant TARGET = 1000 * 10 ** 18;
    AggregatorV3Interface internal dataFeed;
    address public owner;
    uint256 deploumentTimestamp;
    uint256 lockTime;
    address erc20Addr;
    bool public getFundSuccess = false;
   
    constructor(uint256 _lockTime){
        dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        owner = msg.sender;
        deploumentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }
    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH!");
        require(block.timestamp < deploumentTimestamp + lockTime, "Can't fund anymore");
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
        (success ,) = payable(msg.sender).call{value: address(this).balance}("qianyejun");
        require(success,"transfer fail");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;
    }
    
    function getfund1()public view returns(uint256){
        return address(this).balance;
        // require(convertEthToUsd(address(this).balance) >= TARGET,"Target is not reached");
    }
     function getFund2() external{
        // payable(msg.sender).transfer(address(this).balance);
        bool success;
        (success ,) = payable(msg.sender).call{value: address(this).balance}("qianyejun");

    }

    function refund() external windowClse {
        require(convertEthToUsd(address(this).balance) < TARGET,"Target is reached");
        require(fundersToAmount[msg.sender] != 0,"you have not fund");
        
        bool success;
        (success ,) = payable(msg.sender).call{value: fundersToAmount[msg.sender]}("qianyejun");
        require(success,"transfer tx failed");
        fundersToAmount[msg.sender] = 0;

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