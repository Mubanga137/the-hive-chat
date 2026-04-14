import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Package, Bike, Zap, CheckCircle, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BountyMap, { type BountyOrder } from "@/components/BountyMap";
import GigSidenav from "@/components/gig/GigSidenav";
import OtpVerifyDrawer from "@/components/gig/OtpVerifyDrawer";

interface OrderItem {
  id: number;
  status: string | null;
  total_price: number | null;
  created_at: string;
  buyer_id: string | null;
  runner_id: number | null;
  item_id: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
}

const GigRadar = () => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<OrderItem[]>([]);
  const [myActiveOrders, setMyActiveOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [workerPosition, setWorkerPosition] = useState<[number, number] | null>(null);
  const [otpDrawerOrder, setOtpDrawerOrder] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<"idle" | "on_delivery" | "navigating">("idle");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);

  // ── GPS Tracking: push lat/lng every 15s when ONLINE ──
  useEffect(() => {
    if (!user || !isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    let latestCoords: { lat: number; lng: number } | null = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        latestCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setWorkerPosition([position.coords.latitude, position.coords.longitude]);
      },
      (err) => console.error("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    intervalRef.current = setInterval(async () => {
      if (!latestCoords || !user) return;
      await supabase
        .from("runners" as any)
        .update({ latitude: latestCoords.lat, longitude: latestCoords.lng } as any)
        .eq("user_id", user.id);
    }, 15000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, isOnline]);

  // Get initial position even when offline
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setWorkerPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [user]);

  // Derive live status
  useEffect(() => {
    if (myActiveOrders.length > 0) setLiveStatus("on_delivery");
    else setLiveStatus("idle");
  }, [myActiveOrders]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: available } = await supabase
      .from("orders")
      .select("*")
      .is("runner_id", null)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(20);

    setAvailableOrders((available as OrderItem[]) || []);

    if (user) {
      const { data: mine } = await supabase
        .from("orders")
        .select("*")
        .eq("runner_id", parseInt(user.id.slice(0, 8), 16) % 100000)
        .in("status", ["in_transit", "out_for_delivery"])
        .order("created_at", { ascending: false })
        .limit(10);
      setMyActiveOrders((mine as OrderItem[]) || []);
    }
    setLoading(false);
  };

  const handleAcceptOrder = async (orderId: number) => {
    if (!user) { toast.error("Please log in first."); return; }
    const { error } = await supabase
      .from("orders")
      .update({ status: "in_transit", runner_id: parseInt(user.id.slice(0, 8), 16) % 100000 } as any)
      .eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success("Order accepted! You're on it 🚴");
    fetchOrders();
  };

  const handleToggleOnline = (val: boolean) => {
    setIsOnline(val);
    toast.success(val ? "🟢 You are now ONLINE — GPS tracking active." : "⚫ You are now OFFLINE.");
  };

  const openNavigation = (order: OrderItem) => {
    if (!workerPosition) {
      toast.error("Waiting for your GPS location...");
      return;
    }
    const destLat = order.dropoff_lat || -15.4167 + (Math.sin(order.id * 1.7) * 0.01);
    const destLng = order.dropoff_lng || 28.2833 + (Math.cos(order.id * 2.1) * 0.01);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${workerPosition[0]},${workerPosition[1]}&destination=${destLat},${destLng}`;
    window.open(url, "_blank");
    setLiveStatus("navigating");
  };

  // Scroll to selected card
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedOrderId]);

  const bounties: BountyOrder[] = availableOrders.map((o) => ({
    id: o.id,
    lat: -15.4167 + (Math.sin(o.id * 3.7) * 0.02),
    lng: 28.2833 + (Math.cos(o.id * 2.3) * 0.02),
    total_price: o.total_price,
    status: o.status,
  }));

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(39,100%,97%)" }}>
      <GigSidenav
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        activeOrderCount={myActiveOrders.length}
        liveStatus={liveStatus}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Map — top half */}
        <div className="p-3 md:p-4 pt-14 lg:pt-4">
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "hsl(38,73%,40%,0.2)" }}>
            <div className="h-[40vh] md:h-[45vh] relative">
              <BountyMap
                workerPosition={workerPosition}
                bounties={bounties}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
              />
            </div>
          </div>
        </div>

        {/* Active orders — my deliveries */}
        {myActiveOrders.length > 0 && (
          <div className="px-3 md:px-4 mb-3">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "hsl(220,55%,13%)" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> My Active Deliveries
            </h3>
            <div className="space-y-2">
              {myActiveOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: "white", borderColor: "hsl(38,40%,85%)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(38,73%,40%,0.1)" }}>
                      <Package size={16} style={{ color: "hsl(38,73%,40%)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(220,55%,13%)" }}>Order #{order.id}</p>
                      <p className="text-xs" style={{ color: "hsl(220,20%,46%)" }}>ZMW {order.total_price || 0} • {order.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNavigation(order)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "hsl(38,73%,40%)", color: "hsl(39,100%,97%)" }}
                    >
                      <Navigation size={12} /> 🗺️ Navigate
                    </button>
                    <button
                      onClick={() => setOtpDrawerOrder(order.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all"
                      style={{ borderColor: "hsl(38,73%,40%,0.3)", color: "hsl(38,73%,40%)" }}
                    >
                      🔒 Verify Handoff
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom half — available gigs list */}
        <div className="flex-1 px-3 md:px-4 pb-4 overflow-y-auto">
          <div className="rounded-xl border p-4" style={{ background: "white", borderColor: "hsl(38,40%,85%)" }}>
            <h3 className="text-base font-bold mb-1" style={{ color: "hsl(220,55%,13%)" }}>Available Gigs</h3>
            <p className="text-xs mb-4" style={{ color: "hsl(220,20%,46%)" }}>Tap a marker above or claim below</p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent mx-auto" style={{ borderColor: "hsl(38,73%,40%)", borderTopColor: "transparent" }} />
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Bike size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm" style={{ color: "hsl(220,20%,46%)" }}>No active gigs right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    ref={selectedOrderId === order.id ? selectedRef : undefined}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer"
                    style={{
                      borderColor: selectedOrderId === order.id ? "hsl(38,73%,40%)" : "hsl(38,40%,85%)",
                      background: selectedOrderId === order.id ? "hsl(38,73%,40%,0.06)" : "transparent",
                      boxShadow: selectedOrderId === order.id ? "0 0 0 2px hsl(38,73%,40%,0.15)" : "none",
                    }}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(38,73%,40%,0.1)" }}>
                        <Package size={16} style={{ color: "hsl(38,73%,40%)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "hsl(220,55%,13%)" }}>Order #{order.id}</p>
                        <p className="text-xs" style={{ color: "hsl(220,20%,46%)" }}>ZMW {order.total_price || 0} • {order.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: "hsl(38,73%,40%)", color: "hsl(39,100%,97%)" }}
                      >
                        <Zap size={12} /> ⚡ Claim
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* OTP Verification Drawer */}
      <OtpVerifyDrawer
        open={otpDrawerOrder !== null}
        onClose={() => setOtpDrawerOrder(null)}
        orderId={otpDrawerOrder || 0}
        onVerified={fetchOrders}
      />
    </div>
  );
};

export default GigRadar;
