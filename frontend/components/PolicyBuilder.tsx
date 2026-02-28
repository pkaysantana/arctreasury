"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Shield, Loader2, ArrowRight } from "lucide-react";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

// Minimal ABI strictly for the createPolicy function
const arcTreasuryABI = [
    {
        "inputs": [
            { "internalType": "address[]", "name": "_recipients", "type": "address[]" },
            { "internalType": "uint256[]", "name": "_percentages", "type": "uint256[]" },
            { "internalType": "uint256", "name": "_interval", "type": "uint256" }
        ],
        "name": "createPolicy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export default function PolicyBuilder() {
    const [recipients, setRecipients] = useState([{ address: "", percentage: "" }]);
    const [intervalMinutes, setIntervalMinutes] = useState("");

    // 1. Dynamic Recipient Management
    const addRecipient = () => {
        setRecipients([...recipients, { address: "", percentage: "" }]);
    };

    const removeRecipient = (index: number) => {
        const newRecipients = [...recipients];
        newRecipients.splice(index, 1);
        setRecipients(newRecipients);
    };

    const updateRecipient = (index: number, field: "address" | "percentage", value: string) => {
        const newRecipients = [...recipients];
        newRecipients[index][field] = value;
        setRecipients(newRecipients);
    };

    // 2. Strict Validation: Sum must be exactly 100%
    const currentTotalPercentage = useMemo(() => {
        return recipients.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
    }, [recipients]);

    const isSumValid = currentTotalPercentage === 100;
    const isIntervalValid = parseInt(intervalMinutes) > 0;
    const allAddressesValid = recipients.every(
        (r) => r.address.startsWith("0x") && r.address.length === 42
    );

    const isFormValid = isSumValid && isIntervalValid && allAddressesValid && recipients.length > 0;

    // Prepare payload data
    const addresses = recipients.map((r) => r.address as `0x${string}`);
    // Contract expects basis points (e.g., 50% = 5000), assuming standard BPS or direct 100 scale.
    // Assuming the contract expects direct percentage sums to 100 (or BPS). If it expects 100 as the total:
    const percentages = recipients.map((r) => BigInt(Math.floor(parseFloat(r.percentage))));
    const intervalSeconds = BigInt(parseInt(intervalMinutes || "0") * 60);

    // 3. Web3 Hooks (using wagmi v1 based on project dependencies)
    const { config } = usePrepareContractWrite({
        address: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
        abi: arcTreasuryABI,
        functionName: "createPolicy",
        args: [addresses, percentages, intervalSeconds],
        enabled: isFormValid,
    });

    const { data: writeData, write: executeCreatePolicy, isLoading: isWriting } = useContractWrite(config);

    const { isLoading: isWaiting, isSuccess, isError } = useWaitForTransaction({
        hash: writeData?.hash,
    });

    const isTxPending = isWriting || isWaiting;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 max-w-3xl mx-auto flex flex-col gap-6 text-gray-100 shadow-xl shadow-black/50">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Policy Builder</h2>
                    <p className="text-sm text-gray-400">Deploy a new automated distribution policy</p>
                </div>
            </div>

            {/* Recipient List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-gray-300">Recipients & Allocations</label>
                    <span
                        className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${currentTotalPercentage === 100
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            }`}
                    >
                        Total: {currentTotalPercentage}% / 100%
                    </span>
                </div>

                {recipients.map((recipient, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-950 p-3 rounded-lg border border-gray-800/80">
                        <input
                            type="text"
                            placeholder="0x..."
                            value={recipient.address}
                            onChange={(e) => updateRecipient(index, "address", e.target.value)}
                            className="bg-transparent border border-gray-800 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-mono placeholder-gray-700"
                        />
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-32">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={recipient.percentage}
                                    onChange={(e) => updateRecipient(index, "percentage", e.target.value)}
                                    className="bg-transparent border border-gray-800 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-mono pr-8 placeholder-gray-700"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500 font-mono">%</span>
                            </div>
                            <button
                                onClick={() => removeRecipient(index)}
                                disabled={recipients.length === 1}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addRecipient}
                    className="flex items-center gap-2 text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors pt-2"
                >
                    <Plus className="w-4 h-4" /> Add Recipient
                </button>
            </div>

            {/* Interval Setup */}
            <div className="space-y-2 border-t border-gray-800 pt-6">
                <label className="text-sm font-semibold text-gray-300">Execution Interval (Minutes)</label>
                <input
                    type="number"
                    placeholder="e.g., 60 for 1 hour"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(e.target.value)}
                    className="bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-mono placeholder-gray-700"
                />
            </div>

            {/* Submission Status & Button */}
            <div className="pt-6 border-t border-gray-800">
                {isError && (
                    <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                        Failed to prepare or execute transaction. Ensure wallet is connected, inputs are valid, and you have testnet gas.
                    </div>
                )}

                {isSuccess && (
                    <div className="mb-4 text-sm text-green-400 bg-green-400/10 border border-green-400/20 p-3 rounded-lg flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Policy successfully instantiated on-chain!
                    </div>
                )}

                <button
                    onClick={() => executeCreatePolicy?.()}
                    disabled={!isFormValid || !executeCreatePolicy || isTxPending}
                    className="w-full relative group bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed border border-transparent disabled:border-gray-700"
                >
                    {isTxPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isWaiting ? "Confirming on Arc..." : "Awaiting Wallet..."}
                        </>
                    ) : (
                        <>
                            Deploy Policy
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
