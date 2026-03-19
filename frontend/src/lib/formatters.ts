export const formatUSDC = (amount: bigint | number, decimals = 6): string => {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return (n / 10 ** decimals).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPnl = (pnl: bigint | number, decimals = 6): string => {
  const n = typeof pnl === "bigint" ? Number(pnl) : pnl;
  const value = n / 10 ** decimals;
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
};

export const formatPnlPercent = (pnl: number, collateral: number): string => {
  if (collateral === 0) return "0.00%";
  const pct = (pnl / collateral) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
};

export const shortAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatLeverage = (leverage: number): string => {
  return `${leverage}×`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDuration = (openedAt: number): string => {
  const seconds = Math.floor(Date.now() / 1000) - openedAt;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

export const parseUSDC = (value: string): bigint => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0n;
  return BigInt(Math.floor(parsed * 1e6));
};
