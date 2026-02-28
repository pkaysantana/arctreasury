"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Wallet,
    ArrowUpRight,
    History,
    Pause,
    Play,
    AlertCircle,
    ChevronRight,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    TrendingUp,
    Loader2,
} from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import PolicyBuilder from "@/components/PolicyBuilder";
import { useAccount } from "wagmi";
import {
    useExecutePayout,
    usePausePolicy,
    useRaiseDispute,
} from "@/hooks/useArcTreasury";
import { useToast } from "@/components/Toast";

// ─── Mock policy data (would come from on-chain indexing in production) ──────
const MOCK_POLICIES = [
    {
        id: 0,
        label: "#P-1002",
        recipients: "Ops / Marketing / Dev",
        frequency: "Every 30 Days",
        next: "Mar 12, 2026",
        status: "Active" as const,
        payoutAmount: "50000",
    },
    {
        id: 1,
        label: "#P-1003",
        recipients: "Liquidity Pool A",
        frequency: "Weekly",
        next: "Mar 05, 2026",
        status: "Paused" as const,
        payoutAmount: "10000",
    },
    {
        id: 2,
        label: "#P-1004",
        recipients: "Founder Vesting",
        frequency: "Bi-Weekly",
        next: "Mar 15, 2026",
        status: "Active" as const,
        payoutAmount: "75000",
    },
];

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { isConnected } = useAccount();

    return (
        <div className="flex min-h-screen bg-[#0A0A0B] text-[#FAFAFA] antialiased">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#1F1F23] bg-[#0A0A0B] flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                            A
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">ArcTreasury</h1>
                    </div>

                    <nav className="space-y-1">
                        <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="Dashboard" />
                        <NavItem active={activeTab === "policies"} onClick={() => setActiveTab("policies")} icon={<ShieldCheck size={20} />} label="Policies" />
                        <NavItem active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={20} />} label="Activity" />
                        <NavItem active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={20} />} label="Settings" />
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-[#1F1F23]">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-600/20">
                        <p className="text-xs text-zinc-400 mb-2">Powered by</p>
                        <p className="text-sm font-semibold">Arc Layer-1</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-[#1F1F23] flex items-center justify-between px-8 bg-[#0A0A0B]/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
                        <p className="text-xs text-zinc-500">Manage your programmable USDC treasury</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <WalletButton />
                    </div>
                </header>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Treasury Balance Hero */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 p-8 rounded-2xl bg-[#111113] border border-[#1F1F23] relative overflow-hidden card-gradient group">
                            <div className="absolute top-0 right-0 p-8 text-blue-600/10 group-hover:text-blue-600/20 transition-colors">
                                <Wallet size={120} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-zinc-400 mb-1">Total Treasury Balance</p>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <h3 className="text-5xl font-bold">2,450,000.00</h3>
                                    <span className="text-xl font-medium text-zinc-500">USDC</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="btn-primary flex items-center gap-2">
                                        <Plus size={18} /> Deposit Funds
                                    </button>
                                    <button className="btn-secondary">View Transactions</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-2xl bg-[#111113] border border-[#1F1F23] flex flex-col justify-between card-gradient">
                            <div>
                                <p className="text-sm font-medium text-zinc-400 mb-1">Active Yield</p>
                                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-4">
                                    <TrendingUp size={16} /> 4.2% APY
                                </div>
                            </div>
                            <div>
                                <div className="h-12 w-full bg-zinc-900 rounded-lg overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-blue-600 w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 text-right">67% Utilization</p>
                            </div>
                        </div>
                    </section>

                    {/* Active Policies */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">Active Payout Policies</h4>
                            <button className="text-sm text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
                                Create New <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="rounded-2xl border border-[#1F1F23] bg-[#111113] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="border-b border-[#1F1F23] bg-[#0A0A0B]/50">
                                    <tr className="text-xs text-zinc-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Policy ID</th>
                                        <th className="px-6 py-4">Recipients</th>
                                        <th className="px-6 py-4">Frequency</th>
                                        <th className="px-6 py-4">Next Payout</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F1F23]">
                                    {MOCK_POLICIES.map((policy) => (
                                        <PolicyRow
                                            key={policy.id}
                                            policyId={BigInt(policy.id)}
                                            label={policy.label}
                                            recipients={policy.recipients}
                                            frequency={policy.frequency}
                                            next={policy.next}
                                            status={policy.status}
                                            payoutAmount={policy.payoutAmount}
                                            isConnected={isConnected}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Policy Builder Mount */}
                    <section className="p-8 rounded-2xl bg-[#0F1014] border border-[#1F1F23]">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-blue-600/10 rounded-xl text-blue-500">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold">New Policy Automation</h4>
                                <p className="text-sm text-zinc-400">Streamline your distributions with programmable, on-chain logic.</p>
                            </div>
                        </div>
                        <PolicyBuilder />
                    </section>
                </div>
            </main>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active ? "bg-zinc-900 text-white font-medium" : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
                }`}
        >
            <span className={active ? "text-blue-500" : "group-hover:text-zinc-300"}>{icon}</span>
            {label}
        </button>
    );
}

function PolicyRow({
    policyId,
    label,
    recipients,
    frequency,
    next,
    status,
    payoutAmount,
    isConnected,
}: {
    policyId: bigint;
    label: string;
    recipients: string;
    frequency: string;
    next: string;
    status: "Active" | "Paused";
    payoutAmount: string;
    isConnected: boolean;
}) {
    const isActive = status === "Active";
    const { toast } = useToast();

    // ─── Execute Payout ────
    const executePayout = useExecutePayout(policyId, payoutAmount);
    const [executingPayout, setExecutingPayout] = useState(false);

    const handleExecute = async () => {
        if (!isConnected) {
            toast("Connect your wallet first", "error");
            return;
        }
        if (!executePayout.write) {
            toast("Transaction not ready — check contract state", "error");
            return;
        }
        setExecutingPayout(true);
        const loadingId = toast(`Executing payout for ${label}...`, "loading");
        try {
            await executePayout.writeAsync?.();
            toast(`Payout executed for ${label}`, "success");
        } catch (err: any) {
            toast(err?.shortMessage || "Payout failed", "error");
        } finally {
            setExecutingPayout(false);
        }
    };

    // ─── Pause / Dispute ────
    const pausePolicy = usePausePolicy(policyId);

    const handleTogglePause = async () => {
        if (!isConnected) {
            toast("Connect your wallet first", "error");
            return;
        }
        if (!pausePolicy.write) {
            toast("Transaction not ready", "error");
            return;
        }
        const loadingId = toast(isActive ? `Pausing ${label}...` : `Resuming ${label}...`, "loading");
        try {
            await pausePolicy.writeAsync?.();
            toast(isActive ? `${label} paused` : `${label} resumed`, "success");
        } catch (err: any) {
            toast(err?.shortMessage || "Action failed", "error");
        }
    };

    return (
        <tr className="hover:bg-zinc-900/30 transition-colors group">
            <td className="px-6 py-5 align-middle">
                <span className="font-mono text-xs text-zinc-400">{label}</span>
            </td>
            <td className="px-6 py-5 align-middle">
                <p className="text-sm font-medium">{recipients}</p>
                <p className="text-[10px] text-zinc-500">USDC Managed</p>
            </td>
            <td className="px-6 py-5 align-middle">
                <span className="text-sm">{frequency}</span>
            </td>
            <td className="px-6 py-5 align-middle text-sm">{next}</td>
            <td className="px-6 py-5 align-middle text-sm font-medium">
                <div className={`flex items-center gap-1.5 ${isActive ? "text-emerald-400" : "text-amber-400"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-amber-400"}`}></div>
                    {status}
                </div>
            </td>
            <td className="px-6 py-5 align-middle text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleExecute}
                        disabled={executingPayout}
                        className="p-2 hover:bg-blue-600/10 text-blue-500 rounded-md transition-colors disabled:opacity-40"
                        title="Execute Payout"
                    >
                        {executingPayout ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
                    </button>
                    <button
                        onClick={handleTogglePause}
                        className="p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400"
                        title={isActive ? "Pause Policy" : "Resume Policy"}
                    >
                        {isActive ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                </div>
            </td>
        </tr>
    );
}
