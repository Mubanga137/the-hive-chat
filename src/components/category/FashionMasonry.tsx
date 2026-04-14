import { motion } from "framer-motion";
import FeaturedItemCard, { FeaturedItem } from "@/components/FeaturedItemCard";

interface Props {
  items: FeaturedItem[];
  onBuyNow: (item: FeaturedItem) => void;
}

const FashionMasonry = ({ items, onBuyNow }: Props) => {
  const trendingItems = items.slice(0, 4);
  if (trendingItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-10"
    >
      <h3 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
        👗 Trending Looks
      </h3>
      {/* Masonry-style: alternating tall/short cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-auto">
        {trendingItems.map((item, i) => (
          <div
            key={item.id}
            className={i % 3 === 0 ? "md:row-span-2" : ""}
          >
            <FeaturedItemCard
              item={item}
              index={i}
              onBuyNow={onBuyNow}
              variant="trending"
              themeClasses={{ btnBg: "bg-slate-800", btnHover: "hover:bg-slate-900", btnText: "text-white" }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FashionMasonry;
