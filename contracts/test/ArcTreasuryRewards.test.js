const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArcTreasuryRewards: Invariant Accounting Integrity", function () {
    const USDC = (n) => BigInt(n) * 1_000_000n; // Strict 6 decimal conversion

    let usdc, rewards;
    let ceo, A, B;
    let totalClaimed = 0n;
    let totalDistributed = 0n;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        ceo = signers[0];
        A = signers[1];
        B = signers[2];

        // Reset counters
        totalClaimed = 0n;
        totalDistributed = 0n;

        // Deploy MockUSDC
        const USDCContract = await ethers.getContractFactory("MockUSDC");
        usdc = await USDCContract.deploy();

        // Deploy ArcTreasuryRewards
        const RewardsContract = await ethers.getContractFactory("ArcTreasuryRewards");
        rewards = await RewardsContract.deploy(usdc.target, ceo.address);

        // Mint and Approve exactly 3,500 USDC
        const initialFunding = USDC(3500);
        await usdc.mint(ceo.address, initialFunding);
        await usdc.connect(ceo).approve(rewards.target, initialFunding);
    });

    async function trackClaim(user) {
        const beforeBal = await usdc.balanceOf(user.address);
        await rewards.connect(user).claim();
        const afterBal = await usdc.balanceOf(user.address);
        totalClaimed += (afterBal - beforeBal);
    }

    it("test_interleaved_accounting_integrity", async function () {
        // Initialize shares
        await rewards.connect(ceo).setShares(A.address, 3000);
        await rewards.connect(ceo).setShares(B.address, 7000);

        // Cycle 1: Distribute 500
        let dist1 = USDC(500);
        await rewards.connect(ceo).distribute(dist1);
        totalDistributed += dist1;

        // A calls claim
        await trackClaim(A);

        // Cycle 2: Distribute 1000
        let dist2 = USDC(1000);
        await rewards.connect(ceo).distribute(dist2);
        totalDistributed += dist2;

        // Mutation: Change shares before B claims Cycle 1 and 2
        await rewards.connect(ceo).setShares(A.address, 5000);
        await rewards.connect(ceo).setShares(B.address, 5000);

        // Cycle 3: Distribute 2000
        let dist3 = USDC(2000);
        await rewards.connect(ceo).distribute(dist3);
        totalDistributed += dist3;

        // Final claims
        await trackClaim(A);
        await trackClaim(B);

        // ASSERTIONS (End-state, base units):
        // 1. claimable[A] == 0 and claimable[B] == 0
        const claimableA = await rewards.claimable(A.address);
        const claimableB = await rewards.claimable(B.address);
        expect(claimableA).to.equal(0n);
        expect(claimableB).to.equal(0n);

        // 2. USDC.balanceOf(ArcTreasuryRewards) == undistributedRemainder
        const vaultBalance = await usdc.balanceOf(rewards.target);
        const undistributedRemainder = await rewards.undistributedRemainder();
        expect(vaultBalance).to.equal(undistributedRemainder);

        // 3. totalClaimed + undistributedRemainder == totalDistributed
        expect(totalClaimed + undistributedRemainder).to.equal(totalDistributed);

        // 4. totalDistributed == 3_500_000_000
        expect(totalDistributed).to.equal(USDC(3500));
    });

    describe("Micro-tests for Coverage", function () {
        it("rever_when_totalShares_0", async function () {
            await expect(rewards.connect(ceo).distribute(USDC(100))).to.be.revertedWith("No shares exist");
        });

        it("claim_twice_yields_revert", async function () {
            await rewards.connect(ceo).setShares(A.address, 1000);
            await rewards.connect(ceo).distribute(USDC(100));

            await rewards.connect(A).claim();
            await expect(rewards.connect(A).claim()).to.be.revertedWith("Nothing to claim");
        });

        it("cps_regression_cannot_occur_natively", async function () {
            await rewards.connect(ceo).setShares(A.address, 1000);
            await rewards.connect(ceo).distribute(USDC(100));
            const cps1 = await rewards.cumulativePerShare();

            await rewards.connect(ceo).distribute(USDC(100));
            const cps2 = await rewards.cumulativePerShare();

            expect(cps2).to.be.greaterThan(cps1);
        });
    });
});
