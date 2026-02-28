const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Official Arc Testnet USDC Address
    const MOCK_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

    const ArcTreasury = await hre.ethers.getContractFactory("ArcTreasury");
    const treasury = await ArcTreasury.deploy(MOCK_USDC_ADDRESS);

    await treasury.waitForDeployment();

    console.log("ArcTreasury deployed to:", treasury.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
