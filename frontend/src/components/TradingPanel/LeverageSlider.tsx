import { useTradingStore } from "@/store/tradingStore";

const PRESETS = [1, 2, 5, 10, 25, 50];

export function LeverageSlider() {
  const leverage = useTradingStore((s) => s.leverage);
  const setLeverage = useTradingStore((s) => s.setLeverage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-dim font-display">Leverage</label>
        <span className="text-sm font-mono font-600 text-ivory">
          {leverage}
          <span className="text-dim text-xs">×</span>
        </span>
      </div>

      {/* Slider */}
      <div className="relative py-1">
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full h-1 appearance-none bg-border rounded-full outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-arcium-400
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-void
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((leverage - 1) / 49) * 100}%, #1E2328 ${((leverage - 1) / 49) * 100}%, #1E2328 100%)`,
          }}
        />
      </div>

      {/* Presets */}
      <div className="flex gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setLeverage(preset)}
            className={`flex-1 py-1 rounded text-[11px] font-mono transition-all duration-100
              ${
                leverage === preset
                  ? "bg-arcium-500/20 text-arcium-400 border border-arcium-500/40"
                  : "bg-muted/40 text-dim hover:text-ghost border border-transparent hover:border-border"
              }`}
          >
            {preset}×
          </button>
        ))}
      </div>

      {/* Risk warning */}
      {leverage > 20 && (
        <p className="text-[10px] text-gold-400/80 font-mono">
          ⚠ High leverage. Liquidation risk increases significantly above 20×
        </p>
      )}
    </div>
  );
}
