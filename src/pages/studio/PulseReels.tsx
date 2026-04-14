import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Video, Plus, Eye, Heart, X, Loader2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReelItem {
  id: number;
  product_name: string | null;
  digital_vault: string | null;
  created_at: string;
  category: string | null;
}

const PulseReels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const fetchReels = async () => {
    if (!user) return;
    setLoading(true);

    const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
    const sid = store?.id || null;
    setStoreId(sid);

    if (sid) {
      const { data } = await supabase
        .from("hive_catalogue")
        .select("id, product_name, digital_vault, created_at, category")
        .eq("sme_id", sid)
        .not("digital_vault", "is", null)
        .order("created_at", { ascending: false });

      setReels((data as ReelItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReels(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { toast.error("No store linked."); return; }
    if (!title.trim() || !videoUrl.trim()) { toast.error("Title and video URL are required."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("hive_catalogue").insert({
      product_name: title.trim(),
      digital_vault: videoUrl.trim(),
      sme_id: storeId,
      item_type: "product",
      category: "Entertainment",
      price: 0,
      stock_count: 999,
    });

    if (error) { toast.error(error.message); } else { toast.success("Reel published!"); }
    setSubmitting(false);
    setTitle("");
    setVideoUrl("");
    setFormOpen(false);
    fetchReels();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Pulse Reels</h1>
            <p className="text-sm text-muted-foreground mt-1">Create short video content to engage customers</p>
          </div>
          <button onClick={() => setFormOpen(true)} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> New Reel
          </button>
        </div>

        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] bg-card border border-border rounded-2xl shadow-2xl z-[90]">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-foreground">New Reel</h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reel title *" className={inputClass} required />
                  <div>
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video URL (MP4 link) *" className={inputClass} required />
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Upload size={10} /> Paste a direct video URL (e.g., from cloud storage)</p>
                  </div>
                  <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : "Publish Reel"}
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
        ) : reels.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Video size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reels yet. Click "New Reel" to create your first video.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reels.map((reel, i) => (
              <motion.div key={reel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
                <div className="aspect-[9/16] max-h-48 bg-secondary/30 flex items-center justify-center relative overflow-hidden">
                  {reel.digital_vault ? (
                    <video src={reel.digital_vault} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <Video size={40} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground truncate">{reel.product_name || "Untitled"}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">published</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye size={12} /> —</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> —</span>
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

export default PulseReels;
