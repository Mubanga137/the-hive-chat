// Campaign / Promo engine — localStorage-backed for instant persistence.
// Each SME has its own campaign list keyed by sme_id.

export type DiscountType = "percentage" | "fixed";
export type CampaignStatus = "active" | "paused" | "expired";

export interface Campaign {
  id: string;
  sme_id: number;
  campaign_name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // % when percentage, ZMW when fixed
  max_uses: number; // 0 = unlimited
  current_uses: number;
  per_user_limit: number; // 0 = unlimited
  start_date: string; // ISO
  end_date: string; // ISO
  status: CampaignStatus;
  applicable_products: number[]; // empty = all
  redemptions: { user_id: string; order_total: number; discount_applied: number; at: string }[];
  created_at: string;
}

const STORAGE_KEY = (sme_id: number) => `hive_campaigns_${sme_id}`;

export const loadCampaigns = (sme_id: number): Campaign[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(sme_id));
    if (!raw) return [];
    const list: Campaign[] = JSON.parse(raw);
    // auto-expire
    const now = Date.now();
    return list.map((c) => {
      if (c.status === "active" && new Date(c.end_date).getTime() < now) {
        return { ...c, status: "expired" as const };
      }
      return c;
    });
  } catch {
    return [];
  }
};

export const saveCampaigns = (sme_id: number, campaigns: Campaign[]) => {
  localStorage.setItem(STORAGE_KEY(sme_id), JSON.stringify(campaigns));
  window.dispatchEvent(new CustomEvent("hive:campaigns-updated", { detail: { sme_id } }));
};

export const generateCode = (prefix = "HIVE"): string => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}${rand}`;
};

export interface ValidateInput {
  code: string;
  user_id: string;
  order_total: number;
  product_ids?: number[];
  sme_id: number;
}

export interface ValidateResult {
  ok: boolean;
  reason?: string;
  campaign?: Campaign;
  discount?: number;
  newTotal?: number;
}

export const validatePromo = ({ code, user_id, order_total, product_ids = [], sme_id }: ValidateInput): ValidateResult => {
  const list = loadCampaigns(sme_id);
  const c = list.find((x) => x.code.toUpperCase() === code.toUpperCase());
  if (!c) return { ok: false, reason: "Invalid promo code." };
  if (c.status !== "active") return { ok: false, reason: `Code is ${c.status}.` };
  const now = Date.now();
  if (now < new Date(c.start_date).getTime()) return { ok: false, reason: "Code not active yet." };
  if (now > new Date(c.end_date).getTime()) return { ok: false, reason: "Code has expired." };
  if (c.max_uses > 0 && c.current_uses >= c.max_uses) return { ok: false, reason: "Code usage limit reached." };
  if (c.per_user_limit > 0) {
    const used = c.redemptions.filter((r) => r.user_id === user_id).length;
    if (used >= c.per_user_limit) return { ok: false, reason: "You've already used this code." };
  }
  if (c.applicable_products.length > 0 && product_ids.length > 0) {
    const overlap = product_ids.some((p) => c.applicable_products.includes(p));
    if (!overlap) return { ok: false, reason: "Code not valid for these products." };
  }
  const discount =
    c.discount_type === "percentage"
      ? Math.round(order_total * (c.discount_value / 100) * 100) / 100
      : Math.min(c.discount_value, order_total);
  const newTotal = Math.max(0, order_total - discount);
  return { ok: true, campaign: c, discount, newTotal };
};

export const recordRedemption = (sme_id: number, campaign_id: string, user_id: string, order_total: number, discount: number) => {
  const list = loadCampaigns(sme_id);
  const idx = list.findIndex((c) => c.id === campaign_id);
  if (idx < 0) return;
  list[idx].current_uses += 1;
  list[idx].redemptions.push({ user_id, order_total, discount_applied: discount, at: new Date().toISOString() });
  saveCampaigns(sme_id, list);
};
