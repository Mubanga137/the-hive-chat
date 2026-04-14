import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Package, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderRow {
  id: number;
  total_price: number | null;
  status: string | null;
  created_at: string;
  hive_catalogue: { product_name: string | null } | null;
  sme_stores_via_catalogue: { brand_name: string | null } | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
  in_transit: { label: "In Transit", icon: Truck, color: "text-blue-500 bg-blue-500/10" },
  processing: { label: "Processing", icon: Clock, color: "text-primary bg-primary/10" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-destructive bg-destructive/10" },
};

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("id, total_price, status, created_at, item_id, hive_catalogue!orders_item_id_fkey(product_name)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const delivered = orders.filter(o => o.status === "delivered").length;
  const totalSpent = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_price || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <FileText size={24} className="text-primary" /> Order History
        </h2>
        <p className="text-muted-foreground mt-1">View all your past purchases and transactions</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-4">
          <Package size={20} className="text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-xl font-bold text-foreground">{loading ? "..." : orders.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-4">
          <CheckCircle2 size={20} className="text-emerald-500 mb-2" />
          <p className="text-xs text-muted-foreground">Delivered</p>
          <p className="text-xl font-bold text-foreground">{loading ? "..." : delivered}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-4">
          <FileText size={20} className="text-blue-500 mb-2" />
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-xl font-bold text-foreground">{loading ? "..." : `ZMW ${totalSpent.toLocaleString()}`}</p>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders yet. Start shopping in the Marketplace!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const st = statusConfig[order.status || "pending"] || statusConfig.pending;
            const StatusIcon = st.icon;
            const itemName = order.hive_catalogue?.product_name || `Order #${order.id}`;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${st.color}`}>
                  <StatusIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{itemName}</p>
                  <p className="text-xs text-muted-foreground">HV-{String(order.id).padStart(6, "0")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">ZMW {order.total_price || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
