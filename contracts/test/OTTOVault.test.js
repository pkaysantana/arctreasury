const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OTTOVaultV2 O(1) Distribution Stress Test & Limits", function () {
    let usdc, token, vault;
    let ceo, agent, vendor;
    let shareholders;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        ceo = signers[0];
        agent = signers[1];
        vendor = signers[2];
        shareholders = signers.slice(3, 13); // 10 shareholders

        // Deploy Mock USDC
        const USDC = await ethers.getContractFactory("MockUSDC");
        usdc = await USDC.deploy();

        // Deploy ShareToken
        const Token = await ethers.getContractFactory("OTTOShareToken");
        token = await Token.deploy("OTTO Shares", "OST", ceo.address);

        // Deploy Vault
        const Vault = await ethers.getContractFactory("OTTOVaultV2");
        vault = await Vault.deploy(usdc.target, ceo.address, agent.address);

        // Link
        await vault.setShareToken(token.target);
        await token.setVault(vault.target);

        // Fund CEO with USDC for distribution and general testing
        await usdc.mint(ceo.address, ethers.parseUnits("10000", 6));

        // CEO deposits to Vault for agent spending limits test
        await usdc.connect(ceo).transfer(vault.target, ethers.parseUnits("500", 6));

        // Distribute 1,000 shares to each of the 10 shareholders
        for (let i = 0; i < shareholders.length; i++) {
            await token.connect(ceo).transfer(shareholders[i].address, ethers.parseUnits("1000", 18));
        }
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
            const amount = ethers.parseUnits("11", 6);
            await expect(
                vault.connect(agent).executeTransfer(vendor.address, amount)
            ).to.be.revertedWith("OTTO: Exceeds per-tx limit");
        });
    });

    describe("O(1) Revenue Distribution with 10+ Mock Shareholders", function () {
        it("Should correctly distribute yield to 10+ shareholders simultaneously without loops", async function () {
            // Total shares is 10,000. Each has 1,000 (10%).
            // CEO distributes 1,000 USDC yield
            const yieldAmount = ethers.parseUnits("1000", 6);
            await usdc.connect(ceo).approve(vault.target, yieldAmount);
            await vault.connect(ceo).distribute(yieldAmount);

            // Each should get exactly 100 USDC (10% of 1000)
            for (let i = 0; i < shareholders.length; i++) {
                await vault.connect(shareholders[i]).claimRevenue();
                const balance = await usdc.balanceOf(shareholders[i].address);
                expect(balance).to.equal(ethers.parseUnits("100", 6)); // 100 USDC
            }
        });

        it("Should properly manage transfers post-distribution", async function () {
            const yieldAmount = ethers.parseUnits("1000", 6);
            await usdc.connect(ceo).approve(vault.target, yieldAmount);
            await vault.connect(ceo).distribute(yieldAmount);

            // Shareholder 0 claims
            await vault.connect(shareholders[0]).claimRevenue();
            expect(await usdc.balanceOf(shareholders[0].address)).to.equal(ethers.parseUnits("100", 6));

            // Shareholder 0 transfers 500 shares to shareholder 1
            await token.connect(shareholders[0]).transfer(shareholders[1].address, ethers.parseUnits("500", 18));

            // Shareholder 1 now claims, should only get the 100 USDC from before the transfer (historical reward shouldn't transfer)
            await vault.connect(shareholders[1]).claimRevenue();
            expect(await usdc.balanceOf(shareholders[1].address)).to.equal(ethers.parseUnits("100", 6));

            // If CEO distributes another 1,000
            await usdc.connect(ceo).approve(vault.target, yieldAmount);
            await vault.connect(ceo).distribute(yieldAmount);

            // Shareholder 0 now has 500 shares (5%) = 50 USDC
            await vault.connect(shareholders[0]).claimRevenue();
            expect(await usdc.balanceOf(shareholders[0].address)).to.equal(ethers.parseUnits("150", 6)); // 100 + 50

            // Shareholder 1 now has 1500 shares (15%) = 150 USDC
            await vault.connect(shareholders[1]).claimRevenue();
            expect(await usdc.balanceOf(shareholders[1].address)).to.equal(ethers.parseUnits("250", 6)); // 100 + 150
        });
    });
});
