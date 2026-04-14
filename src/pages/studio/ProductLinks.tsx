import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Copy } from "lucide-react";
import { motion } from "framer-motion";

const mockLinks = [
  { id: 1, name: "Summer Sale Collection", url: "hive.zm/s/summer24", clicks: 342, revenue: 12500 },
  { id: 2, name: "New Arrivals Page", url: "hive.zm/s/newarrivals", clicks: 189, revenue: 7800 },
  { id: 3, name: "Flash Deal - Shoes", url: "hive.zm/s/flashshoes", clicks: 567, revenue: 23400 },
];

const ProductLinks = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Product Links</h1>
          <p className="text-sm text-muted-foreground mt-1">Create shareable links for your products</p>
        </div>
        <button className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={16} /> Create Link
        </button>
      </div>

      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Name</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">URL</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Clicks</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Revenue</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {mockLinks.map((link, i) => (
              <motion.tr
                key={link.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-border/30 last:border-0 hover:bg-secondary/20"
              >
                <td className="px-5 py-4 text-sm font-medium text-foreground">{link.name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{link.url}</td>
                <td className="px-5 py-4 text-sm text-center font-semibold text-foreground">{link.clicks}</td>
                <td className="px-5 py-4 text-sm text-right font-semibold text-foreground hidden md:table-cell">ZMW {link.revenue.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Copy size={14} /></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
);

export default ProductLinks;
