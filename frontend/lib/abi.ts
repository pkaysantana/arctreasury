export const ARC_TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const ArcTreasuryABI = [
    {
        inputs: [{ internalType: "address", name: "_usdc", type: "address" }],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "Deposited",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
            { indexed: false, internalType: "address[]", name: "recipients", type: "address[]" },
            { indexed: false, internalType: "uint256[]", name: "percentages", type: "uint256[]" },
            { indexed: false, internalType: "uint256", name: "interval", type: "uint256" },
        ],
        name: "PolicyCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" },
        ],
        name: "PayoutExecuted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "policyId", type: "uint256" },
            { indexed: false, internalType: "bool", name: "paused", type: "bool" },
        ],
        name: "PolicyStatusChanged",
        type: "event",
    },
    {
        inputs: [],
        name: "admin",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "deposit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address[]", name: "_recipients", type: "address[]" },
            { internalType: "uint256[]", name: "_percentages", type: "uint256[]" },
            { internalType: "uint256", name: "_interval", type: "uint256" },
        ],
        name: "createPolicy",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
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
        inputs: [{ internalType: "uint256", name: "_policyId", type: "uint256" }],
        name: "pausePolicy",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_policyId", type: "uint256" }],
        name: "raiseDispute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "nextPolicyId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
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
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "usdcBalances",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "usdc",
        outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;
