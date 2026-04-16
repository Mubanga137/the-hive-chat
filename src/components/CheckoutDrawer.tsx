import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Minus, Plus, Wallet, Tag, Check, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { validatePromo, recordRedemption } from "@/lib/promoEngine";

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

const CheckoutDrawer = ({ open, onOpenChange, item }: CheckoutDrawerProps) => {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "cod">("wallet");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; campaign_id: string } | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const { user, profile } = useAuth();

  if (!item) return null;

  const isService = item.item_type === "service";
  const subtotal = (item.price || 0) * (isService ? 1 : quantity);
  const total = Math.max(0, subtotal - (appliedPromo?.discount ?? 0));
  const walletBalance = profile?.zmw_balance ?? 0;
  const canPayWallet = walletBalance >= total;

  const applyPromo = () => {
    if (!user) { toast.error("Log in to use promo codes."); return; }
    if (!item.sme_id) { toast.error("Promo not available for this item."); return; }
    const res = validatePromo({
      code: promoInput.trim(),
      user_id: user.id,
      order_total: subtotal,
      product_ids: item.id ? [item.id] : [],
      sme_id: item.sme_id,
    });
    if (!res.ok) { toast.error(res.reason || "Invalid code"); return; }
    setAppliedPromo({ code: res.campaign!.code, discount: res.discount!, campaign_id: res.campaign!.id });
    toast.success(`Saved ZMW ${res.discount!.toFixed(2)}!`);
  };

  const removePromo = () => { setAppliedPromo(null); setPromoInput(""); };

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Please log in to place an order.");
      return;
    }
    if (isService && !bookingDate) {
      toast.error("Pick a date for your booking.");
      return;
    }
    setSubmitting(true);

    if (payMethod === "wallet") {
      // Verify wallet balance
      const { data: prof } = await supabase.from("profiles").select("zmw_balance").eq("user_id", user.id).maybeSingle();
      const currentBalance = prof?.zmw_balance ?? 0;
      if (currentBalance < total) {
        toast.error("Insufficient wallet balance. Top up your wallet first.");
        setSubmitting(false);
        return;
      }

      // Deduct from wallet
      const newBalance = currentBalance - total;
      const { error: walletErr } = await supabase
        .from("profiles")
        .update({ zmw_balance: newBalance } as any)
        .eq("user_id", user.id);

      if (walletErr) {
        toast.error("Failed to deduct from wallet: " + walletErr.message);
        setSubmitting(false);
        return;
      }

      // Record ledger entry
      await supabase.from("hive_ledger").insert({
        user_id: user.id,
        amount: total,
        transaction_type: "purchase",
      });
    }

    // Create order
    const systemFee = Math.round(total * 0.05 * 100) / 100;
    const notes = isService
      ? `Booking on ${bookingDate}${bookingNotes ? " — " + bookingNotes : ""}`
      : null;
    const { error } = await supabase.from("orders").insert({
      buyer_id: user.id,
      item_id: item.id || null,
      total_price: total,
      status: "processing",
      sme_id: item.sme_id || null,
      system_fee: systemFee,
      hive_skim_amount: systemFee,
      ...(notes ? { notes } as any : {}),
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      // ── 0.20 Pulse Credit Tollbooth: deduct from SME's prepaid_units ──
      if (item.sme_id) {
        const { data: smeData } = await supabase
          .from("sme_stores")
          .select("prepaid_units")
          .eq("id", item.sme_id)
          .maybeSingle();

        if (smeData) {
          const currentUnits = (smeData as any).prepaid_units ?? 0;
          const newUnits = Math.round((currentUnits - 0.20) * 100) / 100;
          await supabase
            .from("sme_stores")
            .update({ prepaid_units: newUnits } as any)
            .eq("id", item.sme_id);
        }
      }

      // Record promo redemption
      if (appliedPromo && item.sme_id && user) {
        recordRedemption(item.sme_id, appliedPromo.campaign_id, user.id, subtotal, appliedPromo.discount);
      }
      toast.success("🎉 Deal locked! Your order has been placed.");
      onOpenChange(false);
      setQuantity(1);
      setAppliedPromo(null);
      setPromoInput("");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[80]" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-card rounded-t-2xl border-t border-primary/20 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="p-5">
              <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4" />
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-display font-bold text-foreground">{isService ? "Book This Service" : "Lock This Deal"}</h3>
                <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-secondary mb-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-2xl">🛍️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">{item.store_name}</p>
                  <p className="text-primary font-bold mt-1">ZMW {item.price}</p>
                </div>
              </div>

              {isService ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5"><Calendar size={12} /> Booking Date</label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5"><FileText size={12} /> Notes (optional)</label>
                    <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                      rows={2} placeholder="Anything the provider should know..."
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  {(item.duration || item.location_type) && (
                    <p className="text-[11px] text-muted-foreground">
                      {item.duration && <>Duration: {item.duration} · </>}
                      {item.location_type === "at_customer" && "At your location"}
                      {item.location_type === "at_sme" && "At the provider's location"}
                      {item.location_type === "remote" && "Remote / online"}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Payment method */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPayMethod("wallet")}
                    className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors ${
                      payMethod === "wallet" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary"
                    }`}>
                    <Wallet size={16} /> Wallet
                  </button>
                  <button onClick={() => setPayMethod("cod")}
                    className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors ${
                      payMethod === "cod" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary"
                    }`}>
                    💵 Cash on Delivery
                  </button>
                </div>
                {payMethod === "wallet" && (
                  <p className={`text-xs mt-2 ${canPayWallet ? "text-emerald-500" : "text-destructive"}`}>
                    Wallet balance: ZMW {walletBalance.toLocaleString()} {!canPayWallet && "— Insufficient funds"}
                  </p>
                )}
              </div>

              {/* Promo code */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5"><Tag size={14} /> Promo Code</p>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <Check size={14} /> {appliedPromo.code} applied (–ZMW {appliedPromo.discount.toFixed(2)})
                    </span>
                    <button onClick={removePromo} className="text-xs text-emerald-700 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 text-sm rounded-xl bg-secondary/50 border border-border font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <button onClick={applyPromo} className="px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4 pb-4 border-b border-border space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>ZMW {subtotal.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span><span>– ZMW {appliedPromo.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">ZMW {total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleConfirm} disabled={submitting || (payMethod === "wallet" && !canPayWallet)}
                className="btn-gold w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50">
                <Zap size={16} />
                {submitting ? "Processing..." : "CONFIRM & LOCK DEAL"}
              </button>

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                By locking this deal you agree to The Hive's terms of service.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutDrawer;
