const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying DAC with account:", deployer.address);

    // Addresses for setup
    // In a real scenario, use actual addresses. For the script, we can mock if not set.
    const usdc = process.env.USDC_ADDRESS || deployer.address; // Placeholder
    const agent = process.env.AGENT_ADDRESS || deployer.address;
    const newCeo = process.env.NEW_CEO_ADDRESS || deployer.address;

    // 1. Deploy OTTOShareToken
    console.log("Deploying OTTOShareToken...");
    const Token = await ethers.getContractFactory("OTTOShareToken");
    const token = await Token.deploy("OTTO Shares", "OST", deployer.address);
    await token.waitForDeployment();
    console.log("OTTOShareToken deployed to:", token.target);

    // 2. Deploy OTTOVaultV2
    console.log("Deploying OTTOVaultV2...");
    const Vault = await ethers.getContractFactory("OTTOVaultV2");
    // Deploy vault with deployer as CEO initially so we can set things up
    const vault = await Vault.deploy(usdc, deployer.address, deployer.address);
    await vault.waitForDeployment();
    console.log("OTTOVaultV2 deployed to:", vault.target);

    // Wire them together
    console.log("Linking Token and Vault...");
    const initialSupply = ethers.parseUnits("10000", await token.decimals());
    await vault.setShareToken(token.target, deployer.address, initialSupply);
    await token.setVault(vault.target);

    // 3 & 4. Setup Roles
    console.log("Setting up roles...");
    const CEO_ROLE = await vault.CEO_ROLE();
    const AGENT_ROLE = await vault.AGENT_ROLE();

    // Grant Agent Role
    await vault.grantRole(AGENT_ROLE, agent);

    // Transfer CEO Role
    await vault.grantRole(CEO_ROLE, newCeo);

    // Optional: Revoke deployer roles if not the new CEO/Agent
    if (deployer.address !== agent) {
        await vault.revokeRole(AGENT_ROLE, deployer.address);
    }
    if (deployer.address !== newCeo) {
        await vault.revokeRole(CEO_ROLE, deployer.address);
    }

    console.log("DAC Setup Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
