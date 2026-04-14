import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tag, Plus, X, Loader2, Trash2, Percent } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PromoItem {
  id: number;
  promo_code: string | null;
  promo_discount: number | null;
  product_name: string | null;
}

const MarketingPromos = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
      const sid = store?.id || null;
      setStoreId(sid);
      if (sid) fetchPromos(sid);
      else setLoading(false);
    };
    init();
  }, [user]);

  const fetchPromos = async (sid: number) => {
    setLoading(true);
    const { data } = await supabase
      .from("hive_catalogue")
      .select("id, promo_code, promo_discount, product_name")
      .eq("sme_id", sid)
      .not("promo_code", "is", null)
      .order("created_at", { ascending: false });
    setPromos((data as PromoItem[]) || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { toast.error("No store linked."); return; }
    if (!code.trim()) { toast.error("Promo code is required."); return; }
    setSubmitting(true);

    // Create a promo placeholder entry in catalogue
    const { error } = await supabase.from("hive_catalogue").insert({
      product_name: `Promo: ${code.trim().toUpperCase()}`,
      promo_code: code.trim().toUpperCase(),
      promo_discount: Number(discount) || 0,
      sme_id: storeId,
      item_type: "product",
      price: 0,
      stock_count: 0,
      category: "Promo",
    });
    if (error) toast.error(error.message);
    else { toast.success("Promo code created!"); setCode(""); setDiscount(""); setFormOpen(false); fetchPromos(storeId); }
    setSubmitting(false);
  };

  const deletePromo = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Promo deleted."); if (storeId) fetchPromos(storeId); }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Tag size={22} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Marketing & Promos</h2>
              <p className="text-sm text-muted-foreground">Create promo codes and discount campaigns</p>
            </div>
          </div>
          <button onClick={() => setFormOpen(true)} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> New Promo
          </button>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] bg-card border border-border rounded-2xl shadow-2xl z-[90]">
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-foreground">New Promo Code</h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="Promo Code (e.g. HIVE20) *" className={inputClass} required />
                  <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount Amount (ZMW)" type="number" className={inputClass} />
                  <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Promo"}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Promos list */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="font-display font-bold text-foreground">Active Promos</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : promos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Percent size={32} className="mx-auto mb-2 opacity-30" />
              No promo codes yet.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {promos.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Tag size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground font-mono">{p.promo_code}</p>
                      <p className="text-xs text-muted-foreground">Discount: ZMW {p.promo_discount || 0}</p>
                    </div>
                  </div>
                  <button onClick={() => deletePromo(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketingPromos;
