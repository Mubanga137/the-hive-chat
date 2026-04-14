import { motion } from "framer-motion";
import { BadgeCheck, Star, MapPin, Package } from "lucide-react";

export interface VendorData {
  id: number;
  store_name: string;
  owner_name: string;
  verified: boolean;
  is_featured: boolean;
  description: string;
  category: string;
  rating: number;
  product_count: number;
  location: string;
}

interface VendorCardProps {
  vendor: VendorData;
  index?: number;
  onVisitStore?: (vendor: VendorData) => void;
}

const VendorCard = ({ vendor, index = 0, onVisitStore }: VendorCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors shadow-sm cursor-pointer group min-w-[260px] max-w-[300px] shrink-0"
    >
      <div className="relative h-24 bg-gradient-to-br from-primary/10 via-secondary to-muted flex items-end p-4">
        <div className="absolute top-3 right-3 flex gap-1.5">
          {vendor.is_featured && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">Featured</span>
          )}
          {vendor.verified && (
            <span className="bg-emerald-600 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <BadgeCheck size={10} /> Verified
            </span>
          )}
        </div>
        <div className="w-14 h-14 rounded-full border-2 border-card bg-card flex items-center justify-center shadow-md -mb-7 group-hover:border-primary/40 transition-colors overflow-hidden">
          <span className="text-xl font-display font-bold text-primary">
            {vendor.store_name[0]}
          </span>
        </div>
      </div>

      <div className="p-4 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-foreground">{vendor.store_name}</h4>
          {vendor.verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{vendor.description}</p>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
          <span className="flex items-center gap-0.5">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            {vendor.rating}
          </span>
          <span className="flex items-center gap-0.5">
            <Package size={11} />
            {vendor.product_count} items
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin size={11} />
            {vendor.location}
          </span>
        </div>

        <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
          {vendor.category}
        </span>

        <button
          onClick={() => onVisitStore?.(vendor)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl py-2 hover:bg-primary/90 transition-colors"
        >
          Visit Store →
        </button>
      </div>
    </motion.div>
  );
};

export default VendorCard;
