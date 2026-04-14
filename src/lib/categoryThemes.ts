export interface CategoryTheme {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  /** HSL values without hsl() wrapper, e.g. "210 100% 50%" */
  accentHsl: string;
  /** Tailwind-compatible color classes for buttons */
  btnBg: string;
  btnHover: string;
  btnText: string;
  /** Border accent */
  borderAccent: string;
  /** Pill active classes */
  pillActive: string;
  /** Radial gradient for page wash */
  gradient: string;
  /** Hex color for honeycomb SVG strokes */
  honeycombColor: string;
  /** Badge/tag accent */
  tagBg: string;
}

export const categoryThemes: Record<string, CategoryTheme> = {
  tech: {
    key: "tech",
    emoji: "📱",
    title: "Tech",
    subtitle: "Futuristic gadgets, phones & smart accessories",
    accentHsl: "195 100% 50%",
    btnBg: "bg-cyan-600",
    btnHover: "hover:bg-cyan-700",
    btnText: "text-white",
    borderAccent: "border-cyan-500/40 hover:border-cyan-400",
    pillActive: "bg-cyan-600 text-white border-cyan-600",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.04) 50%, transparent 80%)",
    honeycombColor: "#06B6D4",
    tagBg: "bg-cyan-500/15 text-cyan-300",
  },
  fashion: {
    key: "fashion",
    emoji: "👗",
    title: "Fashion",
    subtitle: "Curated style — haute couture to streetwear",
    accentHsl: "225 60% 45%",
    btnBg: "bg-slate-800",
    btnHover: "hover:bg-slate-900",
    btnText: "text-white",
    borderAccent: "border-slate-500/40 hover:border-slate-400",
    pillActive: "bg-slate-800 text-white border-slate-800",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(30,41,59,0.20) 0%, rgba(30,41,59,0.05) 50%, transparent 80%)",
    honeycombColor: "#475569",
    tagBg: "bg-slate-500/15 text-slate-300",
  },
  food: {
    key: "food",
    emoji: "🍟",
    title: "Food",
    subtitle: "Farm-fresh, organic & local delicacies",
    accentHsl: "25 95% 55%",
    btnBg: "bg-orange-500",
    btnHover: "hover:bg-orange-600",
    btnText: "text-white",
    borderAccent: "border-orange-500/40 hover:border-orange-400",
    pillActive: "bg-orange-500 text-white border-orange-500",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 50%, transparent 80%)",
    honeycombColor: "#F97316",
    tagBg: "bg-orange-500/15 text-orange-300",
  },
  entertainment: {
    key: "entertainment",
    emoji: "🎬",
    title: "Entertainment",
    subtitle: "Cinematic experiences, events & media",
    accentHsl: "270 70% 55%",
    btnBg: "bg-violet-600",
    btnHover: "hover:bg-violet-700",
    btnText: "text-white",
    borderAccent: "border-violet-500/40 hover:border-violet-400",
    pillActive: "bg-violet-600 text-white border-violet-600",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.20) 0%, rgba(139,92,246,0.05) 50%, transparent 80%)",
    honeycombColor: "#8B5CF6",
    tagBg: "bg-violet-500/15 text-violet-300",
  },
  beauty: {
    key: "beauty",
    emoji: "💄",
    title: "Beauty & Cosmetics",
    subtitle: "Premium skincare, haircare & cosmetics",
    accentHsl: "340 65% 65%",
    btnBg: "bg-pink-500",
    btnHover: "hover:bg-pink-600",
    btnText: "text-white",
    borderAccent: "border-pink-400/40 hover:border-pink-300",
    pillActive: "bg-pink-500 text-white border-pink-500",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.16) 0%, rgba(236,72,153,0.04) 50%, transparent 80%)",
    honeycombColor: "#EC4899",
    tagBg: "bg-pink-500/15 text-pink-300",
  },
};
