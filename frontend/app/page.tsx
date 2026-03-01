"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useContractWrite, useWaitForTransaction } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

// ─── Contract Configuration ──────────────────────────────────────────────────
const TREASURY_ADDRESS = "0xde4246ca462e603b782a455ec9c77d64" as const;

const ABI = [
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
] as const;

// ─── Wallet Button ────────────────────────────────────────────────────────────
function ConnectButton() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { address, isConnected } = useAccount();
    const { connect } = useConnect({ connector: new InjectedConnector() });
    const { disconnect } = useDisconnect();

    if (!mounted) return null;

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-zinc-400 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button onClick={() => disconnect()} className="text-sm text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors">
                    Disconnect
                </button>
            </div>
        );
    }
    return (
        <button
            onClick={() => connect()}
            className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
        >
            Connect Wallet
        </button>
    );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <section className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4">
                <h2 className="text-base font-bold text-white">{title}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function TxStatus({ isLoading, isSuccess, isError, error, hash }: { isLoading: boolean; isSuccess: boolean; isError: boolean; error: Error | null; hash?: string }) {
    if (isLoading) return <p className="text-sm text-yellow-400 mt-3 font-mono">⏳ Broadcasting transaction...</p>;
    if (isSuccess) return <p className="text-sm text-emerald-400 mt-3 font-mono">✅ Confirmed! Hash: {hash?.slice(0, 18)}...</p>;
    if (isError) return (
        <div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg font-mono break-all">
            ❌ {error?.message ?? "Transaction failed"}
        </div>
    );
    return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
    // — Create Policy State
    const [rows, setRows] = useState([{ address: "", percentage: "" }]);
    const [intervalMin, setIntervalMin] = useState("1");

    const totalPct = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.percentage) || 0), 0), [rows]);
    const allValid = rows.every(r => /^0x[0-9a-fA-F]{40}$/.test(r.address.trim())) && totalPct === 100 && parseInt(intervalMin) > 0;

    const addRow = () => setRows(r => [...r, { address: "", percentage: "" }]);
    const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
    const updateRow = (i: number, field: "address" | "percentage", v: string) =>
        setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: field === "address" ? v.trim() : v } : row));

    const {
        write: createPolicy,
        data: createData,
        isLoading: createLoading,
        isError: createIsError,
        error: createError,
    } = useContractWrite({ address: TREASURY_ADDRESS, abi: ABI, functionName: "createPolicy" });

    const { isLoading: createWaiting, isSuccess: createSuccess } = useWaitForTransaction({ hash: createData?.hash });

    const handleCreate = () => {
        if (!allValid) return;
        createPolicy({
            args: [
                rows.map(r => r.address.trim() as `0x${string}`),
                rows.map(r => BigInt(Math.floor(parseFloat(r.percentage)))),
                BigInt(parseInt(intervalMin) * 60),
            ],
        });
    };

    // — Execute Payout State
    const [policyId, setPolicyId] = useState("1");
    const [payoutAmount, setPayoutAmount] = useState("100");

    const {
        write: executePayout,
        data: execData,
        isLoading: execLoading,
        isError: execIsError,
        error: execError,
    } = useContractWrite({ address: TREASURY_ADDRESS, abi: ABI, functionName: "executePayout" });

    const { isLoading: execWaiting, isSuccess: execSuccess } = useWaitForTransaction({ hash: execData?.hash });

    const handleExecute = () => {
        executePayout({
            args: [BigInt(parseInt(policyId) || 0), BigInt(parseInt(payoutAmount) * 1_000_000)],
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            {/* Header */}
            <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-black text-sm">A</div>
                    <h1 className="text-sm font-bold tracking-tight">ArcTreasury <span className="text-zinc-500 font-normal">/ Programmable USDC Routing</span></h1>
                </div>
                <ConnectButton />
            </header>

            {/* Contract Tag */}
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/40">
                <p className="text-xs text-zinc-500 font-mono">
                    Contract: <span className="text-zinc-300">{TREASURY_ADDRESS}</span>
                    <span className="ml-3 text-emerald-400/80">● Arc Testnet (5042002)</span>
                </p>
            </div>

            <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
                {/* ── Create Policy ── */}
                <Card title="01 — Create Policy" subtitle="Define recipients, allocations, and payout interval. Writes to the blockchain.">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-zinc-400 font-semibold uppercase tracking-wider">Recipients</span>
                            <span className={`font-mono px-2 py-0.5 rounded ${totalPct === 100 ? "bg-emerald-400/10 text-emerald-400" : "bg-orange-400/10 text-orange-400"}`}>
                                {totalPct}% / 100%
                            </span>
                        </div>

                        {rows.map((row, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                    placeholder="0x..."
                                    value={row.address}
                                    onChange={e => updateRow(i, "address", e.target.value)}
                                />
                                <div className="relative w-28">
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 pr-7 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                        placeholder="0"
                                        type="number"
                                        value={row.percentage}
                                        onChange={e => updateRow(i, "percentage", e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2 text-zinc-500 text-sm">%</span>
                                </div>
                                <button
                                    onClick={() => removeRow(i)}
                                    disabled={rows.length === 1}
                                    className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-20 px-2"
                                    aria-label="Remove"
                                >✕</button>
                            </div>
                        ))}

                        <button onClick={addRow} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                            <span className="text-lg leading-none">+</span> Add Recipient
                        </button>

                        <div className="pt-2 border-t border-zinc-800 flex items-center gap-3">
                            <label className="text-xs text-zinc-400 whitespace-nowrap">Interval (min)</label>
                            <input
                                className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                                type="number"
                                value={intervalMin}
                                onChange={e => setIntervalMin(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={!allValid || createLoading || createWaiting}
                            className="w-full mt-1 py-2.5 text-sm font-bold bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                        >
                            {createLoading || createWaiting ? "Deploying..." : "Deploy Policy →"}
                        </button>

                        <TxStatus isLoading={createLoading || createWaiting} isSuccess={createSuccess} isError={createIsError} error={createError} hash={createData?.hash} />
                    </div>
                </Card>

                {/* ── Execute Payout ── */}
                <Card title="02 — Manual Execution" subtitle="Hackathon demo override. Trigger a policy payout by ID.">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-zinc-400 mb-1 block">Policy ID</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                                    type="number"
                                    value={policyId}
                                    onChange={e => setPolicyId(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-zinc-400 mb-1 block">Amount (USDC)</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                                    type="number"
                                    value={payoutAmount}
                                    onChange={e => setPayoutAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleExecute}
                            disabled={execLoading || execWaiting}
                            className="w-full py-2.5 text-sm font-bold bg-zinc-100 text-black rounded-lg hover:bg-white transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                        >
                            {execLoading || execWaiting ? "Executing..." : "Execute Payout →"}
                        </button>

                        <TxStatus isLoading={execLoading || execWaiting} isSuccess={execSuccess} isError={execIsError} error={execError} hash={execData?.hash} />
                    </div>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-600 font-mono pb-8">
                    arc testnet · chain id 5042002 · ArcTreasury.sol
                </p>
            </main>
        </div>
    );
}
