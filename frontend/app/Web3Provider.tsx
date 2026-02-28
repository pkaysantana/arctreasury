"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { hardhat } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

const arcTestnet = {
    id: 5042002,
    name: "Arc Testnet",
    network: "arc-testnet",
    nativeCurrency: {
        decimals: 18,
        name: "USDC",
        symbol: "USDC",
    },
    rpcUrls: {
        public: { http: ["https://rpc.testnet.arc.network"] },
        default: { http: ["https://rpc.testnet.arc.network"] },
    },
    blockExplorers: {
        default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
    },
} as const;

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [arcTestnet, hardhat],
    // If an Alchemy key is set, use their hardened RPC (rate limiting + DDoS mitigation).
    // Falls back gracefully to the public provider for local dev without a key.
    alchemyKey
        ? [alchemyProvider({ apiKey: alchemyKey }), publicProvider()]
        : [publicProvider()],
);

const config = createConfig({
    autoConnect: true,
    connectors: [
        new MetaMaskConnector({ chains }),
        new InjectedConnector({ chains, options: { name: "Injected" } }),
    ],
    publicClient,
    webSocketPublicClient,
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiConfig config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiConfig>
    );
};
