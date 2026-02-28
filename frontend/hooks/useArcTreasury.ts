"use client";

import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { ArcTreasuryABI, ARC_TREASURY_ADDRESS } from "@/lib/abi";
import { parseUnits } from "viem";

// ─── Read Hooks ──────────────────────────────────────────────────────────────

export function useTreasuryAdmin() {
    return useContractRead({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "admin",
    });
}

export function useNextPolicyId() {
    return useContractRead({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "nextPolicyId",
    });
}

export function usePolicy(policyId: bigint) {
    return useContractRead({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "policies",
        args: [policyId],
        enabled: policyId !== undefined,
    });
}

export function useUsdcBalance(address: `0x${string}` | undefined) {
    return useContractRead({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "usdcBalances",
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

// ─── Write Hooks ─────────────────────────────────────────────────────────────

export function useDeposit(amount: string) {
    const parsed = amount ? parseUnits(amount, 6) : BigInt(0);
    const { config } = usePrepareContractWrite({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "deposit",
        args: [parsed],
        enabled: parsed > BigInt(0),
    });
    const write = useContractWrite(config);
    const wait = useWaitForTransaction({ hash: write.data?.hash });
    return { ...write, wait };
}

export function useCreatePolicy(
    recipients: `0x${string}`[],
    percentages: bigint[],
    interval: bigint,
) {
    const { config } = usePrepareContractWrite({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "createPolicy",
        args: [recipients, percentages, interval],
        enabled: recipients.length > 0 && recipients.length === percentages.length,
    });
    const write = useContractWrite(config);
    const wait = useWaitForTransaction({ hash: write.data?.hash });
    return { ...write, wait };
}

export function useExecutePayout(policyId: bigint, totalAmount: string) {
    const parsed = totalAmount ? parseUnits(totalAmount, 6) : BigInt(0);
    const { config } = usePrepareContractWrite({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "executePayout",
        args: [policyId, parsed],
        enabled: parsed > BigInt(0),
    });
    const write = useContractWrite(config);
    const wait = useWaitForTransaction({ hash: write.data?.hash });
    return { ...write, wait };
}

export function usePausePolicy(policyId: bigint) {
    const { config } = usePrepareContractWrite({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "pausePolicy",
        args: [policyId],
    });
    const write = useContractWrite(config);
    const wait = useWaitForTransaction({ hash: write.data?.hash });
    return { ...write, wait };
}

export function useRaiseDispute(policyId: bigint) {
    const { config } = usePrepareContractWrite({
        address: ARC_TREASURY_ADDRESS,
        abi: ArcTreasuryABI,
        functionName: "raiseDispute",
        args: [policyId],
    });
    const write = useContractWrite(config);
    const wait = useWaitForTransaction({ hash: write.data?.hash });
    return { ...write, wait };
}
