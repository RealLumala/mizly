import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface PoolAccount {
  authority: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
  feeBps: number;
  currentPrice: BN;
  priceDecimals: number;
  accumulatedFeesA: BN;
  accumulatedFeesB: BN;
  bump: number;
}

export interface PoolStats {
  pool: PoolAccount;
  poolPda: PublicKey;
  vaultABalance: number;
  vaultBBalance: number;
}

export interface SwapParams {
  amountIn: string;
  isAtoB: boolean;
  poolPda: string;
  userTokenIn: string;
  userTokenOut: string;
}

export interface InitializeParams {
  feeBps: number;
  initialPrice: string;
  priceDecimals: number;
  tokenAMint: string;
  tokenBMint: string;
  vaultA: string;
  vaultB: string;
}

export type TxStatus = "idle" | "pending" | "success" | "error";