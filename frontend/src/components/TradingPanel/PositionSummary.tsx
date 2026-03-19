import { Lock } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { formatUSDC, formatPrice } from "@/lib/formatters";

export function PositionSummary() {
  const { leverage, collateralInput, selectedMarket, side } = useTradingStore(
    (s) => ({
      leverage: s.leverage,
      collateralInput: s.collateralInput,
      selectedMarket: s.selectedMarket,
      side: s.side,
    }),
  );

  const collateral = parseFloat(collateralInput || "0");
  const notional = collateral * leverage;
  const entryPrice = selectedMarket?.price ?? 0;
  const liquidationDistance = 1 / leverage;
  const liquidationPrice =
    entryPrice > 0
      ? side === "LONG"
        ? entryPrice * (1 - liquidationDistance * 0.9)
        : entryPrice * (1 + liquidationDistance * 0.9)
      : 0;

  const rows = [
    {
      label: "Entry Price",
      value: entryPrice > 0 ? `$${formatPrice(entryPrice)}` : "—",
      private: false,
    },
    {
      label: "Position Size",
      value: notional > 0 ? `$${formatUSDC(notional * 1e6, 6)}` : "—",
      private: true,
    },
    {
      label: "Leverage",
      value: `${leverage}×`,
      private: true,
    },
    {
      label: "Liq. Price (est.)",
      value: liquidationPrice > 0 ? `$${formatPrice(liquidationPrice)}` : "—",
      private: true,
    },
    {
      label: "Collateral",
      value: collateral > 0 ? `$${collateral.toFixed(2)}` : "—",
      private: false,
    },
    {
      label: "Protocol Fee (0.1%)",
      value: collateral > 0 ? `$${(collateral * 0.001).toFixed(4)}` : "—",
      private: false,
    },
  ];

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between text-xs"
        >
          <span className="text-dim font-mono flex items-center gap-1">
            {row.private && <Lock size={9} className="text-arcium-400/60" />}
            {row.label}
          </span>
          <span
            className={`font-mono ${row.private ? "text-ghost" : "text-ivory"}`}
          >
            {row.value}
          </span>
        </div>
      ))}

      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Lock size={10} className="text-arcium-400" />
          <span className="text-[10px] text-dim font-mono">
            Locked fields encrypted — only you and Arcium MXE can see them
          </span>
        </div>
      </div>
    </div>
  );
}
