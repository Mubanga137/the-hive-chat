import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Copy, Check, CircleAlert as AlertCircle, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CatalogueItem {
  id: number;
  product_name: string | null;
  price: number | null;
  wholesale_price: number | null;
  category: string | null;
  image_url: string | null;
  stock_count: number | null;
  is_wholesale: boolean | null;
  created_at: string;
}

interface CloneDialogState {
  open: boolean;
  item: CatalogueItem | null;
}

const WholesaleBountyHub = () => {
  const { user } = useAuth();
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloneDialog, setCloneDialog] = useState<CloneDialogState>({ open: false, item: null });
  const [markupPrice, setMarkupPrice] = useState("");
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchCatalogueItems();
  }, []);

  const fetchCatalogueItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hive_catalogue")
      .select("*")
      .eq("is_wholesale", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching catalogue:", error);
      toast.error("Failed to load wholesale catalogue");
    } else {
      setCatalogueItems((data as CatalogueItem[]) || []);
    }
    setLoading(false);
  };

  const getBasePrice = (item: CatalogueItem) => item.wholesale_price || item.price || 0;

  const handleCloneClick = (item: CatalogueItem) => {
    setCloneDialog({ open: true, item });
    setMarkupPrice(String(Math.round(getBasePrice(item) * 1.3)));
  };

  const handleCloneToStore = async () => {
    if (!cloneDialog.item || !user) return;

    const basePrice = getBasePrice(cloneDialog.item);
    const markup = parseFloat(markupPrice);
    if (isNaN(markup) || markup <= basePrice) {
      toast.error("Markup price must be higher than base price");
      return;
    }

    setCloning(true);

    const { error } = await supabase
      .from("vendor_cloned_items")
      .insert({
        vendor_id: user.id,
        catalogue_item_id: cloneDialog.item.id,
        markup_price: markup,
        is_active: true,
      });

    setCloning(false);

    if (error) {
      console.error("Error cloning item:", error);
      toast.error("Failed to clone item");
    } else {
      toast.success(`${cloneDialog.item.product_name} added to your store!`);
      setCloneDialog({ open: false, item: null });
      setMarkupPrice("");
    }
  };

  const calculateProfit = () => {
    if (!cloneDialog.item) return 0;
    const markup = parseFloat(markupPrice);
    if (isNaN(markup)) return 0;
    return markup - getBasePrice(cloneDialog.item);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Wholesale Bounty Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clone wholesale items and set your markup to sell in your store
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading catalogue...</p>
          </div>
        ) : catalogueItems.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No wholesale items available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogueItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden group hover:border-primary/40 transition-colors"
              >
                <div className="aspect-square bg-secondary/30 flex items-center justify-center relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={48} className="text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-md">
                      WHOLESALE
                    </span>
                  </div>
                  {item.category && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-secondary/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-1 rounded-md">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                      {item.product_name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Base Price</p>
                      <p className="text-lg font-bold text-primary">ZMW {getBasePrice(item)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">In Stock</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.stock_count ?? 0}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCloneClick(item)}
                    className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                  >
                    📦 CLONE TO MY STORE
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {cloneDialog.open && cloneDialog.item && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Copy size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">
                  Clone to Your Store
                </h3>
                <p className="text-xs text-muted-foreground">{cloneDialog.item.product_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Wholesale Price</span>
                  <span className="text-sm font-semibold text-foreground">
                    ZMW {getBasePrice(cloneDialog.item)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Available Stock</span>
                  <span className="text-sm font-semibold text-foreground">
                    {cloneDialog.item.stock_count ?? 0} units
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  Set Your Selling Price
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min={getBasePrice(cloneDialog.item)}
                    value={markupPrice}
                    onChange={(e) => setMarkupPrice(e.target.value)}
                    placeholder="Enter your price"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: ZMW {getBasePrice(cloneDialog.item)}
                </p>
              </div>

              {calculateProfit() > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-700">
                        Your Profit Per Unit
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        ZMW {calculateProfit().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parseFloat(markupPrice) > 0 && parseFloat(markupPrice) <= getBasePrice(cloneDialog.item) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Price must be higher than wholesale price
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCloneDialog({ open: false, item: null })}
                className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneToStore}
                disabled={cloning || parseFloat(markupPrice) <= getBasePrice(cloneDialog.item)}
                className="flex-1 btn-gold py-2.5 text-sm disabled:opacity-50"
              >
                {cloning ? "Cloning..." : "Clone Item"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WholesaleBountyHub;
