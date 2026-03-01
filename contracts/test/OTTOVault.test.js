const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OTTOVaultV2", function () {
    let USDC;
    let usdc;
    let Vault;
    let vault;
    let ceo;
    let agent;
    let vendor;
    let shareholder1;
    let shareholder2;

    beforeEach(async function () {
        [ceo, agent, vendor, shareholder1, shareholder2] = await ethers.getSigners();

        // Deploy Mock USDC
        USDC = await ethers.getContractFactory("MockUSDC");
        usdc = await USDC.deploy();

        // Deploy Vault
        Vault = await ethers.getContractFactory("OTTOVaultV2");
        vault = await Vault.deploy(usdc.target, ceo.address, agent.address);

        // Mint USDC to CEO for vault funding
        await usdc.mint(ceo.address, ethers.parseUnits("1000", 6));

        // CEO deposits into Vault
        await usdc.connect(ceo).approve(vault.target, ethers.parseUnits("1000", 6));
        // Simulate deposit for testing limits (transfer to vault directly)
        await usdc.connect(ceo).transfer(vault.target, ethers.parseUnits("500", 6));
    });

    describe("Agent Guardrails", function () {
        it("Should block transfers to non-whitelisted addresses", async function () {
            const amount = ethers.parseUnits("5", 6);
            await expect(
                vault.connect(agent).executeTransfer(vendor.address, amount)
            ).to.be.revertedWith("OTTO: Recipient not whitelisted");
        });

        it("Should allow transfers to whitelisted addresses within limits", async function () {
            await vault.connect(ceo).setWhitelist(vendor.address, true);
            const amount = ethers.parseUnits("5", 6);

            await vault.connect(agent).executeTransfer(vendor.address, amount);
            expect(await usdc.balanceOf(vendor.address)).to.equal(amount);
        });

        it("Should enforce per-tx limits", async function () {
            await vault.connect(ceo).setWhitelist(vendor.address, true);
            // Default perTx is 10
            const amount = ethers.parseUnits("11", 6);
            await expect(
                vault.connect(agent).executeTransfer(vendor.address, amount)
            ).to.be.revertedWith("OTTO: Exceeds per-tx limit");
        });
    });

    describe("O(1) Revenue Distribution", function () {
        it("Should distribute revenue based on share size", async function () {
            // Register shares 
            // Shareholder 1: 40% (4,000 shares)
            // Shareholder 2: 60% (6,000 shares)
            await vault.connect(shareholder1).registerShares(4000);
            await vault.connect(shareholder2).registerShares(6000);

            // CEO deposits 100 USDC yield
            const yieldAmount = ethers.parseUnits("100", 6);
            await usdc.connect(ceo).approve(vault.target, yieldAmount);
            await vault.connect(ceo).distribute(yieldAmount);

            // Shareholder 1 claims
            await vault.connect(shareholder1).claimRevenue();
            expect(await usdc.balanceOf(shareholder1.address)).to.equal(ethers.parseUnits("40", 6));

            // Shareholder 2 claims
            await vault.connect(shareholder2).claimRevenue();
            expect(await usdc.balanceOf(shareholder2.address)).to.equal(ethers.parseUnits("60", 6));
        });
    });
});
