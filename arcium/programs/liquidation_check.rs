// Arcium MXE Program: liquidation_check
// Privately checks if a position's health factor is below maintenance margin.
//
// This is the most privacy-critical program in VEIL Perps.
// A liquidator calls this asking "is position X liquidatable?"
// Arcium answers YES or NO + proof — without ever revealing:
//   - The position size
//   - The entry price
//   - The direction (long/short)
//   - The exact health factor
//
// This eliminates targeted liquidation attacks where bots push price
// toward a known liquidation level.

use arcium_sdk::prelude::*;

/// Private inputs — stored encrypted in MXE from when position was opened
#[derive(ArciumInputs)]
pub struct LiquidationCheckInputs {
    /// Position size in USDC (1e6)
    pub size: EncryptedU64,
    /// 0 = LONG, 1 = SHORT
    pub side: EncryptedU8,
    /// Entry price (1e8 precision)
    pub entry_price: EncryptedU64,
    /// Collateral deposited (1e6 precision) — used for health factor
    pub collateral: EncryptedU64,
}

/// Public inputs — visible to everyone
#[derive(ArciumPublicInputs)]
pub struct LiquidationPublicInputs {
    /// Current oracle price (1e8 precision)
    pub current_price: u64,
    /// Maintenance margin in basis points (e.g. 50 = 0.5%)
    pub maintenance_margin_bps: u16,
    /// Position ID being checked
    pub position_id: [u8; 32],
}

/// Public outputs — ONLY whether liquidatable, nothing else
#[derive(ArciumOutputs)]
pub struct LiquidationCheckOutputs {
    /// True if health factor < 1 (position should be liquidated)
    /// This is the ONLY information the liquidator receives.
    pub is_liquidatable: bool,
    /// Position ID (echoed for on-chain matching)
    pub position_id: [u8; 32],
    /// Proof of correct computation
    pub computation_id: [u8; 32],
}

#[arcium_program]
pub fn check_liquidation(
    private: LiquidationCheckInputs,
    public: LiquidationPublicInputs,
) -> LiquidationCheckOutputs {
    let size = private.size.decrypt();
    let side = private.side.decrypt();
    let entry_price = private.entry_price.decrypt();
    let collateral = private.collateral.decrypt();
    let current_price = public.current_price;

    // Compute unrealized PnL (same logic as pnl_compute)
    let price_diff = current_price as i64 - entry_price as i64;
    let raw_pnl = (size as i128 * price_diff as i128) / entry_price as i128;
    let unrealized_pnl = if side == 0 {
        raw_pnl as i64
    } else {
        -(raw_pnl as i64)
    };

    // Remaining margin = collateral + unrealized_pnl
    let remaining_margin = collateral as i64 + (unrealized_pnl / 100);

    // Maintenance margin threshold
    let maintenance_threshold =
        (collateral as i64 * public.maintenance_margin_bps as i64) / 10_000;

    // Liquidatable if remaining margin falls below maintenance threshold
    let is_liquidatable = remaining_margin <= maintenance_threshold;

    // NOTE: We return ONLY is_liquidatable — not the health factor, not the
    // remaining margin, not any position details. The liquidator learns
    // nothing about why the position is liquidatable.
    LiquidationCheckOutputs {
        is_liquidatable,
        position_id: public.position_id,
        computation_id: generate_computation_id(),
    }
}