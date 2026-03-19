import { Lock, Zap } from "lucide-react";
import { useTradingStore, selectClosedPositions } from "@/store/tradingStore";
import { formatUSDC, formatPnl, formatTime } from "@/lib/formatters";

export function TradeHistory() {
  const positions = useTradingStore(selectClosedPositions);

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-dim font-display">No trade history</p>
        <p className="text-xs text-subtle font-mono mt-1">
          Closed positions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2 text-dim font-display font-500">
              Market
            </th>
            <th className="text-left px-4 py-2 text-dim font-display font-500">
              <span className="flex items-center gap-1">
                <Lock size={9} className="text-arcium-400" />
                Side
              </span>
            </th>
            <th className="text-right px-4 py-2 text-dim font-display font-500">
              Collateral
            </th>
            <th className="text-right px-4 py-2 text-dim font-display font-500">
              PnL
            </th>
            <th className="text-right px-4 py-2 text-dim font-display font-500">
              Status
            </th>
            <th className="text-right px-4 py-2 text-dim font-display font-500">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {positions.map((pos) => (
            <tr key={pos.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-ivory font-display font-600">
                {pos.marketSymbol}/USD
              </td>
              <td className="px-4 py-3">
                {pos.privateData ? (
                  <span
                    className={
                      pos.privateData.side === "LONG" ? "tag-long" : "tag-short"
                    }
                  >
                    {pos.privateData.side}
                  </span>
                ) : (
                  <span className="arcium-badge flex items-center gap-1 w-fit">
                    <Lock size={8} />
                    Private
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-ghost">
                ${formatUSDC(pos.collateral)}
              </td>
              <td className="px-4 py-3 text-right">
                {pos.revealedPnl !== null ? (
                  <span
                    className={
                      pos.revealedPnl >= 0n ? "text-positive" : "text-negative"
                    }
                  >
                    {formatPnl(pos.revealedPnl)}
                  </span>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {pos.status === "LIQUIDATED" ? (
                  <span className="flex items-center justify-end gap-1 text-crimson-400">
                    <Zap size={10} />
                    Liquidated
                  </span>
                ) : (
                  <span className="text-ghost">Closed</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-dim">
                {formatTime(pos.openedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
