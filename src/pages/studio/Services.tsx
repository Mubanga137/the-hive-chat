import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Briefcase, Plus, Clock, MapPin, Edit, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ServiceItem {
  id: number;
  product_name: string | null;
  price: number | null;
  category: string | null;
  fulfillment_type: string | null;
  stock_count: number | null;
}

const Services = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [fulfillment, setFulfillment] = useState("in-store");

  const resetForm = () => { setName(""); setPrice(""); setCategory(""); setFulfillment("in-store"); setEditingId(null); };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: store } = await supabase.from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
    const sid = store?.id || null;
    setStoreId(sid);
    if (sid) {
      const { data } = await supabase.from("hive_catalogue").select("*").eq("sme_id", sid).eq("item_type", "service").order("created_at", { ascending: false });
      setServices((data as ServiceItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { toast.error("No store linked."); return; }
    if (!name.trim()) { toast.error("Service name is required."); return; }
    setSubmitting(true);
    const payload = {
      product_name: name.trim(),
      price: parseFloat(price) || 0,
      category: category || null,
      fulfillment_type: fulfillment,
      sme_id: storeId,
      item_type: "service",
      stock_count: 999,
    };
    if (editingId) {
      const { error } = await supabase.from("hive_catalogue").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); } else { toast.success("Service updated!"); }
    } else {
      const { error } = await supabase.from("hive_catalogue").insert(payload);
      if (error) { toast.error(error.message); } else { toast.success("Service added!"); }
    }
    setSubmitting(false);
    resetForm();
    setFormOpen(false);
    fetchData();
  };

  const handleEdit = (item: ServiceItem) => {
    setEditingId(item.id);
    setName(item.product_name || "");
    setPrice(String(item.price || ""));
    setCategory(item.category || "");
    setFulfillment(item.fulfillment_type || "in-store");
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Service removed.");
    fetchData();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Services</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your service offerings and bookings</p>
          </div>
          <button onClick={() => { resetForm(); setFormOpen(true); }} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> Add Service
          </button>
        </div>

        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] bg-card border border-border rounded-2xl shadow-2xl z-[90] overflow-auto max-h-[90vh]">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-foreground">{editingId ? "Edit Service" : "Add Service"}</h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Service name *" className={inputClass} required />
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (ZMW)" type="number" step="0.01" className={inputClass} required />
                  <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Beauty, Tailoring)" className={inputClass} />
                  <select value={fulfillment} onChange={e => setFulfillment(e.target.value)} className={inputClass}>
                    <option value="in-store">In-store</option>
                    <option value="mobile">Mobile (on-location)</option>
                    <option value="express">Express</option>
                  </select>
                  <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? "Update Service" : "Add Service"}
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
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No services yet. Click "Add Service" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase size={18} className="text-primary" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{service.product_name || "Unnamed"}</h3>
                  <p className="text-lg font-bold text-foreground mt-1">ZMW {service.price || 0}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={12} /> {service.category || "General"}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {service.fulfillment_type || "In-store"}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/30">
                  <button onClick={() => handleEdit(service)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors">
                    <Edit size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-destructive border border-destructive/30 rounded-lg py-1.5 hover:bg-destructive/5 transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Services;
