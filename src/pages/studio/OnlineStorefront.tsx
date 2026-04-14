import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Image, Save, Eye, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const OnlineStorefront = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      const { data } = await supabase
        .from("sme_stores")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      if (data) {
        setStoreId(data.id);
        setBrandName(data.brand_name || "");
        setDescription((data as any).description || "");
        setBannerUrl((data as any).banner_url || "");
        setWhatsappNumber(data.whatsapp_number || "");
      }
      setLoading(false);
    };
    fetchStore();
  }, [user]);

  const handleSave = async () => {
    if (!storeId) {
      toast.error("No store found. Please contact support.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("sme_stores")
      .update({
        brand_name: brandName,
        description: description,
        banner_url: bannerUrl,
        whatsapp_number: whatsappNumber,
      } as any)
      .eq("id", storeId);

    if (error) toast.error(error.message);
    else toast.success("Storefront updated!");
    setSaving(false);
  };

  const storeUrl = storeId ? `${window.location.origin}/store/${storeId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Store link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Online Storefront</h2>
            <p className="text-sm text-muted-foreground">Customize your public store page</p>
          </div>
        </div>

        {/* Store Link */}
        {storeId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Eye size={18} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Your public store link</p>
              <p className="text-sm font-medium text-foreground truncate">{storeUrl}</p>
            </div>
            <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </motion.div>
        )}

        {/* Banner Preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={`h-40 ${bannerUrl ? '' : 'bg-gradient-to-br from-primary/20 via-secondary to-muted'} relative flex items-center justify-center`}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Image size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">Add a banner URL below</p>
              </div>
            )}
            <div className="absolute bottom-3 left-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                {brandName?.[0] || "S"}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground drop-shadow-lg">{brandName || "Your Brand"}</p>
                <p className="text-xs text-muted-foreground drop-shadow">{description?.slice(0, 50) || "Store description..."}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Brand / Store Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Lusaka Threads"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Store Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your store..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Banner Image URL</label>
            <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">WhatsApp Number</label>
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+260 9XX XXX XXX"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-sm">
            <Save size={16} />
            {saving ? "Saving..." : "Save Storefront Settings"}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OnlineStorefront;
