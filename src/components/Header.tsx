import { useState } from "react";
import { Menu, X, Info, Phone, Store, ChevronRight, UserPlus, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import hiveLogo from "@/assets/hive-logo.jpeg";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { label: "About", icon: Info, desc: "Learn about The Hive", path: "/" },
    { label: "Contact", icon: Phone, desc: "Get in touch with us", path: "/" },
    { label: "For Retailers", icon: Store, desc: "Grow your business", path: "/retailer-studio" },
    ...(user
      ? [{ label: "Logout", icon: LogOut, desc: "Sign out of your account", path: "logout" }]
      : [{ label: "Login", icon: LogIn, desc: "Access your account", path: "/login" }]),
  ];

  const handleNav = async (path: string) => {
    if (path === "logout") {
      await signOut();
      navigate("/");
    } else {
      navigate(path);
    }
    setOpen(false);
  };

  return (
    <>
      <header className="glass-header sticky top-0 z-50 px-4 md:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={hiveLogo} alt="The Hive" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
          <h1 className="text-primary text-xl md:text-2xl font-display font-bold tracking-tight">THE HIVE</h1>
        </div>
        <button onClick={() => setOpen(!open)} className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Toggle menu">
          <Menu size={22} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60]" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-[70] bg-card/95 backdrop-blur-xl border-l border-primary/15 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <img src={hiveLogo} alt="The Hive" className="w-10 h-10 rounded-full object-cover border border-primary/30" />
                <div>
                  <p className="font-display font-bold text-primary text-sm">THE HIVE</p>
                  <p className="text-xs text-muted-foreground">
                    {user ? (profile?.full_name || "Marketplace") : "Marketplace"}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-1">
              {navItems.map((item, i) => (
                <motion.button key={item.label} onClick={() => handleNav(item.path)}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-secondary transition-all group w-full">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              {user ? (
                <button onClick={() => handleNav("logout")} className="w-full flex items-center justify-center gap-2 py-3 text-sm border border-border rounded-xl text-foreground hover:bg-secondary transition-colors">
                  <LogOut size={16} />
                  Sign Out
                </button>
              ) : (
                <button onClick={() => { navigate("/signup"); setOpen(false); }} className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-sm">
                  <UserPlus size={16} />
                  Sign Up
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
