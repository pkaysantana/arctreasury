# ArcTreasury

**Programmable USDC Treasury for Enterprise-Grade Asset Management**
ArcTreasury is a secure, policy-driven treasury application that enables organizations to automate fund distributions, manage internal payouts, and maintain real-time visibility over USDC reserves with institutional-grade precision.

---

## Vision: The Programmable CFO

Treasury management in Web3 remains manual, error-prone, and reactive. ArcTreasury transforms the treasury from a static vault into a dynamic, programmable engine. By defining "Payout Policies," organisations can automate complex distributions such as payroll, vesting, or liquidity provisioning—directly on Arc L1.

## Key Features

- **Enterprise Dark Mode UI**: A high-impact, sleek dashboard designed for 16:9 displays, prioritising visual clarity and data density.
- **Programmable Policies**: Define recipients, split percentages, and payout intervals (e.g., Weekly, Bi-Weekly, Monthly).
- **Automated Payout Execution**: Smart-contract enforced intervals ensure funds are only distributed when conditions are met.
- **Dispute & Pause Mechanism**: Admin-level controls to instantly halt policies in case of internal disputes or auditing requirements.
- **USDC Native**: Built from the ground up to integrate with standard ERC20 USDC on Arc Layer-1.

---

## Architecture

ArcTreasury is a monorepo containing a modern Web3 stack:

```text
ArcTreasury/
├── contracts/          # Hardhat Smart Contract Suite
│   ├── contracts/      # ArcTreasury.sol (Solidity ^0.8.20)
│   ├── scripts/        # Deployment & Initialization scripts
│   └── hardhat.config  # Arc L1 Optimized Compiler Settings
└── frontend/           # Next.js 15 App Router Dashboard
    ├── app/            # Enterprise UI Logic & Design System
    ├── components/     # High-polish visual components
    └── wagmi.ts        # Arc L1 Web3 Configuration
```

**Tech Stack:**

- **Smart Contracts**: Solidity, Hardhat, Ethers.js.
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion.
- **Web3**: wagmi, viem, ConnectKit.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- NPM/PNPM

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/pkaysantana/arctreasury.git
   cd arctreasury
   ```

2. **Setup Contracts**

   ```bash
   cd contracts
   npm install
   npx hardhat compile
   ```

3. **Setup Frontend**

   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## Demo Flow (Hackathon Submission)

1. **Connect Wallet**: Securely connect via ConnectKit on the Arc L1 network.
2. **Treasury Deposit**: Admin deposits USDC into the `ArcTreasury` contract.
3. **Policy Creation**: Create a "Monthly Payroll" policy with 3 recipients and a 30-day interval.
4. **Execute Payout**: Once the interval passes, click "Execute" to trigger a multi-split USDC distribution in a single atomic transaction.
5. **Transparency**: View real-time status updates (Active/Paused) and historical distributions.

## License

MIT License - Created for Arc Layer-1 blockchain ecosystem.
