import DashboardLayout from "@/components/DashboardLayout";
import { Coins, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const transactions = [
  { id: 1, type: "credit", desc: "Purchased 500 credits", amount: 500, date: "2026-03-28" },
  { id: 2, type: "debit", desc: "Pulse Reel promotion", amount: -50, date: "2026-03-29" },
  { id: 3, type: "debit", desc: "Featured listing boost", amount: -100, date: "2026-03-30" },
  { id: 4, type: "credit", desc: "Referral bonus", amount: 25, date: "2026-04-01" },
];

const PulseCredits = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Pulse Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your credits for promotions and boosts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Balance</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins size={18} className="text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">375</p>
          <p className="text-xs text-muted-foreground mt-1">Pulse Credits available</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Spent This Month</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownRight size={18} className="text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">150</p>
          <p className="text-xs text-muted-foreground mt-1">Credits used</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:flex md:items-center md:justify-center bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <button className="btn-gold flex items-center gap-2 px-6 py-3 text-sm w-full justify-center">
            <CreditCard size={16} /> Recharge Credits
          </button>
        </motion.div>
      </div>

      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-display font-bold text-foreground">Transaction History</h2>
        </div>
        <div className="divide-y divide-border/30">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                  {tx.type === "credit" ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.desc}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default PulseCredits;
