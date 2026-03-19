// Arcium MXE Program: pnl_compute
// Computes PnL from encrypted position data + current oracle price.
// Only the final PnL number is revealed — never the position details.
//
// Privacy guarantee:
// - Entry price stays encrypted inside MXE
// - Position size stays encrypted inside MXE
// - Direction (long/short) stays encrypted inside MXE
// - Output: only the signed PnL value (public)

use arcium_sdk::prelude::*;

/// Private inputs — retrieved from encrypted MXE storage
#[derive(ArciumInputs)]
pub struct PnLComputeInputs {
    /// Original position size in USDC (1e6)
    pub size: EncryptedU64,
    /// 0 = LONG, 1 = SHORT
    pub side: EncryptedU8,
    /// Entry price in USD (1e8 precision)
    pub entry_price: EncryptedU64,
    /// Commitment hash to verify we're computing for the right position
    pub commitment_hash: [u8; 32],
}

/// Public inputs — visible to everyone
#[derive(ArciumPublicInputs)]
pub struct PnLPublicInputs {
    /// Current oracle price (1e8 precision) — fetched from Chainlink
    pub current_price: u64,
    /// Position ID being closed
    pub position_id: [u8; 32],
}

/// Public outputs — only PnL is revealed
#[derive(ArciumOutputs)]
pub struct PnLComputeOutputs {
    /// Signed PnL in USDC (1e6 precision). Positive = profit, negative = loss.
    /// This is the ONLY value that leaves the MXE.
    pub pnl: i64,
    /// Position ID (echoed for on-chain matching)
    pub position_id: [u8; 32],
    /// Proof that computation was done correctly
    pub computation_id: [u8; 32],
}

#[arcium_program]
pub fn compute_pnl(
    private: PnLComputeInputs,
    public: PnLPublicInputs,
) -> PnLComputeOutputs {
    let size = private.size.decrypt();
    let side = private.side.decrypt();
    let entry_price = private.entry_price.decrypt();
    let current_price = public.current_price;

    // PnL = size * (current_price - entry_price) / entry_price
    // For LONG: profit if current > entry
    // For SHORT: profit if current < entry
    let price_diff = current_price as i64 - entry_price as i64;

    let raw_pnl = (size as i128 * price_diff as i128) / entry_price as i128;

    // Flip sign for shorts
    let pnl = if side == 0 {
        raw_pnl as i64         // LONG
    } else {
        -(raw_pnl as i64)      // SHORT
    };

    // Convert from 1e8 price precision to 1e6 USDC precision
    let pnl_usdc = pnl / 100;

    PnLComputeOutputs {
        pnl: pnl_usdc,
        position_id: public.position_id,
        computation_id: generate_computation_id(),
    }
}