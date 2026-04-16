import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Tag, Plus, X, Loader2, Trash2, Percent, Pause, Play, Edit3, Copy, Megaphone,
  TrendingUp, Users, DollarSign, Check, Calendar as CalendarIcon, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Campaign, DiscountType, CampaignStatus,
  loadCampaigns, saveCampaigns, generateCode,
} from "@/lib/promoEngine";

interface ProductOption { id: number; product_name: string | null; price: number | null }

const emptyForm = () => ({
  campaign_name: "",
  code: "",
  discount_type: "percentage" as DiscountType,
  discount_value: 10,
  max_uses: 100,
  per_user_limit: 1,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  applicable_products: [] as number[],
});

const MarketingPromos = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Init: fetch SME store + products
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: store } = await supabase
        .from("sme_stores").select("id").eq("owner_user_id", user.id).maybeSingle();
      const sid = store?.id || null;
      setStoreId(sid);
      if (sid) {
        const { data: prods } = await supabase
          .from("hive_catalogue")
          .select("id, product_name, price")
          .eq("sme_id", sid)
          .neq("category", "Promo");
        setProducts((prods as ProductOption[]) || []);
        setCampaigns(loadCampaigns(sid));
      }
      setLoading(false);
    })();
  }, [user]);

  // Listen for cross-tab updates
  useEffect(() => {
    const handler = () => storeId && setCampaigns(loadCampaigns(storeId));
    window.addEventListener("hive:campaigns-updated", handler);
    return () => window.removeEventListener("hive:campaigns-updated", handler);
  }, [storeId]);

  // Sync a campaign's code/discount into hive_catalogue so existing checkout flow can read it
  const syncToCatalogue = async (c: Campaign) => {
    if (!storeId) return;
    const { data: existing } = await supabase
      .from("hive_catalogue").select("id").eq("sme_id", storeId).eq("promo_code", c.code).maybeSingle();
    const flatDiscount = c.discount_type === "fixed" ? c.discount_value : 0;
    if (existing) {
      await supabase.from("hive_catalogue").update({
        product_name: `Promo: ${c.campaign_name}`,
        promo_discount: flatDiscount,
      }).eq("id", existing.id);
    } else {
      await supabase.from("hive_catalogue").insert({
        product_name: `Promo: ${c.campaign_name}`,
        promo_code: c.code,
        promo_discount: flatDiscount,
        sme_id: storeId,
        item_type: "product",
        price: 0, stock_count: 0, category: "Promo",
      });
    }
  };

  const removeFromCatalogue = async (code: string) => {
    if (!storeId) return;
    await supabase.from("hive_catalogue").delete().eq("sme_id", storeId).eq("promo_code", code);
  };

  // Metrics
  const metrics = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active").length;
    const totalRedemptions = campaigns.reduce((s, c) => s + c.current_uses, 0);
    const revenue = campaigns.reduce(
      (s, c) => s + c.redemptions.reduce((a, r) => a + (r.order_total - r.discount_applied), 0),
      0
    );
    const totalIssued = campaigns.reduce((s, c) => s + (c.max_uses || 0), 0);
    const conversion = totalIssued > 0 ? (totalRedemptions / totalIssued) * 100 : 0;
    return { active, totalRedemptions, revenue, conversion };
  }, [campaigns]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setForm({
      campaign_name: c.campaign_name,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses,
      per_user_limit: c.per_user_limit,
      start_date: c.start_date.slice(0, 10),
      end_date: c.end_date.slice(0, 10),
      applicable_products: c.applicable_products,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { toast.error("No store linked."); return; }
    if (!form.campaign_name.trim()) { toast.error("Campaign name required."); return; }
    if (!form.code.trim()) { toast.error("Code required."); return; }
    if (new Date(form.end_date) < new Date(form.start_date)) { toast.error("End date must be after start date."); return; }

    setSubmitting(true);
    const list = loadCampaigns(storeId);
    const code = form.code.trim().toUpperCase();

    // Duplicate code guard
    const dup = list.find((c) => c.code === code && c.id !== editingId);
    if (dup) { toast.error("Code already in use."); setSubmitting(false); return; }

    let updated: Campaign[];
    let target: Campaign;
    if (editingId) {
      target = {
        ...list.find((c) => c.id === editingId)!,
        campaign_name: form.campaign_name.trim(),
        code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        max_uses: Number(form.max_uses) || 0,
        per_user_limit: Number(form.per_user_limit) || 0,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        applicable_products: form.applicable_products,
      };
      updated = list.map((c) => (c.id === editingId ? target : c));
    } else {
      target = {
        id: crypto.randomUUID(),
        sme_id: storeId,
        campaign_name: form.campaign_name.trim(),
        code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        max_uses: Number(form.max_uses) || 0,
        current_uses: 0,
        per_user_limit: Number(form.per_user_limit) || 0,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        status: "active",
        applicable_products: form.applicable_products,
        redemptions: [],
        created_at: new Date().toISOString(),
      };
      updated = [target, ...list];
    }
    saveCampaigns(storeId, updated);
    setCampaigns(updated);
    await syncToCatalogue(target);
    toast.success(editingId ? "Campaign updated!" : "🎉 Campaign launched!");
    setFormOpen(false);
    setSubmitting(false);
  };

  const togglePause = (c: Campaign) => {
    if (!storeId) return;
    const next: CampaignStatus = c.status === "active" ? "paused" : "active";
    if (c.status === "expired") { toast.error("Expired campaigns can't be resumed."); return; }
    const updated = campaigns.map((x) => (x.id === c.id ? { ...x, status: next } : x));
    saveCampaigns(storeId, updated);
    setCampaigns(updated);
    toast.success(next === "active" ? "Campaign resumed." : "Campaign paused.");
  };

  const deleteCampaign = async (c: Campaign) => {
    if (!storeId) return;
    if (!confirm(`Delete campaign "${c.campaign_name}"?`)) return;
    const updated = campaigns.filter((x) => x.id !== c.id);
    saveCampaigns(storeId, updated);
    setCampaigns(updated);
    await removeFromCatalogue(c.code);
    toast.success("Campaign deleted.");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  const statusBadge = (s: CampaignStatus) => {
    const map = {
      active: "bg-emerald-100 text-emerald-700",
      paused: "bg-amber-100 text-amber-700",
      expired: "bg-muted text-muted-foreground",
    } as const;
    return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${map[s]}`}>{s}</span>;
  };

  const fmtDiscount = (c: Campaign) =>
    c.discount_type === "percentage" ? `${c.discount_value}%` : `K${c.discount_value}`;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Megaphone size={22} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Marketing & Campaigns</h2>
              <p className="text-sm text-muted-foreground">Launch, track, and optimize promo campaigns</p>
            </div>
          </div>
          <button onClick={openCreate} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
            <Sparkles size={16} /> Create Campaign
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Campaigns", value: metrics.active, icon: Tag, tint: "bg-emerald-50 text-emerald-700" },
            { label: "Total Redemptions", value: metrics.totalRedemptions, icon: Users, tint: "bg-blue-50 text-blue-700" },
            { label: "Promo Revenue", value: `ZMW ${metrics.revenue.toLocaleString()}`, icon: DollarSign, tint: "bg-amber-50 text-amber-700" },
            { label: "Conversion", value: `${metrics.conversion.toFixed(1)}%`, icon: TrendingUp, tint: "bg-purple-50 text-purple-700" },
          ].map((m) => (
            <div key={m.label} className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.tint}`}>
                  <m.icon size={16} />
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Campaign Form Modal */}
        <AnimatePresence>
          {formOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setFormOpen(false)}
                className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="fixed inset-x-2 top-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[88vh] bg-card border border-border rounded-2xl shadow-2xl z-[90] overflow-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center justify-between sticky top-0 bg-card pb-2 z-10">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {editingId ? "Edit Campaign" : "Create Campaign"}
                    </h3>
                    <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                      <X size={18} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Campaign Name *</label>
                    <input value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                      placeholder="e.g. Black Friday Blast" className={inputCls} required />
                  </div>

                  {/* Discount type */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Discount Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["percentage", "fixed"] as DiscountType[]).map((t) => (
                        <button key={t} type="button" onClick={() => setForm({ ...form, discount_type: t, discount_value: t === "percentage" ? 10 : 20 })}
                          className={`p-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                            form.discount_type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary"
                          }`}>
                          {t === "percentage" ? "Percentage %" : "Fixed ZMW"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.discount_type === "percentage" ? (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 flex justify-between">
                        <span>Discount: {form.discount_value}%</span>
                        <span className="text-muted-foreground">5% – 50%</span>
                      </label>
                      <input type="range" min={5} max={50} value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                        className="w-full accent-primary" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Fixed Amount (ZMW)</label>
                      <input type="number" min={1} value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                        className={inputCls} />
                    </div>
                  )}

                  {/* Code */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Promo Code *</label>
                    <div className="flex gap-2">
                      <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="HIVE20" className={`${inputCls} font-mono`} required />
                      <button type="button" onClick={() => setForm({ ...form, code: generateCode() })}
                        className="px-3 rounded-xl border border-border text-xs font-semibold hover:bg-secondary whitespace-nowrap">
                        Auto
                      </button>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Max Uses (0 = ∞)</label>
                      <input type="number" min={0} value={form.max_uses}
                        onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Per User (0 = ∞)</label>
                      <input type="number" min={0} value={form.per_user_limit}
                        onChange={(e) => setForm({ ...form, per_user_limit: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Start Date</label>
                      <input type="date" value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">End Date</label>
                      <input type="date" value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Applies To {form.applicable_products.length === 0 ? "(All Products)" : `(${form.applicable_products.length} selected)`}
                    </label>
                    <div className="max-h-40 overflow-auto border border-border rounded-xl divide-y divide-border/40">
                      {products.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3 text-center">No products yet.</p>
                      ) : (
                        products.map((p) => {
                          const checked = form.applicable_products.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/30 cursor-pointer text-sm">
                              <input type="checkbox" checked={checked} onChange={(e) => {
                                setForm({
                                  ...form,
                                  applicable_products: e.target.checked
                                    ? [...form.applicable_products, p.id]
                                    : form.applicable_products.filter((id) => id !== p.id),
                                });
                              }} className="accent-primary" />
                              <span className="flex-1 truncate text-foreground">{p.product_name || `#${p.id}`}</span>
                              <span className="text-xs text-muted-foreground">K{p.price ?? 0}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={submitting}
                    className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingId ? "Update Campaign" : "Launch Campaign")}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Campaign list */}
        <div>
          <h3 className="font-display font-bold text-foreground mb-3">All Campaigns</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl py-12 text-center">
              <Percent size={32} className="mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No campaigns yet — launch your first one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {campaigns.map((c, i) => {
                const usagePct = c.max_uses > 0 ? Math.min(100, (c.current_uses / c.max_uses) * 100) : 0;
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-display font-bold text-foreground truncate">{c.campaign_name}</h4>
                          {statusBadge(c.status)}
                        </div>
                        <button onClick={() => copyCode(c.code)}
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20">
                          {c.code} <Copy size={11} />
                        </button>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-display font-bold text-primary">{fmtDiscount(c)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{c.discount_type === "percentage" ? "off" : "discount"}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Usage</span>
                        <span>{c.current_uses} / {c.max_uses || "∞"}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${usagePct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon size={12} /> Until {new Date(c.end_date).toLocaleDateString()}</span>
                      <span>{c.applicable_products.length === 0 ? "All products" : `${c.applicable_products.length} products`}</span>
                    </div>

                    <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                      <button onClick={() => togglePause(c)} disabled={c.status === "expired"}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg hover:bg-secondary disabled:opacity-40 text-foreground">
                        {c.status === "active" ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg hover:bg-secondary text-foreground">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => deleteCampaign(c)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketingPromos;
