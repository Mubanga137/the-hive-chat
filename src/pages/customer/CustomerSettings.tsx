import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Camera, Save, Mail, Phone, Shield, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const preferenceOptions = ["Fashion", "Tech", "Food", "Entertainment", "Beauty"];
const philosophyOptions = ["Student Creators", "Wholesale Kings", "Premium Boutiques", "Local Hustlers"];

const CustomerSettings = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  const existingPrefs = profile?.preferences?.filter(p => !p.startsWith("philosophy:")) || [];
  const existingPhilosophy = profile?.preferences?.filter(p => p.startsWith("philosophy:")).map(p => p.replace("philosophy:", "")) || [];

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(existingPrefs);
  const [selectedPhilosophy, setSelectedPhilosophy] = useState<string[]>(existingPhilosophy);

  const togglePref = (p: string) => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const togglePhil = (p: string) => setSelectedPhilosophy(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const combinedPrefs = [...selectedPrefs, ...selectedPhilosophy.map(p => `philosophy:${p}`)];
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, preferences: combinedPrefs })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save. Please try again.");
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "U";

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <Settings size={24} className="text-primary" /> Settings
        </h2>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </motion.div>

      {/* Profile Picture */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{firstName[0]}</span>
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{profile?.full_name || "Customer"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-[10px] text-primary font-semibold mt-1">Customer Account</p>
        </div>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
          <User size={16} className="text-primary" /> Personal Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Mail size={12} /> Email
            </label>
            <input type="email" value={user?.email || ""} disabled
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-muted-foreground text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Phone size={12} /> Phone Number
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
          </div>
        </div>
      </motion.div>

      {/* Taste Preferences */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
          <Palette size={16} className="text-primary" /> Shopping Preferences
        </h3>
        <div className="flex flex-wrap gap-2">
          {preferenceOptions.map(p => (
            <button key={p} onClick={() => togglePref(p)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedPrefs.includes(p)
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Philosophy */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
          <Shield size={16} className="text-primary" /> Support Philosophy
        </h3>
        <div className="flex flex-wrap gap-2">
          {philosophyOptions.map(p => (
            <button key={p} onClick={() => togglePhil(p)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedPhilosophy.includes(p)
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full btn-gold flex items-center justify-center gap-2 py-3.5 text-sm mb-8 disabled:opacity-50"
      >
        <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
      </motion.button>
    </div>
  );
};

export default CustomerSettings;
