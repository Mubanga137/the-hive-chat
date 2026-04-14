import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LedgerEntry {
  id: number;
  amount: number | null;
  transaction_type: string | null;
  created_at: string;
}

const CustomerWallet = () => {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch balance from profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("zmw_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    setBalance(prof?.zmw_balance ?? 0);

    // Fetch transaction history from ledger
    const { data: ledger } = await supabase
      .from("hive_ledger")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    setTransactions((ledger as LedgerEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchWalletData(); }, [user]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }
    setSubmitting(true);

    // Update balance
    const newBalance = balance + amount;
    const { error: balErr } = await supabase
      .from("profiles")
      .update({ zmw_balance: newBalance } as any)
      .eq("user_id", user.id);

    if (balErr) { toast.error(balErr.message); setSubmitting(false); return; }

    // Insert ledger entry
    await supabase.from("hive_ledger").insert({
      user_id: user.id,
      amount: amount,
      transaction_type: "top_up",
    });

    toast.success(`ZMW ${amount.toFixed(2)} added to your wallet!`);
    setTopUpAmount("");
    setTopUpOpen(false);
    setSubmitting(false);
    fetchWalletData();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <Wallet size={24} className="text-primary" /> My Wallet
        </h2>
        <p className="text-muted-foreground mt-1">Manage your Hive wallet balance</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
        <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
        <p className="text-4xl font-display font-bold text-foreground">
          ZMW <span className="text-primary">{loading ? "..." : balance.toLocaleString()}</span>
        </p>
        <div className="flex gap-3 mt-5">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTopUpOpen(true)}
            className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> Top Up
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-2 border-border rounded-xl text-foreground hover:bg-secondary transition-colors">
            <CreditCard size={16} /> Link Card
          </motion.button>
        </div>
      </motion.div>

      {/* Top-Up Modal */}
      <AnimatePresence>
        {topUpOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTopUpOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] bg-card border border-border rounded-2xl shadow-2xl z-[90]">
              <form onSubmit={handleTopUp} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-foreground">Top Up Wallet</h3>
                  <button type="button" onClick={() => setTopUpOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                </div>
                <p className="text-sm text-muted-foreground">Enter the amount to add to your wallet.</p>
                <input value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="Amount (ZMW)" type="number" step="0.01" min="1"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" required />
                <div className="flex gap-2">
                  {[50, 100, 500, 1000].map(amt => (
                    <button key={amt} type="button" onClick={() => setTopUpAmount(String(amt))}
                      className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                      ZMW {amt}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : "Add Funds"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-lg font-display font-bold text-foreground">Recent Transactions</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Wallet size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => {
            const isCredit = tx.transaction_type === "top_up" || tx.transaction_type === "credit" || tx.transaction_type === "earning";
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCredit ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                  {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate capitalize">{tx.transaction_type?.replace("_", " ") || "Transaction"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <p className={`text-sm font-bold ${isCredit ? "text-emerald-500" : "text-destructive"}`}>
                  {isCredit ? "+" : "-"} ZMW {Math.abs(tx.amount || 0)}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerWallet;
