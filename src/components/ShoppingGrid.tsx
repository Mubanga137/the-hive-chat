import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Search, Shirt, Smartphone, Music, UtensilsCrossed, Sparkles } from "lucide-react";
import FeaturedItemCard, { type FeaturedItem } from "./FeaturedItemCard";
import CheckoutDrawer from "./CheckoutDrawer";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { label: "All", icon: Package },
  { label: "Fashion", icon: Shirt },
  { label: "Tech", icon: Smartphone },
  { label: "Entertainment", icon: Music },
  { label: "Food", icon: UtensilsCrossed },
  { label: "Beauty", icon: Sparkles },
];

const mapItem = (item: any): FeaturedItem => ({
  id: item.id,
  item_name: item.product_name || "Unnamed",
  price: item.price || 0,
  old_price: item.old_price,
  image_url: item.image_url,
  store_name: item.sme_stores?.brand_name || "The Hive Store",
  category: item.category || "General",
  is_featured: (item.stock_count ?? 0) > 10,
  rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
  review_count: Math.floor(Math.random() * 300) + 10,
  in_stock: (item.stock_count ?? 0) > 0,
  fast_delivery: item.fulfillment_type === "express",
  free_shipping: (item.price ?? 0) > 100,
  item_type: item.item_type === "service" ? "service" : "product",
  sme_id: item.sme_id,
});

const ShoppingGrid = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hive_catalogue")
        .select("*, sme_stores(brand_name)")
        .order("created_at", { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        setItems(data.map(mapItem));
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === "All" || (item.category || "").toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = !searchQuery || item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuyNow = (item: FeaturedItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  return (
    <section id="marketplace" className="relative z-10 px-4 py-8 max-w-6xl mx-auto">
      <h3 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
        Featured <span className="text-primary">Marketplace</span>
      </h3>

      <div className="max-w-xl mx-auto mb-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search products..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
        </motion.div>
      </div>

      <div className="flex justify-center gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === cat.label ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
            }`}>
            <cat.icon size={14} />
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredItems.map((item, i) => (
            <FeaturedItemCard
              key={item.id}
              item={item}
              index={i}
              onBuyNow={handleBuyNow}
              onVisitStore={(it) => navigate(`/store/${it.sme_id || 1}`)}
            />
          ))}
        </div>
      )}

      <CheckoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
    </section>
  );
};

export default ShoppingGrid;
