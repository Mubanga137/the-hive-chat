import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Heart, Users, User, Phone, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HoneycombBackground from "@/components/HoneycombBackground";
import hiveLogo from "@/assets/hive-logo.jpeg";

interface CustomerOnboardingProps {
  userId?: string;
  onComplete: () => void;
  /** When true, steps 1-2 collect name/credentials and create the Supabase account */
  isSignup?: boolean;
}

const tasteCategories = [
  { value: "Fashion", emoji: "👗", label: "Fashion" },
  { value: "Tech", emoji: "📱", label: "Tech" },
  { value: "Entertainment", emoji: "🎬", label: "Entertainment" },
  { value: "Food", emoji: "🍟", label: "Food" },
  { value: "Beauty", emoji: "💄", label: "Beauty & Cosmetics" },
];

const philosophyOptions = [
  { value: "student_creators", label: "Student Creators", emoji: "🎓" },
  { value: "wholesale_kings", label: "Wholesale Kings", emoji: "👑" },
  { value: "premium_boutiques", label: "Premium Boutiques", emoji: "✨" },
  { value: "local_hustlers", label: "Local Hustlers", emoji: "💪" },
];

const slideVariants = {
  enter: { opacity: 0, y: 30 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

const CustomerOnboarding = ({ userId: initialUserId, onComplete, isSignup = false }: CustomerOnboardingProps) => {
  // If signup mode, start at step 1 (name). Otherwise skip to step 3 (taste).
  const startStep = isSignup ? 1 : 3;
  const [step, setStep] = useState(startStep);

  // Step 1-2 fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [userId, setUserId] = useState(initialUserId || "");

  // Step 3-4 fields
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [selectedPhilosophy, setSelectedPhilosophy] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const totalSteps = isSignup ? 5 : 3;
  const displayStep = isSignup ? step : step - 2; // normalize for indicator

  const toggleTaste = (val: string) => {
    setSelectedTastes((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const togglePhilosophy = (val: string) => {
    setSelectedPhilosophy((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleCreateAccount = async () => {
    if (!email || !password || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreatingAccount(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role: "customer" } },
    });

    if (error) {
      toast.error(error.message);
      setCreatingAccount(false);
      return;
    }

    if (authData.user) {
      setUserId(authData.user.id);
      setCreatingAccount(false);
      setStep(3);
    } else {
      toast.error("Signup failed. Please try again.");
      setCreatingAccount(false);
    }
  };

  const handleFinish = async () => {
    if (selectedTastes.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ preferences: [...selectedTastes, ...selectedPhilosophy.map(p => `philosophy:${p}`)] })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save preferences");
    } else {
      toast.success("Welcome to The Hive! 🐝");
      onComplete();
    }
  };

  const inputClass = "w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm transition-all";

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      <HoneycombBackground />
      <div className="relative z-10 w-full max-w-xl">
        <AnimatePresence mode="wait">

          {/* ═══════ STEP 1: THE HOOK — Full Name ═══════ */}
          {step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}
              className="glass-ivory p-10 text-center">
              <img src={hiveLogo} alt="The Hive" className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 mx-auto mb-6 shadow-lg" />
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Establish Your Profile</h1>
              <p className="text-muted-foreground mb-10">Let's start with your name.</p>

              <div className="relative max-w-sm mx-auto mb-8">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!fullName.trim()) { toast.error("Please enter your name"); return; }
                  setStep(2);
                }}
                className="btn-gold px-10 py-4 text-base flex items-center gap-2 mx-auto"
              >
                Next <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ═══════ STEP 2: CREDENTIALS ═══════ */}
          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}
              className="glass-ivory p-10">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2 text-center">Secure Your Access</h1>
              <p className="text-muted-foreground text-center mb-8">Your credentials stay encrypted & private.</p>

              <div className="space-y-4 max-w-sm mx-auto">
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+260 9XX XXX XXX" className={inputClass} />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputClass} />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputClass} />
                </div>
              </div>

              <div className="flex justify-between items-center max-w-sm mx-auto mt-8">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateAccount}
                  disabled={creatingAccount}
                  className="btn-gold px-8 py-3 text-sm flex items-center gap-2"
                >
                  {creatingAccount ? "Creating..." : "Continue"} <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 3: VISUAL TASTE PROFILING ═══════ */}
          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}
              className="glass-ivory p-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-primary" size={24} />
                <h2 className="text-2xl font-display font-bold text-foreground">Visual Taste Profiling</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Tap what catches your eye.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {tasteCategories.map((cat) => {
                  const isSelected = selectedTastes.includes(cat.value);
                  return (
                    <motion.button key={cat.value} whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.96 }}
                      onClick={() => toggleTaste(cat.value)}
                      className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                        isSelected ? "border-primary ring-2 ring-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(179,124,28,0.3)]" : "border-border/50 bg-secondary/20 hover:border-primary/40"
                      }`}>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </motion.div>
                      )}
                      <span className="text-4xl">{cat.emoji}</span>
                      <span className="text-sm font-bold text-foreground">{cat.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                {isSignup && (
                  <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                )}
                {!isSignup && <div />}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(4)}
                  disabled={selectedTastes.length === 0}
                  className="btn-gold px-8 py-3 text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 4: PHILOSOPHY FILTER ═══════ */}
          {step === 4 && (
            <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}
              className="glass-ivory p-8">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="text-primary" size={24} />
                <h2 className="text-2xl font-display font-bold text-foreground">Philosophy Filter</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Who do you want to support?</p>

              <div className="flex flex-col items-center gap-3 mb-8">
                {philosophyOptions.map((opt) => {
                  const isSelected = selectedPhilosophy.includes(opt.value);
                  return (
                    <motion.button key={opt.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => togglePhilosophy(opt.value)}
                      className={`w-full max-w-sm flex items-center gap-3 px-6 py-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(179,124,28,0.3)]"
                          : "border-border/50 bg-secondary/20 text-foreground hover:border-primary/40"
                      }`}>
                      <span className="text-xl">{opt.emoji}</span>
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(5)}
                  className="btn-gold px-8 py-3 text-sm flex items-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 5: THE LAUNCH ═══════ */}
          {step === 5 && (
            <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}
              className="glass-ivory p-10 text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border-2 border-primary/20">
                <Users size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">You're All Set! 🎉</h2>
              <p className="text-muted-foreground mb-10">Your personalized shopping experience awaits.</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFinish}
                disabled={saving}
                className="btn-gold px-14 py-5 text-lg animate-pulse-gold shadow-[0_0_30px_rgba(179,124,28,0.4)]"
              >
                {saving ? "Saving..." : "✅ Finish & Enter The Mall"}
              </motion.button>

              <button onClick={() => setStep(4)} className="block mx-auto mt-5 text-sm text-muted-foreground hover:text-foreground">
                ← Go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: isSignup ? 5 : 3 }, (_, i) => i + 1).map((s) => {
            const actualStep = isSignup ? s : s + 2;
            return (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all ${step >= actualStep ? "bg-primary scale-110" : "bg-border"}`} />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerOnboarding;
