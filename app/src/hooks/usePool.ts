"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getConnection, getReadonlyProgram } from "@/lib/program";
import { PoolAccount, PoolStats } from "@/types";

export function usePool(poolPda: string | null) {
  const wallet = useAnchorWallet();
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    if (!poolPda) return;

    setLoading(true);
    setError(null);

    try {
      const connection = getConnection();
      const program = getReadonlyProgram();
      const pda = new PublicKey(poolPda);

      const pool = (await program.account["pool"].fetch(pda)) as PoolAccount;

      const [vaultAInfo, vaultBInfo] = await Promise.all([
        connection.getTokenAccountBalance(pool.vaultA),
        connection.getTokenAccountBalance(pool.vaultB),
      ]);

      setPoolStats({
        pool,
        poolPda: pda,
        vaultABalance: vaultAInfo.value.uiAmount ?? 0,
        vaultBBalance: vaultBInfo.value.uiAmount ?? 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch pool");
    } finally {
      setLoading(false);
    }
  }, [poolPda]);

  useEffect(() => {
    fetchPool();
    // Poll every 10s
    const interval = setInterval(fetchPool, 10_000);
    return () => clearInterval(interval);
  }, [fetchPool]);

  return { poolStats, loading, error, refetch: fetchPool };
}