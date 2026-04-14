import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: number;
  product_name: string | null;
  price: number | null;
  image_url: string | null;
}

interface AttachProductModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

const AttachProductModal = ({ open, onClose, onSelect }: AttachProductModalProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const query = supabase
        .from("hive_catalogue")
        .select("id, product_name, price, image_url")
        .limit(30);
      const { data } = await query;
      if (data) setProducts(data as Product[]);
      setLoading(false);
    })();
  }, [open]);

  const filtered = products.filter((p) =>
    !search || p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(15,26,53,0.4)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#FFFBF2", maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <p className="font-bold text-sm" style={{ color: "#0F1A35" }}>📎 Attach Product</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
                <X size={18} style={{ color: "#0F1A35" }} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Search catalogue…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-sm bg-secondary/40 border-border/40"
                />
              </div>
            </div>

            {/* Products */}
            <ScrollArea className="flex-1 px-4 pb-4">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No products found</p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { onSelect(p); onClose(); }}
                      className="rounded-xl border border-border/40 overflow-hidden text-left hover:border-primary/40 transition-colors"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-secondary/40 flex items-center justify-center text-2xl">🛍️</div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-semibold truncate" style={{ color: "#0F1A35" }}>
                          {p.product_name || "Unnamed"}
                        </p>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: "#B37C1C" }}>
                          K{p.price ?? 0}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold rounded-md px-2 py-1 justify-center"
                          style={{ backgroundColor: "#B37C1C", color: "#FFFBF2" }}>
                          <Lock size={10} /> Lock Item
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttachProductModal;
