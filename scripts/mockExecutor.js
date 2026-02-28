/**
 * ArcTreasury Mock Executor Bot
 * ──────────────────────────────
 * A lightweight Node.js daemon that calls `executePayout(policyId, amount)`
 * on a 60-second loop, simulating an agentic treasury automation layer.
 *
 * Usage:
 *   PRIVATE_KEY=0x... TREASURY_ADDRESS=0x... RPC_URL=http://127.0.0.1:8545 node mockExecutor.js
 */

const { createPublicClient, createWalletClient, http, parseUnits, formatUnits } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { hardhat } = require("viem/chains");

// ─── Configuration ───────────────────────────────────────────────────────────
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in environment");
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const POLICY_ID = BigInt(process.env.POLICY_ID || "1");
const PAYOUT_AMOUNT = process.env.PAYOUT_AMOUNT || "10000"; // 10,000 USDC
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || "60000", 10);

// ─── ABI (subset for executePayout) ──────────────────────────────────────────
const ABI = [
    {
        inputs: [
            { internalType: "uint256", name: "_policyId", type: "uint256" },
            { internalType: "uint256", name: "totalPayoutAmount", type: "uint256" },
        ],
        name: "executePayout",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "policies",
        outputs: [
            { internalType: "uint256", name: "lastPayout", type: "uint256" },
            { internalType: "uint256", name: "payoutInterval", type: "uint256" },
            { internalType: "bool", name: "paused", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
    },
];

// ─── Clients ─────────────────────────────────────────────────────────────────
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(RPC_URL),
});

const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http(RPC_URL),
});

// ─── Core Loop ───────────────────────────────────────────────────────────────
let tick = 0;

async function executeCycle() {
    tick++;
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ─── Tick #${tick} ───`);

    try {
        // 1. Read policy state
        const policy = await publicClient.readContract({
            address: TREASURY_ADDRESS,
            abi: ABI,
            functionName: "policies",
            args: [POLICY_ID],
        });

        const [lastPayout, payoutInterval, paused] = policy;
        console.log(`  Policy ${POLICY_ID}: lastPayout=${lastPayout}, interval=${payoutInterval}, paused=${paused}`);

        if (paused) {
            console.log("  ⏸  Policy is paused. Skipping.");
            return;
        }

        // 2. Execute payout
        const amount = parseUnits(PAYOUT_AMOUNT, 6);
        console.log(`  💸 Executing payout: ${PAYOUT_AMOUNT} USDC to policy #${POLICY_ID}...`);

        const hash = await walletClient.writeContract({
            address: TREASURY_ADDRESS,
            abi: ABI,
            functionName: "executePayout",
            args: [POLICY_ID, amount],
        });

        console.log(`  ✅ Tx submitted: ${hash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`  📦 Confirmed in block ${receipt.blockNumber} | gas: ${receipt.gasUsed}`);
    } catch (err) {
        console.error(`  ❌ Error: ${err.shortMessage || err.message}`);
    }
}

// ─── Start ───────────────────────────────────────────────────────────────────
console.log("╔══════════════════════════════════════════╗");
console.log("║   ArcTreasury Mock Executor Bot v1.0     ║");
console.log("╠══════════════════════════════════════════╣");
console.log(`║  Treasury : ${TREASURY_ADDRESS.slice(0, 10)}...${TREASURY_ADDRESS.slice(-6)}`);
console.log(`║  Policy   : #${POLICY_ID}`);
console.log(`║  Amount   : ${PAYOUT_AMOUNT} USDC`);
console.log(`║  Interval : ${INTERVAL_MS / 1000}s`);
console.log(`║  Executor : ${account.address.slice(0, 10)}...${account.address.slice(-6)}`);
console.log("╚══════════════════════════════════════════╝");

// Run immediately, then on interval
executeCycle();
setInterval(executeCycle, INTERVAL_MS);
