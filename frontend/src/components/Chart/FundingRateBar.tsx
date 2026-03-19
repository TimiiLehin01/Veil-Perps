import { TrendingUp, TrendingDown } from "lucide-react";

interface FundingRateBarProps {
  rate: number; // e.g. 0.001 = 0.1%
  nextFunding?: number; // seconds until next funding
}

export function FundingRateBar({
  rate,
  nextFunding = 28800,
}: FundingRateBarProps) {
  const isPositive = rate >= 0;
  const ratePercent = (rate * 100).toFixed(4);

  const hours = Math.floor(nextFunding / 3600);
  const minutes = Math.floor((nextFunding % 3600) / 60);

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-b border-border text-xs font-mono">
      <div className="flex items-center gap-1.5">
        <span className="text-dim">Funding Rate</span>
        <div
          className={`flex items-center gap-1 ${isPositive ? "text-positive" : "text-negative"}`}
        >
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>
            {isPositive ? "+" : ""}
            {ratePercent}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-dim">
        <span>Next in</span>
        <span className="text-ghost">
          {hours}h {minutes}m
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto text-dim">
        <span className="text-[10px]">
          Longs {isPositive ? "pay" : "receive"}
        </span>
        <span className="text-[10px] text-arcium-400">
          · Powered by Arcium MXE
        </span>
      </div>
    </div>
  );
}
