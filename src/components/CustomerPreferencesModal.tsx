import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerPreferencesModalProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

const preferenceCategories = [
  { value: "Fashion", emoji: "👗", label: "Fashion", desc: "Clothing, accessories & style" },
  { value: "Tech", emoji: "📱", label: "Tech", desc: "Gadgets, electronics & devices" },
  { value: "Entertainment", emoji: "🎮", label: "Entertainment", desc: "Games, music & media" },
  { value: "Food", emoji: "🍕", label: "Food", desc: "Snacks, meals & beverages" },
  { value: "Beauty", emoji: "💄", label: "Beauty & Cosmetics", desc: "Skincare, makeup & wellness" },
];

const CustomerPreferencesModal = ({ open, onComplete, userId }: CustomerPreferencesModalProps) => {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const togglePreference = (value: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (selectedPreferences.length === 0) {
      toast.error("Please select at least one preference");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ preferences: selectedPreferences })
      .eq("user_id", userId);

    setSaving(false);

    if (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    } else {
      toast.success("Preferences saved successfully!");
      onComplete();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  What are you looking for today?
                </h2>
                <p className="text-sm text-muted-foreground">Select your interests to personalize your experience</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {preferenceCategories.map((category) => {
              const isSelected = selectedPreferences.includes(category.value);
              return (
                <motion.button
                  key={category.value}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => togglePreference(category.value)}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border/50 bg-secondary/20 hover:border-primary/40"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check size={14} className="text-primary-foreground" />
                    </motion.div>
                  )}
                  <span className="text-4xl">{category.emoji}</span>
                  <div className="text-center">
                    <span className="text-sm font-bold text-foreground block">{category.label}</span>
                    <span className="text-xs text-muted-foreground">{category.desc}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {selectedPreferences.length} {selectedPreferences.length === 1 ? "category" : "categories"} selected
            </p>
            <button
              onClick={handleSave}
              disabled={saving || selectedPreferences.length === 0}
              className="btn-gold flex items-center gap-2 px-8 py-3 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerPreferencesModal;
