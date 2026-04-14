import { motion } from "framer-motion";
import { BadgeCheck, Heart, Star, Truck, Package, Sparkles } from "lucide-react";

export interface FeaturedItem {
  id: number;
  item_name: string;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  store_name: string;
  category: string;
  is_featured?: boolean;
  discount_percent?: number;
  rating?: number;
  review_count?: number;
  in_stock?: boolean;
  fast_delivery?: boolean;
  free_shipping?: boolean;
  item_type?: "product" | "service";
  sme_id?: number;
}

interface ThemeClasses {
  btnBg?: string;
  btnHover?: string;
  btnText?: string;
}

interface FeaturedItemCardProps {
  item: FeaturedItem;
  index?: number;
  onBuyNow?: (item: FeaturedItem) => void;
  onVisitStore?: (item: FeaturedItem) => void;
  variant?: "default" | "hot" | "trending";
  themeClasses?: ThemeClasses;
}

const FeaturedItemCard = ({ item, index = 0, onBuyNow, onVisitStore, variant = "default", themeClasses }: FeaturedItemCardProps) => {
  const savings = item.old_price ? Math.round(((item.old_price - item.price) / item.old_price) * 100) : 0;
  const isService = item.item_type === "service";

  const borderClass = variant === "hot"
    ? "border-red-500/40 hover:border-red-500/70"
    : variant === "trending"
    ? "border-orange-500/40 hover:border-orange-500/70"
    : "border-border hover:border-primary/40";

  const accentColor = variant === "hot" ? "text-red-500" : variant === "trending" ? "text-orange-500" : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index }}
      className={`bg-card rounded-xl overflow-hidden flex flex-col border ${borderClass} transition-colors shadow-sm min-w-[200px]`}
    >
      <div className="relative h-44 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">{isService ? "💼" : "🛍️"}</span>
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_featured && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles size={10} /> Featured
            </span>
          )}
          {item.fast_delivery && (
            <span className="bg-emerald-600 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Truck size={10} /> Fast Delivery
            </span>
          )}
          {savings > 0 && (
            <span className={`${variant === "hot" ? "bg-red-500" : variant === "trending" ? "bg-orange-500" : "bg-primary"} text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md`}>-{savings}% OFF</span>
          )}
        </div>
        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border hover:bg-destructive/10 transition-colors">
          <Heart size={16} className="text-muted-foreground hover:text-destructive" />
        </button>
        {(item.rating ?? 0) > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/70 backdrop-blur-sm text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-md">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            {item.rating} {item.review_count ? `(${item.review_count})` : ""}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {item.store_name[0]}
          </span>
          <span className="text-xs text-muted-foreground truncate flex-1">{item.store_name}</span>
          <BadgeCheck size={14} className="text-blue-500 shrink-0" />
        </div>
        <p className="text-sm font-semibold text-foreground line-clamp-2 mb-2 flex-1">{item.item_name}</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`${accentColor} font-bold text-base`}>ZMW {item.price}</span>
          {item.old_price && <span className="text-xs text-muted-foreground line-through">ZMW {item.old_price}</span>}
        </div>
        {savings > 0 && <p className="text-emerald-600 text-[11px] font-semibold mb-2">Save {savings}%</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mb-3">
          <span className={item.in_stock !== false ? "text-emerald-600" : "text-destructive"}>
            ● {item.in_stock !== false ? "In Stock" : "Out of Stock"}
          </span>
          {item.fast_delivery && <span className="flex items-center gap-0.5"><Truck size={10} />Fast</span>}
          {item.free_shipping && <span className="flex items-center gap-0.5"><Package size={10} />Free Ship</span>}
        </div>
        <button
          onClick={() => onBuyNow?.(item)}
          className={`w-full flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 rounded-lg font-bold transition-colors ${
            themeClasses
              ? `${themeClasses.btnBg} ${themeClasses.btnHover} ${themeClasses.btnText}`
              : variant === "hot" ? "bg-red-500 hover:bg-red-600 text-white" : variant === "trending" ? "bg-orange-500 hover:bg-orange-600 text-white" : "btn-gold"
          }`}
        >
          🛒 {isService ? "BOOK ORDER" : "BUY NOW"}
        </button>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => onVisitStore?.(item)} className="flex items-center justify-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors">
            <Package size={12} /> Store
          </button>
          <button className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground border border-border rounded-lg py-1.5 hover:bg-secondary transition-colors">
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedItemCard;
