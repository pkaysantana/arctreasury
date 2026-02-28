import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ArcTreasury | Programmable USDC Treasury",
    description: "Enterprise-grade treasury management for the Arc Layer-1 blockchain.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Web3Provider>
                    <ToastProvider>{children}</ToastProvider>
                </Web3Provider>
            </body>
        </html>
    );
}

