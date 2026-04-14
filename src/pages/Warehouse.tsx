import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse as WarehouseIcon, Package, TrendingUp, Truck, Search,
  LayoutDashboard, Boxes, Users, CreditCard, Settings, Plus, X,
  Image, DollarSign, Hash, Lock, LogOut, Menu, Trash2, Edit
} from "lucide-react";
import HoneycombBackground from "@/components/HoneycombBackground";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import hiveLogo from "@/assets/hive-logo.jpeg";
import { toast } from "sonner";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard", emoji: "📊" },
  { label: "Bulk Inventory", icon: Boxes, id: "inventory", emoji: "📦" },
  { label: "SME Partner Network", icon: Users, id: "partners", emoji: "🤝" },
  { label: "Payouts & Ledger", icon: CreditCard, id: "payouts", emoji: "💰" },
  { label: "Store Settings", icon: Settings, id: "settings", emoji: "⚙️" },
];

interface InventoryItem {
  id: number;
  product_name: string | null;
  price: number | null;
  wholesale_price: number | null;
  stock_count: number | null;
  category: string | null;
  image_url: string | null;
  is_wholesale: boolean | null;
  is_wholesale_enabled: boolean | null;
  resell_code: string | null;
}

const Warehouse = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);

  // Add item form state
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newWholesalePrice, setNewWholesalePrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [privateCode, setPrivateCode] = useState(false);
  const [newResellCode, setNewResellCode] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStoreAndInventory();
    }
  }, [user]);

  const fetchStoreAndInventory = async () => {
    if (!user) return;
    setLoading(true);

    // Find store owned by this user
    const { data: store } = await supabase
      .from("sme_stores")
      .select("*")
      .eq("owner_user_id", user.id)
      .single();

    let sid = store?.id || null;
    setStoreId(sid);

    if (sid) {
      const { data: items } = await supabase
        .from("hive_catalogue")
        .select("*")
        .eq("sme_id", sid)
        .order("created_at", { ascending: false });

      setInventory((items as InventoryItem[]) || []);
    }

    // Fetch ledger
    const { data: ledger } = await supabase
      .from("hive_ledger")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setLedgerEntries(ledger || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const resetForm = () => {
    setNewName(""); setNewPrice(""); setNewWholesalePrice("");
    setNewStock(""); setNewCategory(""); setPrivateCode(false);
    setNewResellCode(""); setEditingId(null);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error("No wholesale store linked. Contact support.");
      return;
    }

    const payload = {
      product_name: newName,
      price: parseFloat(newPrice) || 0,
      wholesale_price: parseFloat(newWholesalePrice) || 0,
      stock_count: parseInt(newStock) || 0,
      category: newCategory,
      sme_id: storeId,
      is_wholesale: true,
      resell_code: privateCode ? newResellCode : null,
      item_type: "product",
    };

    if (editingId) {
      const { error } = await supabase.from("hive_catalogue").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Item updated!");
    } else {
      const { error } = await supabase.from("hive_catalogue").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Bulk item added!");
    }

    resetForm();
    setAddItemOpen(false);
    fetchStoreAndInventory();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setNewName(item.product_name || "");
    setNewPrice(String(item.price || ""));
    setNewWholesalePrice(String(item.wholesale_price || ""));
    setNewStock(String(item.stock_count || ""));
    setNewCategory(item.category || "");
    setPrivateCode(!!item.resell_code);
    setNewResellCode(item.resell_code || "");
    setAddItemOpen(true);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Item removed.");
    fetchStoreAndInventory();
  };

  const handleToggleWholesale = async (item: InventoryItem) => {
    const newVal = !(item.is_wholesale_enabled);
    const { error } = await supabase.from("hive_catalogue")
      .update({ is_wholesale_enabled: newVal } as any)
      .eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newVal ? "Item listed for SME resell!" : "Item removed from resell mall.");
    fetchStoreAndInventory();
  };

  const filtered = inventory.filter(i =>
    !searchQuery || (i.product_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStock = inventory.reduce((s, i) => s + (i.stock_count || 0), 0);
  const totalValue = inventory.reduce((s, i) => s + ((i.price || 0) * (i.stock_count || 0)), 0);

  const stats = [
    { label: "Active Listings", value: String(inventory.length), icon: Package, color: "bg-primary/10 text-primary" },
    { label: "Total Stock Units", value: totalStock.toLocaleString(), icon: Truck, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Inventory Value", value: `ZMW ${totalValue.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-500/10 text-blue-600" },
  ];

  const inputClass = "w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-border/30">
        <img src={hiveLogo} alt="The Hive" className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
        <div className="min-w-0">
          <h2 className="text-sm font-display font-bold text-foreground truncate">Wholesale Hub</h2>
          <p className="text-xs text-muted-foreground truncate">{profile?.full_name || "Wholesaler"}</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {sidebarItems.map((item) => (
          <button key={item.id}
            onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeSection === item.id ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-secondary/60"
            }`}>
            <span className="text-base">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border/30">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
          <LogOut size={16} /> <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center`}><s.icon size={22} /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{loading ? "..." : s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );

  const renderInventory = () => (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-display font-bold text-foreground">📦 Bulk Inventory</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
              className="pl-8 pr-4 py-2.5 rounded-2xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full" />
          </div>
          <button onClick={() => { resetForm(); setAddItemOpen(true); }}
            className="btn-gold flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-2xl">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Item</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Price</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Stock</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Code</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <motion.tr key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/60 flex items-center justify-center text-lg">📦</div>
                    <span className="font-medium text-foreground text-sm">{item.product_name || "Unnamed"}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-foreground font-semibold hidden sm:table-cell">ZMW {item.price || 0}</td>
                <td className="py-4 px-4 text-muted-foreground hidden md:table-cell">{(item.stock_count || 0).toLocaleString()} units</td>
                <td className="py-4 px-4">
                  {item.resell_code ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      <Lock size={10} /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium">Open</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-primary hover:underline">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs font-semibold text-destructive hover:underline">
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No inventory items yet. Click "Add Item" to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartners = () => (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-2">🤝 SME Partner Network</h3>
      <p className="text-xs text-muted-foreground mb-6">Toggle items to list them publicly for SMEs to resell in the Bounty Mall.</p>
      <div className="space-y-3">
        {inventory.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center text-lg">📦</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.product_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">ZMW {item.wholesale_price || item.price || 0} wholesale</p>
              </div>
            </div>
            <button onClick={() => handleToggleWholesale(item)}
              className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${(item as any).is_wholesale_enabled ? "bg-primary" : "bg-border"}`}>
              <motion.div animate={{ x: (item as any).is_wholesale_enabled ? 20 : 0 }} className="w-5 h-5 rounded-full bg-card shadow-md" />
            </button>
          </div>
        ))}
        {inventory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Add inventory items first, then toggle them for SME reselling.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPayouts = () => (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-2">💰 Payouts & Ledger</h3>
      <p className="text-xs text-muted-foreground mb-6">Your transaction history</p>
      {ledgerEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/30">
                  <td className="py-3 px-4 text-foreground capitalize">{entry.transaction_type || "—"}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">ZMW {entry.amount || 0}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No transactions yet.</p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-2">⚙️ Store Settings</h3>
      <p className="text-xs text-muted-foreground mb-6">Manage your wholesale account</p>
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground">Store ID</p>
          <p className="text-xs text-muted-foreground">{storeId || "Not linked"}</p>
        </div>
        <div className="p-4 rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground">Account Name</p>
          <p className="text-xs text-muted-foreground">{profile?.full_name || "—"}</p>
        </div>
        <div className="p-4 rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground">Phone</p>
          <p className="text-xs text-muted-foreground">{profile?.phone || "—"}</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "inventory": return renderInventory();
      case "partners": return renderPartners();
      case "payouts": return renderPayouts();
      case "settings": return renderSettings();
      default: return <>{renderDashboard()}{renderInventory()}</>;
    }
  };

  return (
    <div className="min-h-screen relative flex">
      <HoneycombBackground />
      <aside className="hidden md:flex w-64 bg-card/90 backdrop-blur-md border-r border-border/40 flex-col fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 md:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card/95 backdrop-blur-md border-r border-border/40 z-50 md:hidden">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 md:ml-64 relative z-10">
        <div className="md:hidden sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border/40 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground"><Menu size={22} /></button>
          <img src={hiveLogo} alt="The Hive" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
          <h1 className="text-sm font-display font-bold text-foreground">Wholesale Hub</h1>
        </div>

        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><WarehouseIcon size={22} className="text-primary" /></div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Wholesale <span className="text-primary">Warehouse</span></h2>
              <p className="text-sm text-muted-foreground">Bulk Sourcing Portal</p>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>

      {/* Add/Edit Item Slide-over */}
      <AnimatePresence>
        {addItemOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setAddItemOpen(false); resetForm(); }} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border/40">
                <h3 className="text-lg font-display font-bold text-foreground">{editingId ? "Edit" : "Add"} Bulk Item</h3>
                <button onClick={() => { setAddItemOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddItem} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Item Title</label>
                  <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Bulk Cotton T-Shirts (50pc)" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Base Cost (ZMW)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input required type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00"
                      className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Recommended SME Markup (ZMW)</label>
                  <div className="relative">
                    <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="number" value={newWholesalePrice} onChange={(e) => setNewWholesalePrice(e.target.value)} placeholder="0.00"
                      className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Stock Count</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input required type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="0"
                      className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Category</label>
                  <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Fashion, Tech, FMCG" className={inputClass} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Private Access Code</p>
                    <p className="text-xs text-muted-foreground">Restrict to exclusive SME partners</p>
                  </div>
                  <button type="button" onClick={() => setPrivateCode(!privateCode)}
                    className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${privateCode ? "bg-primary" : "bg-border"}`}>
                    <motion.div animate={{ x: privateCode ? 20 : 0 }} className="w-5 h-5 rounded-full bg-card shadow-md" />
                  </button>
                </div>
                {privateCode && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">Access Code</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={newResellCode} onChange={(e) => setNewResellCode(e.target.value)} placeholder="e.g. HIVE-VIP-2024"
                        className={`${inputClass} pl-9`} />
                    </div>
                  </div>
                )}
                <button type="submit" className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-2xl mt-4">
                  <Plus size={16} /> {editingId ? "Update Item" : "Add to Inventory"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Warehouse;
