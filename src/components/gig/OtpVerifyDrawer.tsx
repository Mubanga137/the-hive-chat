import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OtpVerifyDrawerProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  onVerified: () => void;
}

const OtpVerifyDrawer = ({ open, onClose, orderId, onVerified }: OtpVerifyDrawerProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 4) {
      toast.error("Enter the full 4-digit code.");
      return;
    }
    setVerifying(true);

    // Fetch the order's otp_code
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("otp_code")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      toast.error("Could not fetch order details.");
      setVerifying(false);
      return;
    }

    if ((order as any).otp_code !== code) {
      toast.error("❌ Incorrect code. Ask the customer for the correct delivery code.");
      setVerifying(false);
      return;
    }

    // Match — update status to delivered
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: "delivered" } as any)
      .eq("id", orderId);

    if (updateErr) {
      toast.error(updateErr.message);
    } else {
      toast.success("✅ Handoff verified! Order delivered & payout initiated.");
      onVerified();
      onClose();
    }
    setVerifying(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[210] rounded-t-2xl p-6"
            style={{ background: "hsl(39,100%,97%)", borderTop: "2px solid hsl(38,73%,40%,0.3)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock size={20} style={{ color: "hsl(38,73%,40%)" }} />
                <h3 className="text-lg font-bold" style={{ color: "hsl(220,55%,13%)" }}>Verify Handoff</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5">
                <X size={18} style={{ color: "hsl(220,20%,46%)" }} />
              </button>
            </div>

            <p className="text-sm mb-5" style={{ color: "hsl(220,20%,46%)" }}>
              Enter the 4-digit delivery code provided by the customer to complete the handoff.
            </p>

            <div className="flex justify-center mb-6">
              <InputOTP maxLength={4} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-xl font-bold" />
                  <InputOTPSlot index={1} className="w-14 h-14 text-xl font-bold" />
                  <InputOTPSlot index={2} className="w-14 h-14 text-xl font-bold" />
                  <InputOTPSlot index={3} className="w-14 h-14 text-xl font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 4}
              className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "hsl(38,73%,40%)", color: "hsl(39,100%,97%)" }}
            >
              {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "🔒 Verify & Complete Delivery"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OtpVerifyDrawer;
