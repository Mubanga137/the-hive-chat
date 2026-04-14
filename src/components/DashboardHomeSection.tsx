import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag, MapPin, TrendingUp, Zap, Heart, Flame, ChevronRight, Sparkles
} from "lucide-react";
import FeaturedItemCard, { FeaturedItem } from "@/components/FeaturedItemCard";
import VendorCard, { VendorData } from "@/components/VendorCard";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const demoVendors: VendorData[] = [
  { id: 1, store_name: "Lusaka Threads", owner_name: "Jane M.", verified: true, is_featured: true, description: "Authentic African print fashion, blazers & accessories.", category: "Fashion", rating: 4.8, product_count: 42, location: "Lusaka" },
  { id: 2, store_name: "TechZone Zambia", owner_name: "David K.", verified: true, is_featured: true, description: "Latest gadgets, power banks, earbuds & smart devices.", category: "Tech", rating: 4.6, product_count: 67, location: "Kitwe" },
  { id: 3, store_name: "Glow Africa", owner_name: "Chanda N.", verified: true, is_featured: false, description: "Natural beauty products, shea butter & hair oils.", category: "Beauty", rating: 4.5, product_count: 31, location: "Lusaka" },
  { id: 4, store_name: "Craft & Culture", owner_name: "Moses B.", verified: true, is_featured: true, description: "Handwoven bags, baskets & artisan home décor.", category: "Lifestyle", rating: 4.9, product_count: 23, location: "Livingstone" },
  { id: 5, store_name: "Harvest Hub", owner_name: "Mary T.", verified: false, is_featured: true, description: "Organic honey, spices & farm-fresh produce delivered.", category: "Food", rating: 4.3, product_count: 18, location: "Chipata" },
  { id: 6, store_name: "Urban Kicks", owner_name: "Brian S.", verified: true, is_featured: true, description: "Street style sneakers, caps & urban fashion.", category: "Fashion", rating: 4.7, product_count: 55, location: "Ndola" },
];

const categoryCards = [
  { label: "Fashion", emoji: "👗", gradient: "from-blue-900/20 to-blue-500/10", path: "/category/fashion" },
  { label: "Tech", emoji: "📱", gradient: "from-cyan-500/20 to-cyan-300/10", path: "/category/tech" },
  { label: "Entertainment", emoji: "🎬", gradient: "from-violet-500/20 to-purple-300/10", path: "/category/entertainment" },
  { label: "Food", emoji: "🍟", gradient: "from-orange-500/20 to-amber-300/10", path: "/category/food" },
  { label: "Beauty", emoji: "💄", gradient: "from-rose-400/20 to-pink-300/10", path: "/category/beauty" },
];

// Fallback demo items when Supabase has no data
const fallbackItems: FeaturedItem[] = [
  { id: 101, item_name: "Wireless Bluetooth Speaker", price: 149.99, old_price: 199.99, store_name: "Audio Pro Zambia", category: "Tech", is_featured: true, rating: 4.6, review_count: 145, in_stock: true, fast_delivery: true, free_shipping: true, item_type: "product" },
  { id: 102, item_name: "Smart TV 55\" 4K UHD", price: 599.99, old_price: 749.99, store_name: "Electronics Hub", category: "Entertainment", is_featured: true, rating: 4.7, review_count: 234, in_stock: true, fast_delivery: true, item_type: "product" },
  { id: 103, item_name: "Traditional Chitenge Dress", price: 45.99, store_name: "Zambian Heritage Fashion", category: "Fashion", rating: 4.9, review_count: 87, in_stock: true, free_shipping: true, item_type: "product" },
  { id: 104, item_name: "iPhone 15 Pro Max Case", price: 399.99, old_price: 469.99, store_name: "Mobile Tech Zambia", category: "Tech", is_featured: false, rating: 4.8, review_count: 312, in_stock: true, fast_delivery: true, item_type: "product" },
  { id: 105, item_name: "Organic Honey Collection", price: 89.99, old_price: 120.00, store_name: "Harvest Hub", category: "Food", rating: 4.4, review_count: 56, in_stock: true, free_shipping: true, item_type: "product" },
  { id: 106, item_name: "Natural Shea Butter Set", price: 65.00, old_price: 85.00, store_name: "Glow Africa", category: "Beauty", is_featured: true, rating: 4.5, review_count: 98, in_stock: true, fast_delivery: true, free_shipping: true, item_type: "product" },
  { id: 107, item_name: "Gaming Headset RGB", price: 199.99, old_price: 259.99, store_name: "TechZone Zambia", category: "Tech", rating: 4.3, review_count: 178, in_stock: true, fast_delivery: true, item_type: "product" },
  { id: 108, item_name: "Hair Braiding Service", price: 150.00, store_name: "Glow Africa", category: "Beauty", rating: 4.8, review_count: 45, in_stock: true, item_type: "service" },
];

interface Props {
  firstName: string;
  greeting: string;
  setActiveSection: (s: string) => void;
}

const HorizontalScrollRow = ({
  title, icon, subtitle, badge, badgeColor, children
}: {
  title: string; icon: React.ReactNode; subtitle: string; badge?: string; badgeColor?: string; children: React.ReactNode;
}) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${badgeColor || "bg-primary"}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pt-3">
      {children}
    </div>
  </div>
);

