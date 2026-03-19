import { TrendingUp, Lock } from "lucide-react";
import {
  useTradingStore,
  selectOpenPositions,
  selectClosedPositions,
} from "@/store/tradingStore";
import { formatPnl, formatUSDC } from "@/lib/formatters";

export function PnLDisplay() {
  const openPositions = useTradingStore(selectOpenPositions);
  const closedPositions = useTradingStore(selectClosedPositions);

  const realizedPnl = closedPositions.reduce(
    (acc, p) => acc + (p.revealedPnl ?? 0n),
    0n,
  );

  const totalCollateral = openPositions.reduce(
    (acc, p) => acc + p.collateral,
    0n,
  );

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider">
          Realized PnL
        </p>
        <p
          className={`text-lg font-mono font-600 ${realizedPnl >= 0n ? "text-positive" : "text-negative"}`}
        >
          {formatPnl(realizedPnl)}
        </p>
        <p className="text-[10px] text-subtle font-mono">All time</p>
      </div>

      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider flex items-center gap-1">
          <Lock size={9} className="text-arcium-400" />
          Unrealized PnL
        </p>
        <p className="text-lg font-mono font-600 text-arcium-400 flex items-center gap-1.5">
          <Lock size={12} />
          Encrypted
        </p>
        <p className="text-[10px] text-subtle font-mono">Via Arcium MXE</p>
      </div>

      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider">
          Open Collateral
        </p>
        <p className="text-lg font-mono font-600 text-ivory">
          ${formatUSDC(totalCollateral)}
        </p>
        <p className="text-[10px] text-subtle font-mono">
          {openPositions.length} position{openPositions.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
