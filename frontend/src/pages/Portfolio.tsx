import { useState } from "react";
import { useAccount } from "wagmi";
import { PnLDisplay } from "@/components/Portfolio/PnLDisplay";
import { OpenPositions } from "@/components/Portfolio/OpenPositions";
import { TradeHistory } from "@/components/Portfolio/TradeHistory";
import { Shield } from "lucide-react";

type Tab = "open" | "history";

export function PortfolioPage() {
  const [tab, setTab] = useState<Tab>("open");
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-arcium-500/10 border border-arcium-500/20 flex items-center justify-center mb-4">
          <Shield size={24} className="text-arcium-400" />
        </div>
        <h2 className="text-xl font-display font-600 text-ivory mb-2">
          Connect to view portfolio
        </h2>
        <p className="text-sm text-dim font-mono">
          Your positions and history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-600 text-ivory">Portfolio</h1>
        <div className="flex items-center gap-1.5 text-xs font-mono text-dim">
          <div className="w-1.5 h-1.5 rounded-full bg-arcium-400 animate-pulse" />
          Arcium MXE active
        </div>
      </div>

      {/* PnL Summary */}
      <PnLDisplay />

      {/* Tabs */}
      <div className="panel overflow-hidden">
        <div className="flex border-b border-border">
          {(["open", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-display font-600 transition-all duration-150 capitalize
                ${
                  tab === t
                    ? "text-ivory border-b-2 border-arcium-400 -mb-px"
                    : "text-dim hover:text-ghost"
                }`}
            >
              {t === "open" ? "Open Positions" : "Trade History"}
            </button>
          ))}
        </div>

        {tab === "open" ? <OpenPositions /> : <TradeHistory />}
      </div>
    </div>
  );
}
