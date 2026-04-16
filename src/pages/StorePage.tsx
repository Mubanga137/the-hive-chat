import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Package, Briefcase, Store, MessageCircle, Tag, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HoneycombBackground from "@/components/HoneycombBackground";
import Header from "@/components/Header";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import { useAuth } from "@/hooks/useAuth";
import { loadCampaigns } from "@/lib/promoEngine";
import { toast } from "sonner";

interface StoreInfo {
  id: number;
  brand_name: string | null;
  business_type: string | null;
  description: string | null;
  banner_url: string | null;
  logo_url?: string | null;
  whatsapp_number: string | null;
  store_slug?: string | null;
  prepaid_units?: number | null;
  owner_user_id?: string | null;
}

interface OfferItem {
  id: number;
  product_name: string | null;
  price: number | null;
  old_price: number | null;
  image_url: string | null;
  category: string | null;
  stock_count: number | null;
  item_type: string | null;
  description: string | null;
  duration: string | null;
  location_type: string | null;
}

const locLabel = (l?: string | null) =>
  l === "at_customer" ? "At you" : l === "at_sme" ? "At store" : l === "remote" ? "Remote" : null;

const StorePage = () => {
  const { storeKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "products" | "services">("all");
  const [activeCampaigns, setActiveCampaigns] = useState<{ code: string; discount_value: number; discount_type: string }[]>([]);

  useEffect(() => {
    if (!storeKey) return;
    (async () => {
      setLoading(true);
      const isNumeric = /^\d+$/.test(storeKey);
      const query = supabase.from("sme_stores").select("*");
      const { data: storeData } = isNumeric
        ? await query.eq("id", Number(storeKey)).maybeSingle()
        : await query.eq("store_slug" as any, storeKey).maybeSingle();

      if (storeData) {
        const s = storeData as any as StoreInfo;
        setStore(s);
        const { data: itemsData } = await supabase
          .from("hive_catalogue")
          .select("*")
          .eq("sme_id", s.id)
          .order("created_at", { ascending: false });
        setItems((itemsData as OfferItem[]) || []);

        // Active campaigns from local promo engine
        const camps = loadCampaigns(s.id).filter((c) => c.status === "active");
        setActiveCampaigns(camps.map((c) => ({ code: c.code, discount_value: c.discount_value, discount_type: c.discount_type })));
      }
      setLoading(false);
    })();
  }, [storeKey]);

  const sellerHasCredits = (store?.prepaid_units ?? 1) >= 0;

  const filtered = useMemo(() =>
    items.filter((i) =>
      filter === "all" ? true : filter === "services" ? i.item_type === "service" : i.item_type !== "service"
    ),
  [items, filter]);

  const handleBuyNow = (item: OfferItem) => {
    if (!sellerHasCredits) return;
    setSelectedItem({
      id: item.id,
      item_name: item.product_name || "Item",
      price: item.price || 0,
      old_price: item.old_price,
      image_url: item.image_url,
      store_name: store?.brand_name || "Store",
      sme_id: store?.id,
      item_type: item.item_type,
      duration: item.duration,
      location_type: item.location_type,
    });
    setDrawerOpen(true);
  };

  const handleMessageStore = async () => {
    if (!user) { toast.error("Sign in to message this store."); navigate("/login"); return; }
    if (!store?.owner_user_id) { toast.error("Store owner not available for messaging."); return; }
    if (store.owner_user_id === user.id) { toast.info("This is your own store."); return; }
    // Find or create a 1:1 conversation
    const a = user.id, b = store.owner_user_id;
    const { data: existing } = await supabase
      .from("conversations" as any)
      .select("id")
      .or(`and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`)
      .maybeSingle();
    let convId = (existing as any)?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations" as any)
        .insert({ participant_a: a, participant_b: b } as any)
        .select("id")
        .single();
      if (error) { toast.error(error.message); return; }
      convId = (created as any).id;
    }
    navigate(`/messages?c=${convId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen relative">
        <HoneycombBackground />
        <Header />
        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
          <Store size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Store Not Found</h2>
          <p className="text-muted-foreground text-sm mb-4">This store doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/")} className="btn-gold px-6 py-2.5 text-sm">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <HoneycombBackground />
      <Header />
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-4 border border-border">
          <div className={`h-40 md:h-56 ${store.banner_url ? '' : 'bg-gradient-to-br from-primary/20 via-secondary to-muted'} flex items-end relative`}>
            {store.banner_url && <img src={store.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="relative z-10 p-6 w-full bg-gradient-to-t from-foreground/60 to-transparent">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-2xl font-display font-bold text-primary shadow-lg overflow-hidden">
                  {store.logo_url
                    ? <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    : (store.brand_name?.[0] || "S")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-display font-bold text-white">{store.brand_name || "Store"}</h1>
                    <BadgeCheck size={20} className="text-blue-400" />
                  </div>
                  <p className="text-white/80 text-sm">{store.business_type || "Retail"}</p>
                </div>
                <button onClick={handleMessageStore}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-lg">
                  <MessageCircle size={14} /> Message Store
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {store.description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{store.description}</p>
        )}

        {/* Promo banner */}
        {activeCampaigns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center gap-2 flex-wrap">
            <Tag size={16} className="text-primary shrink-0" />
            <span className="text-sm text-foreground">
              {activeCampaigns.slice(0, 2).map((c, i) => (
                <span key={c.code}>
                  {i > 0 && " · "}
                  Use <span className="font-mono font-bold text-primary">{c.code}</span> for{" "}
                  {c.discount_type === "percentage" ? `${c.discount_value}% off` : `ZMW ${c.discount_value} off`}
                </span>
              ))}
            </span>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-primary" />
            <h2 className="text-lg font-display font-bold text-foreground">Offers ({filtered.length})</h2>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
            {(["all", "products", "services"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No offers in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => {
              const isService = item.item_type === "service";
              const savings = item.old_price && item.price ? Math.round(((item.old_price - item.price) / item.old_price) * 100) : 0;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                  className="bg-card rounded-xl border border-border hover:border-primary/40 transition-colors overflow-hidden flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      isService ? <Briefcase size={28} className="text-muted-foreground/40" /> : <Package size={28} className="text-muted-foreground/40" />
                    )}
                    {savings > 0 && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
                        -{savings}%
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-foreground/70 text-background backdrop-blur">
                      {isService ? "Service" : (item.item_type === "digital" ? "Digital" : "Product")}
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{item.product_name || "Item"}</p>
                    {isService ? (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                        {item.duration && <span className="flex items-center gap-0.5"><Clock size={10} />{item.duration}</span>}
                        {locLabel(item.location_type) && <span className="flex items-center gap-0.5"><MapPin size={10} />{locLabel(item.location_type)}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    )}
                    <div className="flex items-baseline gap-2 mt-2 mb-3">
                      <span className="text-primary font-bold">
                        {isService && "From "}ZMW {item.price || 0}
                      </span>
                      {item.old_price && <span className="text-xs text-muted-foreground line-through">ZMW {item.old_price}</span>}
                    </div>
                    <button onClick={() => handleBuyNow(item)}
                      className="mt-auto w-full text-xs py-2 rounded-lg flex items-center justify-center gap-1 btn-gold">
                      {isService ? "📅 Book Order" : "🛒 Buy Now"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <CheckoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
    </div>
  );
};

export default StorePage;
