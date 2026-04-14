import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, Heart, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AnalyticsCustomers = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [repeatCustomers, setRepeatCustomers] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
      const sid = store?.id || null;
      setStoreId(sid);
      if (!sid) { setLoading(false); return; }

      // Fetch orders for this store
      const { data: orders } = await supabase.from("orders").select("id, total_price, buyer_id, status").eq("sme_id", sid);
      const orderList = orders || [];
      setTotalOrders(orderList.length);
      setTotalRevenue(orderList.reduce((s, o) => s + (o.total_price || 0), 0));

      // Unique & repeat customers
      const buyerMap = new Map<string, number>();
      orderList.forEach(o => {
        if (o.buyer_id) buyerMap.set(o.buyer_id, (buyerMap.get(o.buyer_id) || 0) + 1);
      });
      setUniqueCustomers(buyerMap.size);
      setRepeatCustomers([...buyerMap.values()].filter(c => c > 1).length);

      // Product count
      const { count } = await supabase.from("hive_catalogue").select("id", { count: "exact", head: true }).eq("sme_id", sid);
      setProductCount(count || 0);

      setLoading(false);
    };
    fetch();
  }, [user]);

  const kpis = [
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Total Revenue", value: `ZMW ${totalRevenue.toLocaleString()}`, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Unique Customers", value: uniqueCustomers, icon: Users, bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Repeat Customers", value: repeatCustomers, icon: RefreshCw, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Products Listed", value: productCount, icon: Heart, bg: "bg-pink-50", color: "text-pink-600" },
    { label: "Abandoned Cart Est.", value: Math.max(0, Math.round(uniqueCustomers * 0.3)), icon: ShoppingCart, bg: "bg-red-50", color: "text-red-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 size={22} className="text-blue-700" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Analytics & Customers</h2>
            <p className="text-sm text-muted-foreground">Advanced KPI view for strategic decisions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon size={18} className={kpi.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Insights */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-bold text-foreground mb-3">💡 Insights</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {repeatCustomers > 0 && <p>✅ You have <span className="text-foreground font-semibold">{repeatCustomers}</span> repeat customer{repeatCustomers > 1 ? "s" : ""} — your retention is working!</p>}
            {uniqueCustomers > 0 && <p>📊 Estimated abandoned cart rate: <span className="text-foreground font-semibold">{Math.round((Math.round(uniqueCustomers * 0.3) / Math.max(1, uniqueCustomers + Math.round(uniqueCustomers * 0.3))) * 100)}%</span></p>}
            {productCount < 5 && <p>⚡ List more products to improve discoverability — you currently have {productCount}.</p>}
            {totalOrders === 0 && <p>🚀 No orders yet — consider creating promo codes to drive first sales.</p>}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsCustomers;
