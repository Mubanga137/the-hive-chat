import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, Users, Coins, TrendingUp, Plus, ClipboardList, TriangleAlert as AlertTriangle, Package, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const salesData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 7100 },
  { month: "Apr", revenue: 6400 },
  { month: "May", revenue: 8900 },
  { month: "Jun", revenue: 11200 },
  { month: "Jul", revenue: 9800 },
];

const statusColors: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Shipped: "bg-purple-100 text-purple-700",
};

const RetailerStudioDashboard = () => {
  const { profile, user } = useAuth();
  const { totalRevenue, totalOrders, activeCustomers, recentOrders, inventoryAlerts, loading: dataLoading } = useDashboardData();
  const [walletData, setWalletData] = useState({ zmw_balance: 0, pulse_credits: 0 });
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoadingWallet(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("zmw_balance, pulse_credits")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setWalletData({
        zmw_balance: Number(data.zmw_balance) || 0,
        pulse_credits: Number(data.pulse_credits) || 0,
      });
    }
    setLoadingWallet(false);
  };

  const metrics = [
    { label: "Total Revenue", value: `ZMW ${totalRevenue.toLocaleString()}`, icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Total Orders", value: String(totalOrders), icon: ShoppingCart, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Active Customers", value: String(activeCustomers), icon: Users, bg: "bg-purple-50", iconColor: "text-purple-600" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Vendor"}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Here's your business overview for today.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon size={20} className={m.iconColor} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-0.5">{m.label}</p>
              <p className="text-xl font-bold text-foreground">{dataLoading ? "..." : m.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="bg-gradient-to-br from-primary/10 via-card to-card border-2 border-primary/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">Wallet & Credits</h3>
                <p className="text-xs text-muted-foreground">Your financial overview</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-muted-foreground">ZMW Balance</span>
                </div>
                <button className="text-[10px] font-bold text-emerald-600 hover:underline">Withdraw</button>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loadingWallet ? "..." : `ZMW ${walletData.zmw_balance.toFixed(2)}`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Available for payout</p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Pulse Credits</span>
                </div>
                <button className="text-[10px] font-bold text-primary hover:underline">Recharge</button>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loadingWallet ? "..." : walletData.pulse_credits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">For promotions & boosts</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-display font-bold text-foreground">Sales Overview</h3>
                <p className="text-xs text-muted-foreground">Monthly revenue (ZMW)</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <TrendingUp size={14} /> +18.2%
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    formatter={(value: number) => [`ZMW ${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-display font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus size={18} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Add Product</p>
                  <p className="text-[10px] text-muted-foreground">List a new item in your store</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <ClipboardList size={18} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Process Orders</p>
                  <p className="text-[10px] text-muted-foreground">Review pending orders</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-display font-bold text-foreground mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Order ID</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">{order.id}</td>
                      <td className="py-3 px-3 text-muted-foreground">{order.customer_name}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">ZMW {order.total}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!dataLoading && recentOrders.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-base font-display font-bold text-foreground">Inventory Alerts</h3>
            </div>
            <div className="space-y-3">
              {inventoryAlerts.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.product_type}</p>
                  </div>
                  <span className={`text-xs font-bold ${item.stock === 0 ? "text-destructive" : "text-amber-600"}`}>
                    {item.stock === 0 ? "Out" : `${item.stock} left`}
                  </span>
                </div>
              ))}
              {!dataLoading && inventoryAlerts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All stock levels healthy</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RetailerStudioDashboard;
