import { Lock, ExternalLink } from "lucide-react";
import { useTradingStore, selectOpenPositions } from "@/store/tradingStore";
import { formatUSDC, formatDuration, formatPnl } from "@/lib/formatters";

export function OpenPositions() {
  const positions = useTradingStore(selectOpenPositions);

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Lock size={16} className="text-dim" />
        </div>
        <p className="text-sm text-dim font-display">No open positions</p>
        <p className="text-xs text-subtle font-mono mt-1">
          Your positions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {positions.map((pos) => (
        <div
          key={pos.id}
          className="px-4 py-3 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-600 text-ivory text-sm">
                {pos.marketSymbol}/USD
              </span>

              {/* Side is private — shown only if trader has local data */}
              {pos.privateData ? (
                <span
                  className={
                    pos.privateData.side === "LONG" ? "tag-long" : "tag-short"
                  }
                >
                  {pos.privateData.side} {pos.privateData.leverage}×
                </span>
              ) : (
                <span className="arcium-badge flex items-center gap-1">
                  <Lock size={9} />
                  Private
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pos.revealedPnl !== null ? (
                <span
                  className={`text-sm font-mono font-600 ${pos.revealedPnl >= 0n ? "text-positive" : "text-negative"}`}
                >
                  {formatPnl(pos.revealedPnl)}
                </span>
              ) : (
                <span className="text-sm font-mono text-dim flex items-center gap-1">
                  <Lock size={10} className="text-arcium-400" />
                  Encrypted
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-dim">
            <span>
              Collateral:{" "}
              <span className="text-ghost">${formatUSDC(pos.collateral)}</span>
            </span>
            {pos.privateData && (
              <span>
                Size:{" "}
                <span className="text-ghost">
                  ${formatUSDC(pos.privateData.size)}
                </span>
              </span>
            )}
            <span>
              Opened:{" "}
              <span className="text-ghost">
                {formatDuration(pos.openedAt)} ago
              </span>
            </span>
            <a
              href={`https://sepolia.basescan.org/`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hover:text-ghost flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={10} />
              Chain
            </a>
          </div>

          {/* Commitment hash — proof of position without revealing details */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <Lock size={9} className="text-arcium-400/60" />
            <span className="text-[10px] font-mono text-subtle truncate">
              commitment: {pos.commitmentHash.slice(0, 18)}...
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
