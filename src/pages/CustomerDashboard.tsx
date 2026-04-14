import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, FileText, MapPin, Wallet, FolderOpen, LogOut, Menu, X,
  Settings, LayoutDashboard
} from "lucide-react";
import hiveLogo from "@/assets/hive-logo.jpeg";
import HoneycombBackground from "@/components/HoneycombBackground";
import { useAuth } from "@/hooks/useAuth";
import DashboardHomeSection from "@/components/DashboardHomeSection";

// Subpages
import Marketplace from "@/pages/customer/Marketplace";
import OrderHistory from "@/pages/customer/OrderHistory";
import TrackOrders from "@/pages/customer/TrackOrders";
import CustomerWallet from "@/pages/customer/CustomerWallet";
import Categories from "@/pages/customer/Categories";
import CustomerSettings from "@/pages/customer/CustomerSettings";

const sidebarItems = [
  { label: "Home", icon: LayoutDashboard, emoji: "🏠" },
  { label: "Marketplace", icon: ShoppingBag, emoji: "🛍️" },
  { label: "Order History", icon: FileText, emoji: "📜" },
  { label: "Track My Orders", icon: MapPin, emoji: "📍" },
  { label: "Wallet", icon: Wallet, emoji: "💳" },
  { label: "Categories", icon: FolderOpen, emoji: "📂" },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = profile?.full_name?.split(" ")[0] || "Shopper";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "Marketplace": return <Marketplace />;
      case "Order History": return <OrderHistory />;
      case "Track My Orders": return <TrackOrders />;
      case "Wallet": return <CustomerWallet />;
      case "Categories": return <Categories />;
      case "Settings": return <CustomerSettings />;
      default: return <DashboardHomeSection firstName={firstName} greeting={greeting} setActiveSection={setActiveSection} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <img src={hiveLogo} alt="The Hive" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
        <div>
          <p className="font-display font-bold text-primary text-sm tracking-tight">THE HIVE</p>
          <p className="text-[10px] text-muted-foreground">Customer Mall</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sidebarItems.map((item) => (
          <button key={item.label}
            onClick={() => { setActiveSection(item.label); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === item.label
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-foreground hover:bg-secondary border border-transparent"
            }`}>
            <span className="text-base">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <button
          onClick={() => { setActiveSection("Settings"); setSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-3 ${
            activeSection === "Settings"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-foreground hover:bg-secondary border border-transparent"
          }`}>
          <Settings size={16} />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold truncate">{profile?.full_name || "Customer"}</p>
            <p className="text-[10px] text-muted-foreground">Settings</p>
          </div>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors">
          <LogOut size={14} /> 🚪 Logout
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-72 max-w-[85vw] z-[70] bg-card/95 backdrop-blur-xl border-r border-primary/15 shadow-2xl lg:hidden">
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-secondary text-foreground"><X size={20} /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="glass-header sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary text-foreground"><Menu size={22} /></button>
          <div className="flex items-center gap-2">
            <img src={hiveLogo} alt="The Hive" className="w-7 h-7 rounded-full object-cover border border-primary/30" />
            <span className="text-primary font-display font-bold text-sm">The Hive</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
