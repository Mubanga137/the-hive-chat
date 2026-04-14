import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Plus, X, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CashSale {
  id: number;
  amount: number | null;
  transaction_type: string | null;
  created_at: string;
}

const KantembaLedger = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<CashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const fetchSales = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("hive_ledger")
      .select("id, amount, transaction_type, created_at")
      .eq("user_id", user.id)
      .eq("transaction_type", "cash_sale")
      .order("created_at", { ascending: false });
    setSales((data as CashSale[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [user]);

  const totalCash = sales.reduce((s, r) => s + (r.amount || 0), 0);
  const todayCash = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((s, r) => s + (r.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("hive_ledger").insert({
      user_id: user.id,
      amount: Number(amount),
      transaction_type: "cash_sale",
    });
    if (error) toast.error(error.message);
    else { toast.success("Cash sale logged!"); setAmount(""); setDescription(""); setFormOpen(false); fetchSales(); }
    setSubmitting(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BookOpen size={22} className="text-amber-700" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Business Ledger</h2>
              <p className="text-sm text-muted-foreground">Log walk-in cash sales — offline POS tracker</p>
            </div>
          </div>
          <button onClick={() => setFormOpen(true)} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> Log Sale
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Total Cash Sales</span>
            </div>
            <p className="text-2xl font-bold text-foreground">ZMW {totalCash.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">ZMW {todayCash.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] bg-card border border-border rounded-2xl shadow-2xl z-[90]">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-foreground">Log Cash Sale</h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (ZMW) *" type="number" className={inputClass} required />
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className={inputClass} />
                  <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Log Sale"}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Ledger table */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="font-display font-bold text-foreground">Transaction Log</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No cash sales logged yet.</div>
          ) : (
            <div className="divide-y divide-border/30">
              {sales.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Walk-in Cash Sale</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+ZMW {(s.amount || 0).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KantembaLedger;
