import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Filter } from "lucide-react";
import FeaturedItemCard, { FeaturedItem } from "@/components/FeaturedItemCard";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import ThemedHoneycombBackground from "@/components/ThemedHoneycombBackground";
import TechBanner from "@/components/category/TechBanner";
import FoodHotSection from "@/components/category/FoodHotSection";
import FashionMasonry from "@/components/category/FashionMasonry";
import { categoryThemes } from "@/lib/categoryThemes";
import { supabase } from "@/integrations/supabase/client";

const fallbackItems: Record<string, FeaturedItem[]> = {
  tech: [
    { id: 201, item_name: "Wireless Bluetooth Speaker", price: 149.99, old_price: 199.99, store_name: "Audio Pro Zambia", category: "Tech", is_featured: true, rating: 4.6, review_count: 145, in_stock: true, fast_delivery: true, free_shipping: true, item_type: "product" },
    { id: 202, item_name: "Gaming Headset RGB", price: 199.99, old_price: 259.99, store_name: "TechZone Zambia", category: "Tech", rating: 4.3, review_count: 178, in_stock: true, fast_delivery: true, item_type: "product" },
    { id: 203, item_name: "iPhone 15 Pro Case", price: 399.99, old_price: 469.99, store_name: "Mobile Tech Zambia", category: "Tech", rating: 4.8, review_count: 312, in_stock: true, fast_delivery: true, item_type: "product" },
    { id: 204, item_name: "USB-C Hub 7-in-1", price: 89.99, store_name: "TechZone Zambia", category: "Tech", rating: 4.5, review_count: 67, in_stock: true, item_type: "product" },
  ],
  fashion: [
    { id: 301, item_name: "Traditional Chitenge Dress", price: 45.99, store_name: "Zambian Heritage Fashion", category: "Fashion", rating: 4.9, review_count: 87, in_stock: true, free_shipping: true, item_type: "product" },
    { id: 302, item_name: "African Print Blazer", price: 320.00, old_price: 400.00, store_name: "Lusaka Threads", category: "Fashion", is_featured: true, rating: 4.8, review_count: 156, in_stock: true, fast_delivery: true, item_type: "product" },
    { id: 303, item_name: "Handwoven Tote Bag", price: 75.00, store_name: "Craft & Culture", category: "Fashion", rating: 4.7, review_count: 42, in_stock: true, item_type: "product" },
    { id: 304, item_name: "Urban Sneakers Classic", price: 250.00, old_price: 310.00, store_name: "Urban Kicks", category: "Fashion", rating: 4.6, review_count: 201, in_stock: true, fast_delivery: true, item_type: "product" },
  ],
  food: [
    { id: 401, item_name: "Organic Honey Collection", price: 89.99, old_price: 120.00, store_name: "Harvest Hub", category: "Food", rating: 4.4, review_count: 56, in_stock: true, free_shipping: true, item_type: "product" },
    { id: 402, item_name: "Zambian Spice Mix Set", price: 35.00, store_name: "Harvest Hub", category: "Food", rating: 4.6, review_count: 34, in_stock: true, item_type: "product" },
    { id: 403, item_name: "Farm-Fresh Produce Box", price: 65.00, store_name: "Harvest Hub", category: "Food", rating: 4.3, review_count: 89, in_stock: true, fast_delivery: true, item_type: "product" },
    { id: 404, item_name: "Artisan Coffee Beans 1kg", price: 120.00, old_price: 150.00, store_name: "Harvest Hub", category: "Food", is_featured: true, rating: 4.8, review_count: 112, in_stock: true, item_type: "product" },
  ],
  entertainment: [
    { id: 501, item_name: "Smart TV 55\" 4K UHD", price: 599.99, old_price: 749.99, store_name: "Electronics Hub", category: "Entertainment", is_featured: true, rating: 4.7, review_count: 234, in_stock: true, fast_delivery: true, item_type: "product" },
    { id: 502, item_name: "Bluetooth Karaoke Mic", price: 79.99, store_name: "Audio Pro Zambia", category: "Entertainment", rating: 4.2, review_count: 67, in_stock: true, item_type: "product" },
    { id: 503, item_name: "Portable Projector Mini", price: 450.00, old_price: 550.00, store_name: "TechZone Zambia", category: "Entertainment", rating: 4.5, review_count: 45, in_stock: true, item_type: "product" },
    { id: 504, item_name: "DJ Booking Service", price: 500.00, store_name: "Lusaka Events", category: "Entertainment", rating: 4.9, review_count: 78, in_stock: true, item_type: "service" },
  ],
  beauty: [
    { id: 601, item_name: "Natural Shea Butter Set", price: 65.00, old_price: 85.00, store_name: "Glow Africa", category: "Beauty", is_featured: true, rating: 4.5, review_count: 98, in_stock: true, fast_delivery: true, free_shipping: true, item_type: "product" },
    { id: 602, item_name: "Hair Braiding Service", price: 150.00, store_name: "Glow Africa", category: "Beauty", rating: 4.8, review_count: 45, in_stock: true, item_type: "service" },
    { id: 603, item_name: "Organic Hair Oil Collection", price: 55.00, store_name: "Glow Africa", category: "Beauty", rating: 4.6, review_count: 67, in_stock: true, item_type: "product" },
    { id: 604, item_name: "Facial Treatment Package", price: 200.00, old_price: 280.00, store_name: "Glow Africa", category: "Beauty", rating: 4.7, review_count: 34, in_stock: true, item_type: "service" },
  ],
};

