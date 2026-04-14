import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Star, MapPin, Package, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HoneycombBackground from "@/components/HoneycombBackground";
import Header from "@/components/Header";
import CheckoutDrawer from "@/components/CheckoutDrawer";

interface StoreInfo {
  id: number;
  brand_name: string | null;
  business_type: string | null;
  description: string | null;
  banner_url: string | null;
  whatsapp_number: string | null;
  prepaid_units?: number | null;
}

interface CatalogueItem {
  id: number;
  product_name: string | null;
  price: number | null;
  old_price: number | null;
  image_url: string | null;
  category: string | null;
  stock_count: number | null;
  item_type: string | null;
}

const StorePage = () => {
  const { smeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!smeId) return;
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("sme_stores")
        .select("*")
        .eq("id", Number(smeId))
        .single();

      if (storeData) setStore(storeData as StoreInfo);

      const { data: itemsData } = await supabase
        .from("hive_catalogue")
        .select("*")
        .eq("sme_id", Number(smeId))
        .order("created_at", { ascending: false });

      if (itemsData) setItems(itemsData as CatalogueItem[]);
      setLoading(false);
    };
    fetchStore();
  }, [smeId]);

  const sellerHasCredits = (store?.prepaid_units ?? 0) >= 0.20;

  const handleBuyNow = (item: CatalogueItem) => {
    if (!sellerHasCredits) return;
    setSelectedItem({
      id: item.id,
      item_name: item.product_name || "Item",
      price: item.price || 0,
      old_price: item.old_price,
      image_url: item.image_url,
      store_name: store?.brand_name || "Store",
      sme_id: store?.id,
    });
    setDrawerOpen(true);
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

        {/* Store Banner */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-6 border border-border">
          <div className={`h-40 md:h-56 ${store.banner_url ? '' : 'bg-gradient-to-br from-primary/20 via-secondary to-muted'} flex items-end`}>
            {store.banner_url && <img src={store.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="relative z-10 p-6 w-full bg-gradient-to-t from-foreground/60 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-2xl font-display font-bold text-primary shadow-lg">
                  {store.brand_name?.[0] || "S"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-display font-bold text-white">{store.brand_name || "Store"}</h1>
                    <BadgeCheck size={20} className="text-blue-400" />
                  </div>
                  <p className="text-white/80 text-sm">{store.business_type || "Retail"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {store.description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{store.description}</p>
        )}

        <div className="flex items-center gap-2 mb-6">
          <Package size={18} className="text-primary" />
          <h2 className="text-lg font-display font-bold text-foreground">Products ({items.length})</h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => {
              const savings = item.old_price && item.price ? Math.round(((item.old_price - item.price) / item.old_price) * 100) : 0;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                  className="bg-card rounded-xl border border-border hover:border-primary/40 transition-colors overflow-hidden">
                  <div className="h-36 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{item.item_type === "service" ? "💼" : "🛍️"}</span>
                    )}
                    {savings > 0 && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
                        -{savings}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{item.product_name || "Item"}</p>
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    <div className="flex items-baseline gap-2 mt-2 mb-3">
                      <span className="text-primary font-bold">ZMW {item.price || 0}</span>
                      {item.old_price && <span className="text-xs text-muted-foreground line-through">ZMW {item.old_price}</span>}
                    </div>
                    <button onClick={() => handleBuyNow(item)}
                      disabled={!sellerHasCredits}
                      className={`w-full text-xs py-2 rounded-lg flex items-center justify-center gap-1 ${sellerHasCredits ? 'btn-gold' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'}`}>
                      {sellerHasCredits
                        ? (item.item_type === "service" ? "🛒 BOOK ORDER" : "🛒 BUY NOW")
                        : "Seller Limits Exceeded - Unavailable"}
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
