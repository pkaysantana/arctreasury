require("dotenv").config();
const { ethers } = require("ethers");

// Terminal color codes for professional demo output
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    dim: "\x1b[2m",
};

// Configuration
const RPC_URL = process.env.RPC_URL || "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TREASURY_ADDRESS = "0xDE4246Ca462e603B782a455EC9C77D64";
const INTERVAL_MS = 15000; // Check every 15 seconds

if (!PRIVATE_KEY) {
    console.error(`${colors.red}[FATAL] Missing PRIVATE_KEY in .env file${colors.reset}`);
    process.exit(1);
}

// Minimal ABI
const ARC_TREASURY_ABI = [
    "function executePayout(uint256 _policyId) external",
    "function policies(uint256) external view returns (uint256 lastPayout, uint256 interval, bool paused)"
];

async function main() {
    console.log(`${colors.cyan}======================================================${colors.reset}`);
    console.log(`${colors.cyan}[INIT] Starting ArcTreasury Automated Executor Bot...${colors.reset}`);
    console.log(`${colors.cyan}======================================================${colors.reset}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const treasury = new ethers.Contract(TREASURY_ADDRESS, ARC_TREASURY_ABI, wallet);

    console.log(`${colors.green}[CONNECTED] Wallet: ${wallet.address}${colors.reset}`);
    console.log(`${colors.green}[TARGET] Contract: ${TREASURY_ADDRESS}${colors.reset}\n`);

    // Execution Loop
    setInterval(async () => {
        const policyId = 1n; // Hardcoded to Policy #1 for demo purposes
        console.log(`${colors.dim}[ArcTreasury Bot] Scanning Policy #${policyId}...${colors.reset}`);

        try {
            // Read policy state
            const policy = await treasury.policies(policyId);
            const lastPayout = policy[0]; // uint256
            const interval = policy[1];   // uint256
            const paused = policy[2];     // bool

            if (paused) {
                console.log(`${colors.yellow}[SKIP] Policy #${policyId} is PAUSED.${colors.reset}`);
                return;
            }

            // Get current block timestamp
            const currentBlock = await provider.getBlock("latest");
            const currentTime = BigInt(currentBlock.timestamp);

            const nextPayoutTime = lastPayout + interval;

            if (currentTime >= nextPayoutTime) {
                console.log(`${colors.cyan}[ACTION] Time-lock expired for Policy #${policyId}. Initiating payout...${colors.reset}`);

                // Broadcast transaction
                const tx = await treasury.executePayout(policyId);
                console.log(`${colors.yellow}[PENDING] Payout transaction broadcasted. Hash: ${tx.hash}${colors.reset}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`${colors.green}[SUCCESS] Payout executed for Policy #${policyId} at block ${receipt.blockNumber}.${colors.reset}`);
            } else {
                const remaining = nextPayoutTime - currentTime;
                console.log(`${colors.dim}[WAIT] Policy #${policyId} time-lock active. ${remaining} seconds remaining.${colors.reset}`);
            }

        } catch (error) {
            // Silently log revert errors or RPC failures to prevent the bot from crashing
            if (error.message.includes("revert")) {
                console.log(`${colors.red}[REVERT] Contract rejected execution: ${error.shortMessage || error.message}${colors.reset}`);
            } else {
                console.log(`${colors.red}[ERROR] Network or provider issue: ${error.shortMessage || error.message}${colors.reset}`);
            }
        }
    }, INTERVAL_MS);
}

main().catch((error) => {
    console.error(`${colors.red}[FATAL] ${error.message}${colors.reset}`);
    process.exit(1);
});
