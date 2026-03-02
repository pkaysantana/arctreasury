# ArcTreasury: Deterministic USDC Treasury Engine on Arc

ArcTreasury is a foundational financial control layer built on the Arc Layer-1 blockchain. It provides deterministic, programmable constraints for USDC payouts, acting as a secure primitive for agent networks, DAO treasuries, and enterprise asset management.

Instead of full-stack protocols or monolithic governance systems, ArcTreasury focuses on doing one thing exceptionally well: enforcing mathematical and policy-driven guardrails on on-chain capital.

---

## The Core Primitive

ArcTreasury is designed as a minimalist, highly secure vault with strict Role-Based Access Control (RBAC):

- **Deterministic Constraints**: Hardcoded EVM-level limits on transaction sizes (`perTxLimit`) and velocity (`dailyLimit`).
- **Whitelist Enforcement**: Transfers can only be executed to pre-approved addresses set by the administrator (`CEO_ROLE`).
- **O(1) Batched Distribution**: Implements a pull-claim architecture (inspired by Synthetix staking rewards) allowing the administrator to distribute yield or funds to multiple shareholders in a single O(1) gas transaction. Shareholders then pull their exact pro-rata share.

## Architecture

```text
ArcTreasury/
├── contracts/          # Hardhat Smart Contract Suite
│   ├── contracts/      # OTTOVaultV2.sol (Core Treasury Engine)
│   ├── test/           # Exhaustive Guardrail & Limit Tests
│   └── scripts/        # Deployment Scripts
└── frontend/           # Next.js Dashboard (In Development)
```

**Tech Stack:**

- **Smart Contracts**: Solidity ^0.8.24, Hardhat, OpenZeppelin ^5.0.0.
- **Frontend**: Next.js, Tailwind CSS, wagmi.

---

## Layer 2: Optional Agent Module (Experimental)

While ArcTreasury functions perfectly as a standalone multisig or admin-controlled vault, its deterministic guardrails make it the ideal financial primitive for **Agentic Execution**.

By assigning the `AGENT_ROLE` to an AI wallet (e.g., a Claude-powered script), the agent can execute autonomous payouts, payroll, or rebalancing.
Crucially, **the agent cannot go rogue.** If the agent hallucinates a payout to an unapproved address or exceeds its daily limits, the EVM physically blocks the transaction.

*Note: The agent integration is currently experimental and designed to run on top of the ArcTreasury primitive.*

---

## Future: Cross-Chain & RWA Integration

The roadmap for ArcTreasury includes extending the primitive to natively support cross-chain settlement (e.g., via Circle CCTP `burnAndMint`) and integration with tokenized Real World Assets (e.g., USYC) for idle yield generation.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- NPM/PNPM

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/pkaysantana/arctreasury.git
   cd arctreasury
   ```

2. **Compile Smart Contracts**

   ```bash
   cd contracts
   npm install
   npx hardhat compile
   ```

3. **Run Test Suite**
   The test suite rigorously verifies the EVM guardrails and the O(1) pull-claim distribution math.

   ```bash
   npx hardhat test
   ```

---

## License

MIT License - Created for the Arc Layer-1 blockchain ecosystem.
