import { useState, useEffect } from "react";
import { Copy, Send, Trash2, Video, Image, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toPng } from "html-to-image";

interface PulseItem {
  id: number;
  product_name: string | null;
  image_url: string | null;
  digital_vault: string | null;
  created_at: string;
  category: string | null;
}

interface PulseLibraryProps {
  storeId: number | null;
  refreshKey: number;
}

const PulseLibrary: React.FC<PulseLibraryProps> = ({ storeId, refreshKey }) => {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hive_catalogue")
        .select("id, product_name, image_url, digital_vault, created_at, category")
        .eq("sme_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as PulseItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, [storeId, refreshKey]);

  const baseUrl = window.location.origin;

  const copyLink = (id: number) => {
    navigator.clipboard.writeText(`${baseUrl}/store/${storeId}?item=${id}`);
    toast.success("Link copied!");
  };

  const broadcastItem = async (item: PulseItem) => {
    const url = `${baseUrl}/store/${storeId}?item=${item.id}`;
    const text = `Check out ${item.product_name || "this item"} on The Hive! ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: item.product_name || "The Hive", text, url });
      } catch { /* user cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const deleteItem = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted.");
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Video size={32} className="mx-auto mb-2 opacity-30" />
        No published content yet. Create your first Pulse Link above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Media</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Link</th>
            <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-border/30 last:border-0 hover:bg-secondary/20"
            >
              <td className="px-5 py-3">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : item.digital_vault ? (
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Video size={16} className="text-purple-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Image size={16} className="text-muted-foreground" />
                  </div>
                )}
              </td>
              <td className="px-5 py-3 text-sm font-medium text-foreground">{item.product_name || "Untitled"}</td>
              <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
              <td className="px-5 py-3 text-xs text-primary font-mono hidden sm:table-cell truncate max-w-[140px]">
                thehive.zm/p/{item.id}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => copyLink(item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <button
                    onClick={() => broadcastItem(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Send size={12} /> Share
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PulseLibrary;
