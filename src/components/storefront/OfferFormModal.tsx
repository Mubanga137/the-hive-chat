import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Package, Briefcase, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ItemType = "physical" | "digital" | "service";

export interface OfferDraft {
  id?: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
  item_type: ItemType;
  stock?: string;
  duration?: string;
  location_type?: "at_customer" | "at_sme" | "remote" | "";
  category?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  smeId: number | null;
  initial?: OfferDraft | null;
  onSaved: () => void;
}

const emptyDraft: OfferDraft = {
  name: "",
  price: "",
  description: "",
  image_url: "",
  item_type: "physical",
  stock: "",
  duration: "",
  location_type: "",
  category: "",
};

const typeMeta: Record<ItemType, { label: string; icon: any; help: string }> = {
  physical: { label: "Physical Product", icon: Package, help: "Tangible goods you ship or hand over." },
  digital: { label: "Digital Product", icon: Cloud, help: "Files, downloads, codes — delivered online." },
  service: { label: "Service", icon: Briefcase, help: "Bookings: appointments, jobs, gigs." },
};

const OfferFormModal = ({ open, onOpenChange, smeId, initial, onSaved }: Props) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<OfferDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setDraft(initial ?? emptyDraft);
  }, [open, initial]);

  const set = <K extends keyof OfferDraft>(k: K, v: OfferDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const uploadImage = async (file: File) => {
    if (!user) { toast.error("Sign in to upload images."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/offer_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hive_media").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data } = supabase.storage.from("hive_media").getPublicUrl(path);
      set("image_url", data.publicUrl);
      toast.success("Image uploaded");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smeId) { toast.error("No store linked. Save your storefront first."); return; }
    if (!draft.name.trim()) { toast.error("Name is required."); return; }
    setSubmitting(true);

    const payload: any = {
      product_name: draft.name.trim(),
      price: parseFloat(draft.price) || 0,
      description: draft.description || null,
      image_url: draft.image_url || null,
      item_type: draft.item_type,
      sme_id: smeId,
      category: draft.category || null,
    };

    if (draft.item_type === "service") {
      payload.duration = draft.duration || null;
      payload.location_type = draft.location_type || null;
      payload.fulfillment_type = draft.location_type === "at_customer" ? "mobile" : "in-store";
      payload.stock_count = 999;
    } else {
      payload.stock_count = draft.stock ? parseInt(draft.stock) : 0;
    }

    const op = draft.id
      ? supabase.from("hive_catalogue").update(payload).eq("id", draft.id)
      : supabase.from("hive_catalogue").insert(payload);

    const { error } = await op;
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(draft.id ? "Offer updated!" : "Offer created!");
      onSaved();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  const isService = draft.item_type === "service";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] bg-card border border-border rounded-2xl shadow-2xl z-[90] overflow-auto max-h-[92vh]">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-foreground">
                  {draft.id ? "Edit Offer" : "Create Offer"}
                </h3>
                <button type="button" onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* Type selector */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Offer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(typeMeta) as ItemType[]).map((t) => {
                    const Icon = typeMeta[t].icon;
                    const active = draft.item_type === t;
                    return (
                      <button key={t} type="button" onClick={() => set("item_type", t)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary"
                        }`}>
                        <Icon size={18} />
                        {typeMeta[t].label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{typeMeta[draft.item_type].help}</p>
              </div>

              <input value={draft.name} onChange={(e) => set("name", e.target.value)}
                placeholder={isService ? "Service name *" : "Product name *"} className={inputClass} required />

              <div className="grid grid-cols-2 gap-3">
                <input value={draft.price} onChange={(e) => set("price", e.target.value)}
                  placeholder={isService ? "Starting from (ZMW)" : "Price (ZMW)"}
                  type="number" step="0.01" className={inputClass} required />
                {!isService && (
                  <input value={draft.stock || ""} onChange={(e) => set("stock", e.target.value)}
                    placeholder="Stock (optional)" type="number" className={inputClass} />
                )}
                {isService && (
                  <input value={draft.duration || ""} onChange={(e) => set("duration", e.target.value)}
                    placeholder="Duration (e.g. 1h, 30 min)" className={inputClass} />
                )}
              </div>

              {isService && (
                <select value={draft.location_type || ""} onChange={(e) => set("location_type", e.target.value as any)}
                  className={inputClass}>
                  <option value="">Where is the service delivered?</option>
                  <option value="at_customer">At the customer</option>
                  <option value="at_sme">At my location</option>
                  <option value="remote">Remote / online</option>
                </select>
              )}

              <input value={draft.category || ""} onChange={(e) => set("category", e.target.value)}
                placeholder="Category (e.g. Fashion, Beauty, Tech)" className={inputClass} />

              <textarea value={draft.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Description" rows={3} className={`${inputClass} resize-none`} />

              {/* Image */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Image</label>
                <div className="flex items-center gap-3">
                  <div onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden transition-colors shrink-0">
                    {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> :
                      draft.image_url ? <img src={draft.image_url} alt="" className="w-full h-full object-cover" /> :
                      <Upload size={20} className="text-muted-foreground/40" />}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  <p className="text-xs text-muted-foreground">
                    {draft.image_url ? "Click to replace" : "Click to upload an image (PNG, JPG)"}
                  </p>
                </div>
              </div>

              <button type="submit" disabled={submitting || uploading}
                className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : draft.id ? "Update Offer" : "Create Offer"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OfferFormModal;