const CategoryPage = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const key = (name || "").toLowerCase();
  const theme = categoryThemes[key];

  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hive_catalogue")
        .select("*, sme_stores(brand_name)")
        .ilike("category", `%${key}%`)
        .limit(40);

      if (data && data.length > 0) {
        setItems(data.map((item: any) => ({
          id: item.id,
          item_name: item.product_name || "Unnamed",
          price: item.price || 0,
          old_price: item.old_price,
          image_url: item.image_url,
          store_name: item.sme_stores?.brand_name || "The Hive Store",
          category: item.category || theme?.title || "General",
          is_featured: (item.stock_count ?? 0) > 10,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          review_count: Math.floor(Math.random() * 300) + 10,
          in_stock: (item.stock_count ?? 0) > 0,
          fast_delivery: item.fulfillment_type === "express",
          free_shipping: (item.price ?? 0) > 100,
          item_type: item.item_type === "service" ? "service" : "product",
        })));
      } else {
        setItems(fallbackItems[key] || []);
      }
      setLoading(false);
    };
    fetchItems();
  }, [key]);

  const vendors = useMemo(() => [...new Set(items.map(i => i.store_name))], [items]);
  const filtered = vendorFilter ? items.filter(i => i.store_name === vendorFilter) : items;

  const handleBuyNow = (item: FeaturedItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const themeClasses = theme ? { btnBg: theme.btnBg, btnHover: theme.btnHover, btnText: theme.btnText } : undefined;

  if (!theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground mb-4">Category not found</p>
          <button onClick={() => navigate("/customer-dash")} className="btn-gold px-6 py-3 text-sm">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-background">
      {/* Dynamic honeycomb background bound to category color */}
      <ThemedHoneycombBackground color={theme.honeycombColor} />

      {/* Radial gradient wash */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: theme.gradient }} />

      <div className="relative z-10">
        {/* Sticky header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 glass-header px-4 py-3 flex items-center gap-3"
        >
          <button onClick={() => navigate("/customer-dash")} className="p-2 rounded-xl hover:bg-secondary transition-colors text-foreground">
            <ArrowLeft size={20} />
          </button>
          <span className="text-2xl">{theme.emoji}</span>
          <h1 className="text-lg font-display font-bold text-foreground">{theme.title}</h1>
        </motion.div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Hero title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {theme.emoji} {theme.title}
            </h2>
            <p className="text-muted-foreground mt-1">{theme.subtitle}</p>
          </motion.div>

          {/* === CATEGORY-SPECIFIC SECTIONS === */}
          <AnimatePresence mode="wait">
            {key === "tech" && <TechBanner />}
            {key === "food" && <FoodHotSection items={items} onBuyNow={handleBuyNow} />}
            {key === "fashion" && <FashionMasonry items={items} onBuyNow={handleBuyNow} />}
          </AnimatePresence>

          {/* Vendor filter pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6"
          >
            <button
              onClick={() => setVendorFilter(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
                !vendorFilter ? theme.pillActive : "bg-card border-border text-foreground hover:border-primary/30"
              }`}
            >
              <Filter size={12} className="inline mr-1" /> All Vendors
            </button>
            {vendors.map(v => (
              <button
                key={v}
                onClick={() => setVendorFilter(v === vendorFilter ? null : v)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
                  vendorFilter === v ? theme.pillActive : "bg-card border-border text-foreground hover:border-primary/30"
                }`}
              >
                {v}
              </button>
            ))}
          </motion.div>

          {/* Product grid — standard hive_catalogue layout */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="text-4xl mb-3">{theme.emoji}</p>
              <p className="text-lg font-semibold text-foreground">No items found</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for new {theme.title.toLowerCase()} products!</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {filtered.map((item, i) => (
                <FeaturedItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  onBuyNow={handleBuyNow}
                  themeClasses={themeClasses}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <CheckoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
    </div>
  );
};

export default CategoryPage;
