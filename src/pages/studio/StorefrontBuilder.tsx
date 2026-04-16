import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Upload, Rocket, Image as ImageIcon, Check, Loader2, Copy, ExternalLink, Plus, Edit, Trash2, Package, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import OfferFormModal, { OfferDraft, ItemType } from "@/components/storefront/OfferFormModal";

interface OfferRow {
  id: number;
  product_name: string | null;
  price: number | null;
  image_url: string | null;
  item_type: string | null;
  description?: string | null;
  duration?: string | null;
  location_type?: string | null;
  category?: string | null;
  stock_count?: number | null;
}

const StorefrontBuilder = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [copied, setCopied] = useState(false);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [filter, setFilter] = useState<"all" | "products" | "services">("all");
  const [offerOpen, setOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferDraft | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchOffers = useCallback(async (sid: number) => {
    const { data } = await supabase.from("hive_catalogue").select("*").eq("sme_id", sid).order("created_at", { ascending: false });
    setOffers((data as OfferRow[]) || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("sme_stores").select("*").eq("owner_user_id", user.id).maybeSingle();
      if (data) {
        const d = data as any;
        setStoreId(d.id);
        setBrandName(d.brand_name || "");
        setDescription(d.description || "");
        setBannerUrl(d.banner_url || "");
        setLogoUrl(d.logo_url || "");
        setWhatsappNumber(d.whatsapp_number || "");
        setStoreSlug(d.store_slug || slugify(d.brand_name || `store-${d.id}`));
        fetchOffers(d.id);
      }
    })();
  }, [user, fetchOffers]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hive_media").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("hive_media").getPublicUrl(path);
    return data.publicUrl;
  };

  const persistField = async (patch: Record<string, any>) => {
    if (!storeId) return;
    await supabase.from("sme_stores").update(patch as any).eq("id", storeId);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploadingLogo(true);
    const url = await uploadFile(f, "logo");
    if (url) {
      setLogoUrl(url);
      await persistField({ logo_url: url });
      toast.success("Logo saved!");
    }
    setUploadingLogo(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploadingBanner(true);
    const url = await uploadFile(f, "banner");
    if (url) {
      setBannerUrl(url);
      await persistField({ banner_url: url });
      toast.success("Banner saved!");
    }
    setUploadingBanner(false);
  };

  const handleSave = async () => {
    if (!storeId) { toast.error("No store found."); return; }
    setSaving(true);
    const finalSlug = slugify(storeSlug || brandName) || `store-${storeId}`;
    const { error } = await supabase.from("sme_stores").update({
      brand_name: brandName,
      description,
      banner_url: bannerUrl,
      logo_url: logoUrl,
      whatsapp_number: whatsappNumber,
      store_slug: finalSlug,
    } as any).eq("id", storeId);
    if (error) {
      // Likely unique-slug clash
      if (error.message.toLowerCase().includes("unique") || error.message.toLowerCase().includes("duplicate")) {
        toast.error("That store URL is already taken. Try another.");
      } else toast.error(error.message);
    } else {
      setStoreSlug(finalSlug);
      toast.success("Storefront saved!");
    }
    setSaving(false);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    await handleSave();
    setLaunching(false);
    if (storeSlug) window.open(`/store/${storeSlug}`, "_blank");
  };

  const handleEditOffer = (o: OfferRow) => {
    const t = (o.item_type === "service" ? "service" : (o.item_type === "digital" ? "digital" : "physical")) as ItemType;
    setEditingOffer({
      id: o.id,
      name: o.product_name || "",
      price: String(o.price ?? ""),
      description: o.description || "",
      image_url: o.image_url || "",
      item_type: t,
      stock: String(o.stock_count ?? ""),
      duration: o.duration || "",
      location_type: (o.location_type as any) || "",
      category: o.category || "",
    });
    setOfferOpen(true);
  };

  const handleDeleteOffer = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Offer removed.");
    if (storeId) fetchOffers(storeId);
  };

  const storeUrl = storeSlug ? `${window.location.origin}/store/${storeSlug}` : "";

  const copyLink = async () => {
    if (!storeUrl) return;
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 1800);
  };

  const filtered = offers.filter((o) =>
    filter === "all" ? true : filter === "services" ? o.item_type === "service" : o.item_type !== "service"
  );

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Storefront Builder</h2>
              <p className="text-sm text-muted-foreground">Design, manage offers, and launch your store</p>
            </div>
          </div>
          <button onClick={() => { setEditingOffer(null); setOfferOpen(true); }} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={16} /> Add Offer
          </button>
        </div>

        {/* Public link card */}
        {storeId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Your public store link</p>
              <p className="text-sm font-medium text-foreground truncate">{storeUrl}</p>
            </div>
            <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <a href={storeUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
              <ExternalLink size={14} /> Open Store
            </a>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Identity controls */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 space-y-5 h-fit">
            {/* Logo */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Logo</label>
              <div className="flex items-center gap-4">
                <div onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                  {uploadingLogo ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> :
                    logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> :
                    <Upload size={20} className="text-muted-foreground/40" />}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <p className="text-xs text-muted-foreground">Click to upload your logo</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Name</label>
              <input value={brandName} onChange={(e) => { setBrandName(e.target.value); if (!storeSlug) setStoreSlug(slugify(e.target.value)); }}
                placeholder="e.g. Lusaka Threads" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Store URL slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">/store/</span>
                <input value={storeSlug} onChange={(e) => setStoreSlug(slugify(e.target.value))}
                  placeholder="lusaka-threads" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your store..." rows={3} className={`${inputClass} resize-none`} />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Banner Image</label>
              <div onClick={() => bannerInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                {uploadingBanner ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> :
                  bannerUrl ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" /> :
                  <div className="text-center"><ImageIcon size={24} className="mx-auto text-muted-foreground/40" /><p className="text-xs text-muted-foreground mt-1">Upload banner</p></div>}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">WhatsApp Number</label>
              <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+260 9XX XXX XXX" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSave} disabled={saving}
                className="py-3 text-sm flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold hover:bg-secondary transition-colors">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleLaunch} disabled={launching}
                className="btn-gold py-3 text-sm flex items-center justify-center gap-2">
                {launching ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                🚀 Launch Store
              </button>
            </div>
          </motion.div>

          {/* RIGHT: Offers list */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-foreground">Your Offers ({offers.length})</h3>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
                {(["all", "products", "services"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors ${
                      filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}>{f}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-3">No offers yet.</p>
                <button onClick={() => { setEditingOffer(null); setOfferOpen(true); }}
                  className="btn-gold inline-flex items-center gap-2 px-4 py-2 text-xs">
                  <Plus size={14} /> Create your first offer
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[680px] overflow-auto pr-1">
                <AnimatePresence>
                  {filtered.map((o) => {
                    const isService = o.item_type === "service";
                    return (
                      <motion.div key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="border border-border rounded-xl overflow-hidden bg-background group">
                        <div className="h-24 bg-secondary/30 relative">
                          {o.image_url ? (
                            <img src={o.image_url} alt={o.product_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isService ? <Briefcase size={22} className="text-muted-foreground/40" /> : <Package size={22} className="text-muted-foreground/40" />}
                            </div>
                          )}
                          <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-foreground/70 text-background backdrop-blur">
                            {isService ? "Service" : (o.item_type === "digital" ? "Digital" : "Physical")}
                          </span>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">{o.product_name || "Unnamed"}</p>
                          <p className="text-sm font-bold text-primary">
                            {isService ? "From " : ""}ZMW {o.price ?? 0}
                          </p>
                          <div className="flex gap-1.5 pt-1">
                            <button onClick={() => handleEditOffer(o)} className="flex-1 text-[10px] font-semibold text-primary border border-primary/30 rounded-md py-1 hover:bg-primary/5 inline-flex items-center justify-center gap-1">
                              <Edit size={10} /> Edit
                            </button>
                            <button onClick={() => handleDeleteOffer(o.id)} className="flex-1 text-[10px] font-semibold text-destructive border border-destructive/30 rounded-md py-1 hover:bg-destructive/5 inline-flex items-center justify-center gap-1">
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <OfferFormModal
        open={offerOpen}
        onOpenChange={setOfferOpen}
        smeId={storeId}
        initial={editingOffer}
        onSaved={() => storeId && fetchOffers(storeId)}
      />
    </DashboardLayout>
  );
};

export default StorefrontBuilder;