const DashboardHomeSection = ({ firstName, greeting, setActiveSection }: Props) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [items, setItems] = useState<FeaturedItem[]>(fallbackItems);
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("hive_catalogue")
        .select("*, sme_stores(brand_name)")
        .limit(30);

      if (data && data.length > 0) {
        const mapped: FeaturedItem[] = data.map((item: any) => ({
          id: item.id,
          item_name: item.product_name || "Unnamed Item",
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
          discount_percent: item.old_price ? Math.round(((item.old_price - (item.price || 0)) / item.old_price) * 100) : undefined,
          sme_id: item.sme_id,
        }));
        setItems(mapped);
      }
    };
    fetchItems();
  }, []);

  const handleBuyNow = (item: FeaturedItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  // Derive rows
  const userPrefs = (profile?.preferences || []).filter((p: string) => !p.startsWith("philosophy:"));
  const recommended = userPrefs.length > 0
    ? items.filter(i => userPrefs.some((p: string) => i.category?.toLowerCase().includes(p.toLowerCase())))
    : items.slice(0, 6);

  const trending = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  const hotDeals = items.filter(i => i.old_price && i.old_price > i.price).slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-primary/20 text-sm font-medium text-muted-foreground mb-4">
          ✨ Welcome back to The Hive
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {greeting}, <span className="text-primary">{firstName}</span>
        </h2>
        <p className="text-muted-foreground mt-2">Discover amazing products, exclusive deals, and services tailored just for you.</p>

        <div className="flex gap-3 mt-6">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveSection("Marketplace")}
            className="btn-gold flex items-center gap-2 px-6 py-3 text-sm">
            <ShoppingBag size={16} /> Explore Marketplace
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveSection("Track My Orders")}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold border-2 border-border rounded-xl text-foreground hover:bg-secondary transition-colors">
            <MapPin size={16} /> Track Orders
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("Marketplace")}>
          <TrendingUp size={20} className="text-blue-500 mb-2" />
          <p className="text-xs text-muted-foreground">Trending Now</p>
          <p className="text-xl font-bold text-foreground">{trending.length}+</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("Marketplace")}>
          <Zap size={20} className="text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Hot Deals</p>
          <p className="text-xl font-bold text-foreground">{hotDeals.length > 0 ? "50% OFF" : "Deals"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("Wallet")}>
          <Heart size={20} className="text-emerald-500 mb-2" />
          <p className="text-xs text-muted-foreground">Saved Items</p>
          <p className="text-xl font-bold text-foreground">18</p>
        </motion.div>
      </div>

      {/* Row 1: Recommended For You */}
      <HorizontalScrollRow
        title="Recommended For You"
        icon={<Sparkles size={20} className="text-primary" />}
        subtitle="Based on your taste profile"
        badge="PERSONALIZED"
        badgeColor="bg-primary"
      >
        {recommended.map((item, i) => (
          <div key={item.id} className="shrink-0 w-[220px]">
            <FeaturedItemCard item={item} index={i} onBuyNow={handleBuyNow} onVisitStore={(it) => navigate(`/store/${it.sme_id || 1}`)} />
          </div>
        ))}
      </HorizontalScrollRow>

      {/* Row 2: Trending Now */}
      <HorizontalScrollRow
        title="Trending Now"
        icon={<TrendingUp size={20} className="text-orange-500" />}
        subtitle="Most popular products right now"
        badge="HOT"
        badgeColor="bg-orange-500"
      >
        {trending.map((item, i) => (
          <div key={item.id} className="shrink-0 w-[220px]">
            <FeaturedItemCard item={item} index={i} onBuyNow={handleBuyNow} onVisitStore={(it) => navigate(`/store/${it.sme_id || 1}`)} variant="trending" />
          </div>
        ))}
      </HorizontalScrollRow>

      {/* Row 3: Hot Deals */}
      <HorizontalScrollRow
        title="Hot Deals"
        icon={<Flame size={20} className="text-red-500" />}
        subtitle="Biggest discounts right now"
        badge="SAVE BIG"
        badgeColor="bg-red-500"
      >
        {(hotDeals.length > 0 ? hotDeals : items.slice(0, 6)).map((item, i) => (
          <div key={item.id} className="shrink-0 w-[220px]">
            <FeaturedItemCard item={item} index={i} onBuyNow={handleBuyNow} onVisitStore={(it) => navigate(`/store/${it.sme_id || 1}`)} variant="hot" />
          </div>
        ))}
      </HorizontalScrollRow>

      {/* Row 4: Recommended Vendors */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-display font-bold text-foreground">Recommended Vendors</h3>
            <p className="text-xs text-muted-foreground">Trusted stores on The Hive</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pt-3">
          {demoVendors.map((vendor, i) => (
            <VendorCard key={vendor.id} vendor={vendor} index={i} onVisitStore={(v) => navigate(`/store/${v.id}`)} />
          ))}
        </div>
      </div>

      {/* Row 5: Explore Categories */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ChevronRight size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">Explore Categories</h3>
            <p className="text-xs text-muted-foreground">Browse by interest</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categoryCards.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => navigate(cat.path)}
              className={`relative bg-gradient-to-br ${cat.gradient} border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group min-h-[120px]`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{cat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <CheckoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
    </div>
  );
};

export default DashboardHomeSection;
