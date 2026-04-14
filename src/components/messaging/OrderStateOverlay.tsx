import { motion, AnimatePresence } from "framer-motion";

interface OrderStateOverlayProps {
  state: "waiting" | "success" | "dispatch" | null;
}

const states = {
  waiting: { icon: "⏳", title: "Waiting for vendor confirmation…", sub: "Your order is being reviewed" },
  success: { icon: "✅", title: "Order Successful!", sub: "Your items are confirmed" },
  dispatch: { icon: "🚚", title: "Dispatch in progress", sub: "Your order is on the way" },
};

const OrderStateOverlay = ({ state }: OrderStateOverlayProps) => (
  <AnimatePresence>
    {state && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(15,26,53,0.45)", backdropFilter: "blur(12px)" }}
      >
        <motion.div
          initial={{ scale: 0.85, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 20 }}
          className="rounded-3xl p-8 text-center border border-border/30 shadow-2xl max-w-xs"
          style={{ backgroundColor: "rgba(255,251,242,0.92)", backdropFilter: "blur(20px)" }}
        >
          <span className="text-5xl block mb-3">{states[state].icon}</span>
          <p className="font-bold text-lg mb-1" style={{ color: "#0F1A35" }}>{states[state].title}</p>
          <p className="text-sm" style={{ color: "#0F1A35", opacity: 0.6 }}>{states[state].sub}</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default OrderStateOverlay;
