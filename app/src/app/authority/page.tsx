"use client";

import { useState } from "react";
import { AuthorityPanel } from "@/components/authority/AuthorityPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";

export default function AuthorityPage() {
  const [poolPda, setPoolPda] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const confirm = () => {
    try {
      new PublicKey(poolPda);
      setConfirmed(true);
    } catch {
      toast.error("Invalid pool address");
    }
  };

  if (!confirmed) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <h1 className="font-mono font-bold text-xl text-text-primary mb-1">Authority</h1>
        <p className="font-mono text-xs text-muted mb-6">
          Manage your pool — update price, withdraw fees, initialize
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Pool PDA address..."
            value={poolPda}
            onChange={(e) => setPoolPda(e.target.value)}
            className="flex-1"
          />
          <Button onClick={confirm} disabled={!poolPda}>Load</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono font-bold text-xl text-text-primary">Authority</h1>
          <p className="font-mono text-xs text-muted mt-0.5">{poolPda.slice(0, 16)}...</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmed(false)}>
          Change pool
        </Button>
      </div>
      <AuthorityPanel poolPda={poolPda} />
    </div>
  );
}