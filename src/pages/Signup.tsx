import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  User, Phone, Lock, Mail, UserPlus, ShoppingBag, Store, Warehouse, Bike,
  ChevronDown
} from "lucide-react";
import hiveLogo from "@/assets/hive-logo.jpeg";
import HoneycombBackground from "@/components/HoneycombBackground";
import CustomerOnboarding from "@/components/CustomerOnboarding";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type AccountType = "customer" | "vendor" | "wholesaler" | "gig_worker";
type GigRole = "runner" | "city_rider" | "hive_node";

const roleCards: { value: AccountType; emoji: string; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "customer", emoji: "🛍️", label: "Customer", desc: "Start shopping instantly", icon: ShoppingBag },
  { value: "vendor", emoji: "🏬", label: "Vendor (SME)", desc: "Start selling products & services", icon: Store },
  { value: "gig_worker", emoji: "🚚", label: "Gig Worker", desc: "Runner, Rider, or Node Hub", icon: Bike },
  { value: "wholesaler", emoji: "📦", label: "Wholesaler", desc: "Supply the network", icon: Warehouse },
];

const gigRoles: { value: GigRole; label: string; desc: string; emoji: string }[] = [
  { value: "runner", label: "Runner", desc: "On-foot deliveries", emoji: "🏃" },
  { value: "city_rider", label: "City Rider", desc: "Motorbike courier", emoji: "🏍️" },
  { value: "hive_node", label: "Hive Node", desc: "Storage Hub", emoji: "📍" },
];

const wholesaleCategories = ["Fashion", "Tech", "FMCG", "Beauty", "Other"];

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "form" | "onboarding">("role");
  const [role, setRole] = useState<AccountType | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [businessType, setBusinessType] = useState("");
  const [serviceFulfillment, setServiceFulfillment] = useState("");
  const [gigRole, setGigRole] = useState<GigRole | null>(null);
  const [wholesaleCategory, setWholesaleCategory] = useState("");
  const [wholesaleCategoryOther, setWholesaleCategoryOther] = useState("");

  const [loading, setLoading] = useState(false);
  const [signupUserId, setSignupUserId] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: AccountType) => {
    setRole(selectedRole);
    if (selectedRole === "customer") {
      setStep("onboarding");
    } else {
      setStep("form");
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple" | "facebook") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.error(signInError.message);
        setLoading(false);
        return;
      }

      if (role === "vendor") {
        await supabase.from("profiles").update({
          business_type: businessType,
          service_fulfillment: serviceFulfillment,
        }).eq("user_id", authData.user.id);
      } else if (role === "gig_worker" && gigRole) {
        await supabase.from("profiles").update({ gig_role: gigRole }).eq("user_id", authData.user.id);
      } else if (role === "wholesaler") {
        await supabase.from("profiles").update({
          wholesale_category: wholesaleCategory,
          wholesale_category_other: wholesaleCategory === "Other" ? wholesaleCategoryOther : "",
        }).eq("user_id", authData.user.id);
      }

      if (role === "vendor") {
        await supabase.from("profiles").update({ pulse_credits: 2400, zmw_balance: 0 }).eq("user_id", authData.user.id);
      }

      setLoading(false);
      toast.success("Account created successfully!");

      if (role === "customer") {
        setSignupUserId(authData.user.id);
        setStep("onboarding");
        return;
      }

      const routes: Record<string, string> = {
        vendor: "/retailer-studio",
        wholesaler: "/warehouse",
        gig_worker: "/gig-radar",
      };
      navigate(routes[role] || "/", { replace: true });
    }
  };

  const handleOnboardingComplete = () => {
    navigate("/customer-dash", { replace: true });
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm appearance-none";

  // Customer progressive disclosure: full 5-step signup+onboarding flow
  if (step === "onboarding") {
    return <CustomerOnboarding isSignup onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      <HoneycombBackground />
      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {step === "role" ? (
            <motion.div key="role" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
              className="glass-ivory p-8">
              <div className="flex flex-col items-center mb-8">
                <img src={hiveLogo} alt="The Hive" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 mb-3 shadow-lg" />
                <h1 className="text-2xl font-display font-bold text-foreground">Join The Hive</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose how you want to use The Hive</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roleCards.map((card) => (
                  <motion.button key={card.value} whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.96 }}
                    onClick={() => handleRoleSelect(card.value)}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border/50 bg-secondary/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                    <span className="text-3xl">{card.emoji}</span>
                    <span className="text-sm font-bold text-foreground">{card.label}</span>
                    <span className="text-xs text-muted-foreground">{card.desc}</span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
              className="glass-ivory p-8">
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => { setStep("role"); setRole(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm">← Back</button>
                <div className="flex-1 text-center">
                  <h2 className="text-xl font-display font-bold text-foreground">
                    {role === "customer" && "🛍️ Customer Signup"}
                    {role === "vendor" && "🏬 Vendor Signup"}
                    {role === "gig_worker" && "🚚 Gig Worker Signup"}
                    {role === "wholesaler" && "📦 Wholesaler Signup"}
                  </h2>
                </div>
                <div className="w-10" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 9XX XXX XXX" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                </div>

                {/* Role-specific fields */}
                {role === "vendor" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">Business Type</label>
                      <div className="relative">
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} required className={selectClass}>
                          <option value="">Select type</option>
                          <option value="retail">Retail</option>
                          <option value="services">Services</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">Service Fulfillment</label>
                      <div className="relative">
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select value={serviceFulfillment} onChange={(e) => setServiceFulfillment(e.target.value)} required className={selectClass}>
                          <option value="">Select fulfillment</option>
                          <option value="self">Self-Fulfill</option>
                          <option value="hive_logistics">Use Hive Logistics</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {role === "gig_worker" && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">Choose Your Gig Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {gigRoles.map((g) => (
                        <button key={g.value} type="button" onClick={() => setGigRole(g.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${gigRole === g.value ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}>
                          <span className="text-xl block mb-1">{g.emoji}</span>
                          <span className="text-xs font-semibold text-foreground block">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {role === "wholesaler" && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">Wholesale Category</label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select value={wholesaleCategory} onChange={(e) => setWholesaleCategory(e.target.value)} required className={selectClass}>
                        <option value="">Select category</option>
                        {wholesaleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {wholesaleCategory === "Other" && (
                      <input type="text" value={wholesaleCategoryOther} onChange={(e) => setWholesaleCategoryOther(e.target.value)}
                        placeholder="Specify category" className={`${inputClass} mt-2 pl-4`} />
                    )}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-sm mt-2">
                  <UserPlus size={16} />
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Signup;
