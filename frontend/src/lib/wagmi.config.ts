import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const wagmiConfig = getDefaultConfig({
  appName: "VEIL Perps",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "veil-perps-dev",
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    ),
    [base.id]: http(
      import.meta.env.VITE_BASE_RPC || "https://mainnet.base.org",
    ),
  },
});

export const TARGET_CHAIN = baseSepolia;
