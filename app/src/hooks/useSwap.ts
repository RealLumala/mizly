"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/program";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { toRawAmount } from "@/lib/utils";
import { TxStatus } from "@/types";
import BN from "bn.js";

export function useSwap() {
  const wallet = useAnchorWallet();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const swap = async ({
    poolPda,
    userTokenIn,
    userTokenOut,
    vaultA,
    vaultB,
    amountIn,
    isAtoB,
    tokenDecimals = 9,
  }: {
    poolPda: string;
    userTokenIn: string;
    userTokenOut: string;
    vaultA: string;
    vaultB: string;
    amountIn: string;
    isAtoB: boolean;
    tokenDecimals?: number;
  }) => {
    if (!wallet) throw new Error("Wallet not connected");

    setStatus("pending");
    setError(null);
    setTxSig(null);

    try {
      const program = getProgram(wallet);
      const rawAmount = toRawAmount(amountIn, tokenDecimals);

      const sig = await program.methods
        .swap(rawAmount, isAtoB)
        .accounts({
          pool: new PublicKey(poolPda),
          authority: wallet.publicKey,
          userTokenIn: new PublicKey(userTokenIn),
          userTokenOut: new PublicKey(userTokenOut),
          vaultA: new PublicKey(vaultA),
          vaultB: new PublicKey(vaultB),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);
      setStatus("success");
      return sig;
    } catch (err: any) {
      setError(err.message || "Swap failed");
      setStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setStatus("idle");
    setTxSig(null);
    setError(null);
  };

  return { swap, status, txSig, error, reset };
}