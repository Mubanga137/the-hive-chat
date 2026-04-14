import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Wallet, ArrowDownRight, ArrowUpRight, Shield, Loader2, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LedgerEntry {
  id: number;
  amount: number | null;
  transaction_type: string | null;
  created_at: string;
}

const HiveEscrowWallet = () => {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [momoNumber, setMomoNumber] = useState("");

  // Tax rates: 2% for vendors/wholesalers, 10% for gig workers
  const role = profile?.role || "vendor";
  const taxRate = role === "gig_worker" ? 0.10 : 0.02;
  const taxLabel = role === "gig_worker" ? "10%" : "2%";

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      // Fetch wallet balance
      const { data: prof } = await supabase.from("profiles").select("zmw_balance").eq("user_id", user.id).single();
      setBalance(Number(prof?.zmw_balance) || 0);

      // Fetch ledger
      const { data } = await supabase
        .from("hive_ledger")
        .select("id, amount, transaction_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setLedger((data as LedgerEntry[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalEarned = ledger.filter(l => (l.amount || 0) > 0).reduce((s, l) => s + (l.amount || 0), 0);
  const totalTaxDeducted = totalEarned * taxRate;
  const netEscrow = balance;

  const handleWithdraw = async () => {
    if (!user) return;
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > balance) { toast.error("Enter a valid amount within your balance."); return; }
    if (!momoNumber.trim()) { toast.error("Enter your MoMo number."); return; }
    setWithdrawing(true);

    // Deduct from balance
    const { error: updateErr } = await supabase.from("profiles").update({ zmw_balance: balance - amt } as any).eq("user_id", user.id);
    if (updateErr) { toast.error(updateErr.message); setWithdrawing(false); return; }

    // Log withdrawal
    await supabase.from("hive_ledger").insert({
      user_id: user.id,
      amount: -amt,
      transaction_type: "momo_withdrawal",
    });

    setBalance(prev => prev - amt);
    toast.success(`ZMW ${amt.toLocaleString()} withdrawal to ${momoNumber} initiated!`);
    setWithdrawAmount("");
    setMomoNumber("");
    setWithdrawing(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Wallet size={22} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Hive Escrow Wallet</h2>
            <p className="text-sm text-muted-foreground">Your escrow balance, tax splits & MoMo withdrawals</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-50 to-card border border-emerald-200/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Escrow Balance</span>
                </div>
                <p className="text-3xl font-bold text-foreground">ZMW {netEscrow.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Total Earned</span>
                </div>
                <p className="text-2xl font-bold text-foreground">ZMW {totalEarned.toFixed(2)}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">K3 Tax ({taxLabel})</span>
                </div>
                <p className="text-2xl font-bold text-foreground">ZMW {totalTaxDeducted.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Auto-deducted from earnings</p>
              </motion.div>
            </div>

            {/* Withdraw to MoMo */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-primary" />
                <h3 className="font-display font-bold text-foreground">Withdraw to MoMo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount (ZMW)" type="number" className={inputClass} />
                <input value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="MoMo Number (+260...)" className={inputClass} />
              </div>
              <button onClick={handleWithdraw} disabled={withdrawing}
                className="btn-gold py-3 px-8 text-sm flex items-center gap-2">
                {withdrawing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Wallet size={16} /> Withdraw to MoMo</>}
              </button>
            </motion.div>

            {/* Ledger */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="font-display font-bold text-foreground">Transaction History</h3>
              </div>
              {ledger.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {ledger.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(entry.amount || 0) > 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                          {(entry.amount || 0) > 0 ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{(entry.transaction_type || "transaction").replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${(entry.amount || 0) > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {(entry.amount || 0) > 0 ? "+" : ""}ZMW {Math.abs(entry.amount || 0).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HiveEscrowWallet;
