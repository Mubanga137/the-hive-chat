import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Video, Link2, Package, Briefcase, ShoppingCart, Coins,
  LogOut, Menu, X, ChevronRight, Warehouse, Globe, BookOpen, Tag, BarChart3, Wallet, MessageSquare
} from "lucide-react";
import hiveLogo from "@/assets/hive-logo.jpeg";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import HoneycombBackground from "@/components/HoneycombBackground";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarModules = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/retailer-studio" },
    ],
  },
  {
    group: "Creator Studio",
    items: [
      { label: "Creator Studio", icon: Video, path: "/retailer-studio/creator" },
    ],
  },
  {
    group: "Store Management",
    items: [
      { label: "Products", icon: Package, path: "/retailer-studio/products" },
      { label: "Services", icon: Briefcase, path: "/retailer-studio/services" },
      { label: "Wholesale Bounty Hub", icon: Warehouse, path: "/retailer-studio/wholesale" },
      { label: "Storefront Builder", icon: Globe, path: "/retailer-studio/storefront" },
    ],
  },
  {
    group: "Business Operations",
    items: [
      { label: "Orders", icon: ShoppingCart, path: "/retailer-studio/orders" },
      { label: "Pulse Credits", icon: Coins, path: "/retailer-studio/credits" },
    ],
  },
  {
    group: "Business Suite",
    items: [
      { label: "Business Ledger", icon: BookOpen, path: "/retailer-studio/kantemba" },
      { label: "Marketing & Promos", icon: Tag, path: "/retailer-studio/marketing" },
      { label: "Analytics & Customers", icon: BarChart3, path: "/retailer-studio/analytics" },
      { label: "Hive Escrow Wallet", icon: Wallet, path: "/retailer-studio/escrow" },
    ],
  },
  {
    group: "Communication",
    items: [
      { label: "Messages", icon: MessageSquare, path: "/messages" },
    ],
  },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const unreadCount = useUnreadCount();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <img src={hiveLogo} alt="The Hive" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
        <div>
          <p className="font-display font-bold text-primary text-sm tracking-tight">THE HIVE</p>
          <p className="text-[10px] text-muted-foreground">Retailer Studio</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sidebarModules.map((mod) => (
          <div key={mod.group}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
              {mod.group}
            </p>
            <div className="space-y-0.5">
              {mod.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-foreground hover:bg-secondary border border-transparent"
                  }`}
                >
                  <item.icon size={18} className={isActive(item.path) ? "text-primary" : "text-muted-foreground"} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Messages" && unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: "#B37C1C", color: "#FFFBF2" }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {profile?.full_name?.[0]?.toUpperCase() || "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || "SME Brand"}
            </p>
            <p className="text-[10px] text-muted-foreground">Vendor Account</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex">
      <HoneycombBackground />

      <aside className="hidden lg:flex w-64 shrink-0 bg-card/80 backdrop-blur-xl border-r border-border relative z-20 flex-col">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-72 max-w-[85vw] z-[70] bg-card/95 backdrop-blur-xl border-r border-primary/15 shadow-2xl lg:hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-secondary text-foreground">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="glass-header sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary text-foreground">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src={hiveLogo} alt="The Hive" className="w-7 h-7 rounded-full object-cover border border-primary/30" />
            <span className="text-primary font-display font-bold text-sm">Studio</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
