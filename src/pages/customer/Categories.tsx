import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Smartphone, Shirt, Music, UtensilsCrossed, Sparkles, ArrowRight } from "lucide-react";
import FeaturedItemCard, { type FeaturedItem } from "@/components/FeaturedItemCard";
import CheckoutDrawer from "@/components/CheckoutDrawer";

const categoryCards = [
  { label: "Tech", emoji: "📱", icon: Smartphone, color: "from-blue-500/20 to-blue-600/10", description: "Gadgets, phones, accessories" },
  { label: "Fashion", emoji: "👗", icon: Shirt, color: "from-pink-500/20 to-pink-600/10", description: "Clothing, shoes, bags" },
  { label: "Food", emoji: "🍟", icon: UtensilsCrossed, color: "from-orange-500/20 to-orange-600/10", description: "Local & organic delights" },
  { label: "Entertainment", emoji: "🎬", icon: Music, color: "from-purple-500/20 to-purple-600/10", description: "Events, bookings, media" },
  { label: "Beauty", emoji: "💄", icon: Sparkles, color: "from-rose-500/20 to-rose-600/10", description: "Skincare, haircare, cosmetics" },
];

const demoItems: FeaturedItem[] = [
  { id: 1, item_name: "African Print Blazer", price: 450, old_price: 600, store_name: "Lusaka Threads", category: "Fashion", item_type: "product", rating: 4.6, review_count: 145, in_stock: true, fast_delivery: true, free_shipping: true, is_featured: true },
  { id: 2, item_name: "Wireless Earbuds Pro", price: 280, old_price: 350, store_name: "TechZone Zambia", category: "Tech", item_type: "product", rating: 4.8, review_count: 312, in_stock: true, fast_delivery: true },
  { id: 3, item_name: "Shea Butter Collection", price: 120, old_price: 180, store_name: "Glow Africa", category: "Beauty", item_type: "product", rating: 4.3, review_count: 89, in_stock: true, free_shipping: true, is_featured: true, discount_percent: 30 },
  { id: 5, item_name: "Organic Honey Set", price: 95, old_price: 130, store_name: "Harvest Hub", category: "Food", item_type: "product", rating: 4.5, review_count: 203, in_stock: true, fast_delivery: true, free_shipping: true, is_featured: true },
  { id: 8, item_name: "Ankara Sneakers", price: 380, old_price: 500, store_name: "Lusaka Threads", category: "Fashion", item_type: "product", rating: 4.7, review_count: 98, in_stock: true, fast_delivery: true, free_shipping: true, is_featured: true },
  { id: 9, item_name: "DJ Session Booking", price: 500, store_name: "Beats Zambia", category: "Entertainment", item_type: "service", rating: 4.4, review_count: 22, in_stock: true },
  { id: 10, item_name: "Natural Hair Oil", price: 75, old_price: 100, store_name: "Glow Africa", category: "Beauty", item_type: "product", rating: 4.4, review_count: 178, in_stock: true, fast_delivery: true },
];

const Categories = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = selected ? demoItems.filter(i => i.category === selected) : [];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <FolderOpen size={24} className="text-primary" /> Categories
        </h2>
        <p className="text-muted-foreground mt-1">Browse by your favourite categories</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {categoryCards.map((cat, i) => (
          <motion.button key={cat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(selected === cat.label ? null : cat.label)}
            className={`flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br ${cat.color} border transition-all text-left ${
              selected === cat.label ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/40"
            }`}>
            <span className="text-4xl">{cat.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{cat.label}</p>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg font-display font-bold text-foreground mb-4">{selected} ({filtered.length} items)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <FeaturedItemCard key={item.id} item={item} index={i} onBuyNow={(it) => { setSelectedItem(it); setDrawerOpen(true); }} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No items in this category yet</p>
          )}
        </motion.div>
      )}

      <CheckoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
    </div>
  );
};

export default Categories;
