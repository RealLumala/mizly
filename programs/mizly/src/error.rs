use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Zero amount")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
}