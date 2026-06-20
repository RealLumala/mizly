"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/program";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { toRawAmount } from "@/lib/utils";
import { TxStatus } from "@/types";
import BN from "bn.js";

export function useAuthority() {
  const wallet = useAnchorWallet();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePrice = async ({
    poolPda,
    newPrice,
    priceDecimals = 9,
  }: {
    poolPda: string;
    newPrice: string;
    priceDecimals?: number;
  }) => {
    if (!wallet) throw new Error("Wallet not connected");
    setStatus("pending");
    setError(null);
    setTxSig(null);

    try {
      const program = getProgram(wallet);
      const rawPrice = toRawAmount(newPrice, priceDecimals);

      const sig = await program.methods
        .updatePrice(rawPrice)
        .accounts({
          pool: new PublicKey(poolPda),
          authority: wallet.publicKey,
        })
        .rpc();

      setTxSig(sig);
      setStatus("success");
      return sig;
    } catch (err: any) {
      setError(err.message || "Price update failed");
      setStatus("error");
      throw err;
    }
  };

  const withdrawFees = async ({
    poolPda,
    vaultA,
    vaultB,
    destinationA,
    destinationB,
  }: {
    poolPda: string;
    vaultA: string;
    vaultB: string;
    destinationA: string;
    destinationB: string;
  }) => {
    if (!wallet) throw new Error("Wallet not connected");
    setStatus("pending");
    setError(null);
    setTxSig(null);

    try {
      const program = getProgram(wallet);

      const sig = await program.methods
        .withdrawFees()
        .accounts({
          pool: new PublicKey(poolPda),
          authority: wallet.publicKey,
          vaultA: new PublicKey(vaultA),
          vaultB: new PublicKey(vaultB),
          destinationA: new PublicKey(destinationA),
          destinationB: new PublicKey(destinationB),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);
      setStatus("success");
      return sig;
    } catch (err: any) {
      setError(err.message || "Withdraw fees failed");
      setStatus("error");
      throw err;
    }
  };

  const initializePool = async ({
    feeBps,
    initialPrice,
    priceDecimals,
    tokenAMint,
    tokenBMint,
    vaultA,
    vaultB,
    poolPda,
  }: {
    feeBps: number;
    initialPrice: string;
    priceDecimals: number;
    tokenAMint: string;
    tokenBMint: string;
    vaultA: string;
    vaultB: string;
    poolPda: string;
  }) => {
    if (!wallet) throw new Error("Wallet not connected");
    setStatus("pending");
    setError(null);
    setTxSig(null);

    try {
      const program = getProgram(wallet);
      const rawPrice = toRawAmount(initialPrice, priceDecimals);

      const sig = await program.methods
        .initialize(feeBps, rawPrice, priceDecimals)
        .accounts({
          authority: wallet.publicKey,
          pool: new PublicKey(poolPda),
          tokenAMint: new PublicKey(tokenAMint),
          tokenBMint: new PublicKey(tokenBMint),
          vaultA: new PublicKey(vaultA),
          vaultB: new PublicKey(vaultB),
          systemProgram: PublicKey.default,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);
      setStatus("success");
      return sig;
    } catch (err: any) {
      setError(err.message || "Initialize failed");
      setStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setStatus("idle");
    setTxSig(null);
    setError(null);
  };

  return { updatePrice, withdrawFees, initializePool, status, txSig, error, reset };
}