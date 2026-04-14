import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Package, Truck, CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OrderRadarMap from "@/components/OrderRadarMap";
import { toast } from "sonner";

const statusSteps = ["pending", "processing", "in_transit", "out_for_delivery", "delivered"];
const stepLabels = ["Order Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const TrackOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchActiveOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("id, total_price, status, created_at, runner_id, otp_code, hive_catalogue!orders_item_id_fkey(product_name)")
        .eq("buyer_id", user.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false })
        .limit(20);

      setOrders(data || []);
      setLoading(false);
    };
    fetchActiveOrders();
  }, [user]);

  const getStepIndex = (status: string | null) => {
    const idx = statusSteps.indexOf(status || "pending");
    return idx >= 0 ? idx : 0;
  };

  const handleInspectItem = (orderId: number) => {
    const confirmed = window.confirm(
      "🔍 Inspect Item\n\nBy confirming, you accept that you have inspected and received the item in satisfactory condition. Your delivery code will be revealed."
    );
    if (confirmed) {
      setRevealedCodes((prev) => new Set(prev).add(orderId));
      toast.success("Item accepted! Your delivery code is now visible.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <MapPin size={24} className="text-primary" /> Track My Orders
        </h2>
        <p className="text-muted-foreground mt-1">Real-time tracking for your active orders</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No active orders to track</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, i) => {
            const currentStep = getStepIndex(order.status);
            const itemName = order.hive_catalogue?.product_name || `Order #${order.id}`;
            const isInTransit = order.status === "in_transit" || order.status === "out_for_delivery";
            const codeRevealed = revealedCodes.has(order.id);
            const otpCode = (order as any).otp_code;

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold text-foreground">{itemName}</p>
                    <p className="text-xs text-muted-foreground">HV-{String(order.id).padStart(6, "0")}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">ZMW {order.total_price || 0}</span>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold ml-2">
                      <Truck size={12} /> {order.status || "pending"}
                    </div>
                  </div>
                </div>

                {/* Live map when in transit */}
                {isInTransit && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Tracking
                    </p>
                    <OrderRadarMap
                      orderId={order.id}
                      runnerId={order.runner_id}
                      customerLat={customerCoords?.lat}
                      customerLng={customerCoords?.lng}
                    />
                  </div>
                )}

                {/* OTP Inspect & Reveal Section */}
                {isInTransit && (
                  <div className="mb-5 p-4 rounded-xl border" style={{ background: "hsl(38,73%,40%,0.05)", borderColor: "hsl(38,73%,40%,0.2)" }}>
                    {!codeRevealed ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">Delivery Code</p>
                          <p className="text-xs text-muted-foreground">Inspect your item first to reveal</p>
                        </div>
                        <button
                          onClick={() => handleInspectItem(order.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                          style={{ background: "hsl(38,73%,40%)", color: "hsl(39,100%,97%)" }}
                        >
                          <Eye size={14} /> 🔍 Inspect Item
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Your Delivery Code</p>
                          <p className="text-3xl font-bold tracking-[0.3em] font-mono" style={{ color: "hsl(38,73%,40%)" }}>
                            {otpCode || "----"}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <EyeOff size={12} /> Share with rider only
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-0">
                  {stepLabels.map((label, si) => (
                    <div key={si} className="flex-1 flex flex-col items-center relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                        si <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary border-2 border-border text-muted-foreground"
                      }`}>
                        {si <= currentStep ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                      </div>
                      <p className={`text-[9px] mt-1.5 text-center font-medium ${si <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
                        {label}
                      </p>
                      {si < stepLabels.length - 1 && (
                        <div className={`absolute top-3.5 left-[calc(50%+14px)] w-[calc(100%-28px)] h-0.5 ${
                          si < currentStep ? "bg-primary" : si === currentStep ? "bg-primary/40" : "bg-border"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackOrders;
