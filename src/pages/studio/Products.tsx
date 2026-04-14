import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CatalogueItem {
  id: number;
  product_name: string | null;
  price: number | null;
  old_price: number | null;
  stock_count: number | null;
  category: string | null;
  image_url: string | null;
  item_type: string | null;
}

const categories = ["Fashion", "Tech", "Beauty", "Food", "Entertainment", "Accessories", "Other"];

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setName(""); setPrice(""); setOldPrice(""); setStock(""); setCategory(""); setImageUrl(""); setEditingId(null);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
    const sid = store?.id || null;
    setStoreId(sid);
    if (sid) {
      const { data } = await supabase.from("hive_catalogue").select("*").eq("sme_id", sid).neq("item_type", "service").order("created_at", { ascending: false });
      setProducts((data as CatalogueItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { toast.error("No store linked to your account. Create one first."); return; }
    if (!name.trim()) { toast.error("Product name is required."); return; }
    setSubmitting(true);
    const payload = {
      product_name: name.trim(),
      price: parseFloat(price) || 0,
      old_price: oldPrice ? parseFloat(oldPrice) : null,
      stock_count: parseInt(stock) || 0,
      category: category || null,
      image_url: imageUrl || null,
      sme_id: storeId,
      item_type: "product",
    };
    if (editingId) {
      const { error } = await supabase.from("hive_catalogue").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); } else { toast.success("Product updated!"); }
    } else {
      const { error } = await supabase.from("hive_catalogue").insert(payload);
      if (error) { toast.error(error.message); } else { toast.success("Product added!"); }
    }
    setSubmitting(false);
    resetForm();
    setFormOpen(false);
    fetchData();
  };

  const handleEdit = (item: CatalogueItem) => {
    setEditingId(item.id);
    setName(item.product_name || "");
    setPrice(String(item.price || ""));
    setOldPrice(String(item.old_price || ""));
    setStock(String(item.stock_count || ""));
    setCategory(item.category || "");
    setImageUrl(item.image_url || "");
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted.");
    fetchData();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your product inventory</p>
          </div>
          <button onClick={() => { resetForm(); setFormOpen(true); }} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-card border border-border rounded-2xl shadow-2xl z-[90] overflow-auto max-h-[90vh]">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-foreground">{editingId ? "Edit Product" : "Add Product"}</h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name *" className={inputClass} required />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (ZMW)" type="number" step="0.01" className={inputClass} required />
                    <input value={oldPrice} onChange={e => setOldPrice(e.target.value)} placeholder="Old price (optional)" type="number" step="0.01" className={inputClass} />
                  </div>
                  <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock count" type="number" className={inputClass} />
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className={inputClass} />
                  <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? "Update Product" : "Add Product"}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products yet. Click "Add Product" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden group">
                <div className="aspect-square bg-secondary/30 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.product_name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={36} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">{product.product_name || "Unnamed"}</h3>
                  <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">ZMW {product.price || 0}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (product.stock_count || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>{(product.stock_count || 0) > 0 ? `${product.stock_count} in stock` : "Out of stock"}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-destructive border border-destructive/30 rounded-lg py-1.5 hover:bg-destructive/5 transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Products;
