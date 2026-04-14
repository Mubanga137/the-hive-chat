import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Upload, Eye, Rocket, Image, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const StorefrontBuilder = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [autoList, setAutoList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [products, setProducts] = useState<{ id: number; product_name: string | null; price: number | null; image_url: string | null }[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("sme_stores").select("*").eq("owner_user_id", user.id).maybeSingle();
      if (data) {
        setStoreId(data.id);
        setBrandName(data.brand_name || "");
        setDescription(data.description || "");
        setBannerUrl(data.banner_url || "");
        setWhatsappNumber(data.whatsapp_number || "");
        // Fetch products for preview
        const { data: prods } = await supabase.from("hive_catalogue").select("id, product_name, price, image_url").eq("sme_id", data.id).limit(6);
        setProducts(prods || []);
      }
    };
    fetch();
  }, [user]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hive_media").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("hive_media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadFile(f, "logo");
    if (url) { setLogoUrl(url); toast.success("Logo uploaded!"); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadFile(f, "banner");
    if (url) { setBannerUrl(url); toast.success("Banner uploaded!"); }
  };

  const handleSave = async () => {
    if (!storeId) { toast.error("No store found."); return; }
    setSaving(true);
    const { error } = await supabase.from("sme_stores").update({
      brand_name: brandName,
      description,
      banner_url: bannerUrl,
      whatsapp_number: whatsappNumber,
    } as any).eq("id", storeId);
    if (error) toast.error(error.message);
    else toast.success("Storefront saved!");
    setSaving(false);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    await handleSave();
    toast.success("🚀 Your Online Store is LIVE!");
    setLaunching(false);
    window.open(`/store/${storeId}`, "_blank");
  };

  const storeSlug = brandName ? brandName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : "my-store";
  const storeUrl = storeId ? `${window.location.origin}/store/${storeId}` : "";

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Storefront Builder</h2>
            <p className="text-sm text-muted-foreground">Design and launch your online store</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Controls */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6 space-y-5">

              {/* Logo Upload */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Logo</label>
                <div className="flex items-center gap-4">
                  <div onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} className="text-muted-foreground/40" />
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-xs text-muted-foreground">Click to upload your logo</p>
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Name</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Lusaka Threads" className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">URL: /store/{storeSlug}</p>
              </div>

              {/* Caption */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Caption / Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell customers about your store..." rows={3} className={inputClass + " resize-none"} />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Banner Image</label>
                <div onClick={() => bannerInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center"><Image size={24} className="mx-auto text-muted-foreground/40" /><p className="text-xs text-muted-foreground mt-1">Upload banner</p></div>
                  )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">WhatsApp Number</label>
                <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+260 9XX XXX XXX" className={inputClass} />
              </div>

              {/* Auto-list toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">Auto-list Inventory</p>
                  <p className="text-[10px] text-muted-foreground">Automatically show all products on your store</p>
                </div>
                <button onClick={() => setAutoList(!autoList)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${autoList ? "bg-primary" : "bg-secondary"}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow transition-transform ${autoList ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {/* Save / Launch */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="py-3 text-sm flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold hover:bg-secondary transition-colors">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button onClick={handleLaunch} disabled={launching}
                  className="btn-gold py-3 text-sm flex items-center justify-center gap-2">
                  {launching ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                  {launching ? "Launching..." : "🚀 LAUNCH STORE"}
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Live Preview */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="sticky top-24">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary/50 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                <span className="text-[10px] text-muted-foreground ml-2 truncate">{storeUrl || "your-store-url"}</span>
              </div>

              {/* Preview banner */}
              <div className={`h-32 ${bannerUrl ? "" : "bg-gradient-to-br from-primary/20 via-secondary to-muted"} relative`}>
                {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
                <div className="absolute bottom-3 left-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{brandName?.[0] || "S"}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground drop-shadow-lg">{brandName || "Your Brand"}</p>
                    <p className="text-[10px] text-muted-foreground drop-shadow">{description?.slice(0, 50) || "Store description..."}</p>
                  </div>
                </div>
              </div>

              {/* Preview products grid */}
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Products</p>
                <div className="grid grid-cols-2 gap-3">
                  {products.length > 0 ? products.slice(0, 4).map(p => (
                    <div key={p.id} className="border border-border rounded-xl overflow-hidden bg-background">
                      <div className="h-20 bg-secondary/30 flex items-center justify-center">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Image size={20} className="text-muted-foreground/30" />}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-foreground truncate">{p.product_name}</p>
                        <p className="text-[10px] text-primary font-bold">ZMW {p.price || 0}</p>
                      </div>
                    </div>
                  )) : (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="border border-border rounded-xl overflow-hidden bg-background">
                        <div className="h-20 bg-secondary/20 animate-pulse" />
                        <div className="p-2 space-y-1">
                          <div className="h-2 bg-secondary/40 rounded animate-pulse w-3/4" />
                          <div className="h-2 bg-secondary/40 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StorefrontBuilder;
