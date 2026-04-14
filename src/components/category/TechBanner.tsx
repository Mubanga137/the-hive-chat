import { motion } from "framer-motion";
import { Cpu, Zap, Wifi } from "lucide-react";

const TechBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-cyan-950/60 p-6 md:p-8 backdrop-blur-sm overflow-hidden relative"
  >
    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />
    <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl" />

    <div className="relative z-10 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-cyan-400">
        <Cpu size={28} />
        <Zap size={20} />
        <Wifi size={20} />
      </div>
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-lg md:text-xl font-display font-bold text-white">
          📱 New Specs & Drops
        </h3>
        <p className="text-cyan-300/70 text-sm mt-1">
          Fresh tech arrivals — latest specs, unbeatable prices, delivered fast.
        </p>
      </div>
      <motion.span
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider"
      >
        ⚡ Just Landed
      </motion.span>
    </div>
  </motion.div>
);

export default TechBanner;
