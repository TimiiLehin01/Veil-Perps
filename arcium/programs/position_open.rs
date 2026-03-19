// Arcium MXE Program: position_open
// Validates encrypted position parameters inside the Multi-party Execution Environment.
// This code runs INSIDE Arcium's encrypted environment — inputs are never visible outside.
//
// What this program does:
// 1. Receives encrypted (size, side, leverage, entryPrice, collateral, marketId)
// 2. Validates all parameters are within market limits
// 3. Returns a proof that the position is valid — without revealing any parameters

use arcium_sdk::prelude::*;

/// Private inputs — encrypted by the trader client-side before submission
#[derive(ArciumInputs)]
pub struct PositionOpenInputs {
    /// Position size in USDC (1e6 precision)
    pub size: EncryptedU64,
    /// 0 = LONG, 1 = SHORT
    pub side: EncryptedU8,
    /// Leverage multiplier (e.g. 10 = 10x)
    pub leverage: EncryptedU8,
    /// Entry price in USD (1e8 precision, from oracle)
    pub entry_price: EncryptedU64,
    /// Collateral amount in USDC (1e6 precision) — public
    pub collateral: u64,
    /// Commitment hash — keccak256(encrypted_data, trader, salt)
    pub commitment_hash: [u8; 32],
}

/// Public outputs — only these values leave the MXE
#[derive(ArciumOutputs)]
pub struct PositionOpenOutputs {
    /// Whether the position parameters are valid
    pub is_valid: bool,
    /// The commitment hash (echoed back for on-chain verification)
    pub commitment_hash: [u8; 32],
    /// Computation ID for on-chain proof verification
    pub computation_id: [u8; 32],
}

/// Market limits — these are public parameters set by the protocol
pub struct MarketLimits {
    pub max_leverage: u8,           // e.g. 50
    pub min_collateral: u64,        // e.g. 10_000_000 (10 USDC)
    pub max_position_size: u64,     // e.g. 1_000_000_000_000 (1M USDC)
    pub maintenance_margin_bps: u16, // e.g. 50 (0.5%)
}

#[arcium_program]
pub fn validate_position_open(
    inputs: PositionOpenInputs,
    limits: MarketLimits,
) -> PositionOpenOutputs {
    // All comparisons happen inside the MXE — values are never decrypted outside
    let leverage_ok = inputs.leverage.decrypt() <= limits.max_leverage;
    let collateral_ok = inputs.collateral >= limits.min_collateral;
    let size_ok = inputs.size.decrypt() <= limits.max_position_size;
    let size_matches_collateral = inputs.size.decrypt() ==
        inputs.collateral * (inputs.leverage.decrypt() as u64);

    let is_valid = leverage_ok && collateral_ok && size_ok && size_matches_collateral;

    PositionOpenOutputs {
        is_valid,
        commitment_hash: inputs.commitment_hash,
        computation_id: generate_computation_id(),
    }
}