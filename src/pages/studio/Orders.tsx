import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Package } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  in_transit: "bg-purple-100 text-purple-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

interface OrderRow {
  id: number;
  buyer_id: string | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
  hive_catalogue: { product_name: string | null } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);

      // Get vendor's store
      const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
      if (!store) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("orders")
        .select("id, buyer_id, total_price, status, created_at, hive_catalogue!orders_item_id_fkey(product_name)")
        .eq("sme_id", store.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) toast.error(error.message);
      setOrders((data as OrderRow[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus } as any).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order updated to ${newStatus}`);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = orders.filter(o =>
    !search || String(o.id).includes(search) || (o.hive_catalogue?.product_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
                className="pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-48" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                      <td className="px-5 py-4 text-sm font-mono font-semibold text-primary">HV-{String(order.id).padStart(6, "0")}</td>
                      <td className="px-5 py-4 text-sm text-foreground truncate max-w-[200px]">{order.hive_catalogue?.product_name || "—"}</td>
                      <td className="px-5 py-4 text-sm text-right font-semibold text-foreground">ZMW {(order.total_price || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status || "pending"] || statusColors.pending}`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-right text-muted-foreground hidden md:table-cell">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {order.status === "processing" && (
                          <button onClick={() => handleStatusUpdate(order.id, "in_transit")}
                            className="text-xs font-semibold text-primary hover:underline">Ship</button>
                        )}
                        {order.status === "in_transit" && (
                          <button onClick={() => handleStatusUpdate(order.id, "delivered")}
                            className="text-xs font-semibold text-emerald-600 hover:underline">Mark Delivered</button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
