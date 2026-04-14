import { motion } from "framer-motion";
import FeaturedItemCard, { FeaturedItem } from "@/components/FeaturedItemCard";

interface Props {
  items: FeaturedItem[];
  onBuyNow: (item: FeaturedItem) => void;
}

const FoodHotSection = ({ items, onBuyNow }: Props) => {
  const hotItems = items.filter(i => i.is_featured || (i.rating ?? 0) >= 4.5).slice(0, 4);
  if (hotItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-10"
    >
      <h3 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
        🌶️ Fresh & Hot Right Now
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {hotItems.map((item, i) => (
          <div key={item.id} className="min-w-[220px] max-w-[240px] shrink-0">
            <FeaturedItemCard
              item={item}
              index={i}
              onBuyNow={onBuyNow}
              variant="hot"
              themeClasses={{ btnBg: "bg-orange-500", btnHover: "hover:bg-orange-600", btnText: "text-white" }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FoodHotSection;
