import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload, Link2, Copy, Send, Trash2, Loader2, Video, Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PulsePlayer, { Hotspot, HotspotProduct } from "@/components/studio/PulsePlayer";

/* ── Neobrutalist palette ── */
const IVORY = "#FFFBF2";
const GOLD = "#B37C1C";
const NAVY = "#0F1A35";

/* ── Types ── */
interface PulseItem {
  id: number;
  product_name: string | null;
  image_url: string | null;
  digital_vault: string | null;
  created_at: string;
  category: string | null;
}

const CreatorStudio = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeName, setStoreName] = useState("");

  // Media state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  // Hotspots
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Library
  const [libraryItems, setLibraryItems] = useState<PulseItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Init store ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: store } = await supabase
        .from("sme_stores")
        .select("id, brand_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (store) {
        setStoreId(store.id);
        setStoreName(store.brand_name || "My Store");
      }
    })();
  }, [user]);

  /* ── Fetch library ── */
  useEffect(() => {
    if (!storeId) { setLibraryLoading(false); return; }
    (async () => {
      setLibraryLoading(true);
      const { data } = await supabase
        .from("hive_catalogue")
        .select("id, product_name, image_url, digital_vault, created_at, category")
        .eq("sme_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50);
      setLibraryItems((data as PulseItem[]) || []);
      setLibraryLoading(false);
    })();
  }, [storeId, refreshKey]);

  /* ── File pick ── */
  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Only image or video files."); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("Max 50 MB."); return; }
    setFile(f);
    setMediaType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(f));
    setUploadedUrl(null);
    setHotspots([]);
    setGeneratedLink(null);
  }, []);

  /* ── Upload ── */
  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hive_media").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("hive_media").getPublicUrl(path);
    setUploadedUrl(urlData.publicUrl);
    toast.success("Media uploaded!");
    setUploading(false);
  };

  /* ── Add hotspot ── */
  const handleAddHotspot = (x: number, y: number) => {
    const newHotspot: Hotspot = {
      id: crypto.randomUUID(),
      x,
      y,
      product: {
        id: crypto.randomUUID(),
        name: title || "Product",
        price: Number(price) || 0,
        imageUrl: uploadedUrl || preview || undefined,
      },
    };
    setHotspots((prev) => [...prev, newHotspot]);
    toast.success("Hotspot placed!");
  };

  /* ── Delete hotspot ── */
  const deleteHotspot = (id: string) => setHotspots((prev) => prev.filter((h) => h.id !== id));

  /* ── Publish ── */
  const handlePublish = async () => {
    if (!storeId) { toast.error("No store linked."); return; }
    if (!title.trim()) { toast.error("Title is required."); return; }
    setPublishing(true);

    const payload: Record<string, unknown> = {
      product_name: title.trim(),
      sme_id: storeId,
      item_type: "product",
      category: "Entertainment",
      price: Number(price) || 0,
      stock_count: 999,
    };
    if (uploadedUrl) {
      if (mediaType === "video") payload.digital_vault = uploadedUrl;
      else payload.image_url = uploadedUrl;
    }

    const { data, error } = await supabase.from("hive_catalogue").insert(payload as any).select("id").single();
    if (error) { toast.error(error.message); setPublishing(false); return; }

    const pulseId = data?.id ? `p${data.id}` : `p${Date.now().toString(36)}`;
    const link = `thehive.zm/p/${pulseId}`;
    setGeneratedLink(link);
    navigator.clipboard.writeText(`https://${link}`);
    toast.success("🚀 Pulse Link published & copied!");
    setPublishing(false);
    setRefreshKey((k) => k + 1);
  };

  /* ── Reset ── */
  const resetEditor = () => {
    setTitle(""); setPrice(""); setFile(null); setPreview(null);
    setUploadedUrl(null); setHotspots([]); setGeneratedLink(null);
  };

  /* ── Library actions ── */
  const baseUrl = window.location.origin;

  const copyLink = (id: number) => {
    navigator.clipboard.writeText(`${baseUrl}/store/${storeId}?item=${id}`);
    toast.success("Link copied!");
  };

  const broadcastItem = async (item: PulseItem) => {
    const pulseUrl = `${baseUrl}/store/${storeId}?item=${item.id}`;
    const promoText = `🔥 Check out "${item.product_name || "this item"}" on The Hive — shop direct from verified SMEs! ${pulseUrl}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: item.product_name || "The Hive",
          text: promoText,
          url: pulseUrl,
        });
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error("Share failed. Link copied to clipboard instead.");
          await navigator.clipboard.writeText(pulseUrl);
        }
      }
    } else {
      // Desktop fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(pulseUrl);
        toast.success("📋 Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link.");
      }
    }
  };

  const deleteItem = async (id: number) => {
    const { error } = await supabase.from("hive_catalogue").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted.");
      setLibraryItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  /* ── Neobrutalist shared styles ── */
  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm font-semibold border-[3px] shadow-[3px_3px_0px_#0F1A35] focus:outline-none focus:ring-2 focus:ring-[#B37C1C]/40 placeholder:opacity-50 transition-all";
  const btnGold =
    "px-5 py-3 rounded-xl text-sm font-black border-[3px] shadow-[4px_4px_0px_#0F1A35] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2";
  const btnGoldSmall =
    "px-2.5 py-1.5 rounded-lg text-[11px] font-black border-2 shadow-[2px_2px_0px_#0F1A35] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-1";

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto" style={{ color: NAVY }}>
        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: NAVY }}>
            Creator Studio
          </h1>
          <p className="text-sm font-semibold mt-1 opacity-60">
            Upload → Tag → Publish. Full-bleed, shoppable content.
          </p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Controls */}
          <div className="space-y-5">
            {/* Upload zone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl p-8 text-center cursor-pointer border-[3px] border-dashed transition-colors hover:border-[#B37C1C]"
              style={{ background: IVORY, borderColor: NAVY, color: NAVY }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4"
                onChange={handleFilePick}
                className="hidden"
              />
              <Upload size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-black">Drop or click to upload</p>
              <p className="text-xs font-semibold mt-1 opacity-50">.PNG, .JPG, or .MP4 — up to 50 MB</p>
            </motion.div>

            {/* Upload button */}
            {file && !uploadedUrl && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={btnGold + " w-full"}
                style={{ background: GOLD, color: IVORY, borderColor: NAVY }}
              >
                {uploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={16} /> Upload to Hive Media</>
                )}
              </button>
            )}

            {uploadedUrl && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border-2"
                style={{ background: IVORY, borderColor: GOLD, color: GOLD }}
              >
                ✅ Media uploaded successfully
              </div>
            )}

            {/* Form */}
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product / Reel title *"
                className={inputClass}
                style={{ background: IVORY, borderColor: NAVY, color: NAVY }}
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price in ZMW (optional)"
                type="number"
                className={inputClass}
                style={{ background: IVORY, borderColor: NAVY, color: NAVY }}
              />
            </div>

            {/* Hotspot list */}
            {hotspots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: NAVY }}>
                  Hotspots ({hotspots.length})
                </p>
                {hotspots.map((hs) => (
                  <div
                    key={hs.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs border-2"
                    style={{ background: IVORY, borderColor: NAVY }}
                  >
                    <span className="font-bold truncate flex-1">🏷️ {hs.product.name}</span>
                    <span className="font-black" style={{ color: GOLD }}>
                      ZMW {hs.product.price}
                    </span>
                    <span className="opacity-40 text-[10px]">
                      ({Math.round(hs.x)}%, {Math.round(hs.y)}%)
                    </span>
                    <button
                      onClick={() => deleteHotspot(hs.id)}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hotspots.length === 0 && preview && (
              <p className="text-xs font-semibold italic opacity-50">
                Click the player to place hotspots on your media.
              </p>
            )}

            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={publishing || !preview}
              className={btnGold + " w-full text-base"}
              style={{
                background: publishing ? "#999" : GOLD,
                color: IVORY,
                borderColor: NAVY,
                opacity: !preview ? 0.4 : 1,
              }}
            >
              {publishing ? (
                <><Loader2 size={18} className="animate-spin" /> Publishing...</>
              ) : (
                "🚀 PUBLISH PULSE LINK"
              )}
            </button>

            {/* Generated link */}
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-[3px]"
                style={{ background: IVORY, borderColor: GOLD }}
              >
                <span className="flex-1 text-sm font-mono font-black truncate" style={{ color: NAVY }}>
                  {generatedLink}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://${generatedLink}`);
                    toast.success("Link copied!");
                  }}
                  className={btnGoldSmall}
                  style={{ background: GOLD, color: IVORY, borderColor: NAVY }}
                >
                  <Copy size={12} /> Copy
                </button>
              </motion.div>
            )}

            {generatedLink && (
              <button onClick={resetEditor} className="text-xs font-bold underline opacity-60 hover:opacity-100">
                ✨ Create another Pulse
              </button>
            )}
          </div>

          {/* RIGHT: PulsePlayer */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p
              className="text-xs font-black text-center mb-3 uppercase tracking-widest"
              style={{ color: NAVY, opacity: 0.5 }}
            >
              {preview ? "Click to place hotspots" : "Live Preview"}
            </p>
            <PulsePlayer
              mediaUrl={preview}
              mediaType={mediaType}
              hotspots={hotspots}
              editable={!!preview}
              onAddHotspot={handleAddHotspot}
              onLockDeal={(product) => toast.success(`⚡ Deal locked: ${product.name}`)}
              storeName={storeName}
            />
          </motion.div>
        </div>

        {/* ── LINK MANAGEMENT TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden border-[3px]"
          style={{ background: IVORY, borderColor: NAVY }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between border-b-[3px]"
            style={{ borderColor: NAVY }}
          >
            <h2 className="font-black text-lg" style={{ color: NAVY }}>
              Pulse Links Dashboard
            </h2>
            <span
              className="text-[10px] font-black px-3 py-1 rounded-full border-2"
              style={{ background: GOLD, color: IVORY, borderColor: NAVY }}
            >
              {libraryItems.length} ACTIVE
            </span>
          </div>

          {libraryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin" size={24} style={{ color: GOLD }} />
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="py-12 text-center text-sm font-semibold opacity-40">
              <Video size={32} className="mx-auto mb-2 opacity-30" />
              No published content yet. Create your first Pulse Link above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `3px solid ${NAVY}` }}>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>
                      Media
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest" style={{ color: NAVY }}>
                      Title
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hidden md:table-cell" style={{ color: NAVY }}>
                      Clicks
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell" style={{ color: NAVY }}>
                      URL
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: NAVY }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {libraryItems.map((item, i) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-[#B37C1C]/5"
                      style={{ borderBottom: `2px solid ${NAVY}20` }}
                    >
                      <td className="px-5 py-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border-2"
                            style={{ borderColor: NAVY }}
                          />
                        ) : item.digital_vault ? (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center border-2"
                            style={{ background: GOLD, borderColor: NAVY, color: IVORY }}
                          >
                            <Video size={16} />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center border-2"
                            style={{ background: IVORY, borderColor: NAVY }}
                          >
                            <ImageIcon size={16} style={{ color: NAVY, opacity: 0.3 }} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold" style={{ color: NAVY }}>
                        {item.product_name || "Untitled"}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold hidden md:table-cell" style={{ color: NAVY, opacity: 0.5 }}>
                        —
                      </td>
                      <td className="px-5 py-3 text-xs font-mono font-bold hidden sm:table-cell truncate max-w-[140px]" style={{ color: GOLD }}>
                        thehive.zm/p/{item.id}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              const link = `https://thehive.zm/p/${item.id}`;
                              navigator.clipboard.writeText(link);
                              toast.success("Link generated & copied!");
                            }}
                            className={btnGoldSmall}
                            style={{ background: GOLD, color: IVORY, borderColor: NAVY }}
                          >
                            <Link2 size={12} /> Generate
                          </button>
                          <button
                            onClick={() => copyLink(item.id)}
                            className={btnGoldSmall}
                            style={{ background: IVORY, color: NAVY, borderColor: NAVY }}
                          >
                            <Copy size={12} /> Copy
                          </button>
                          <button
                            onClick={() => broadcastItem(item)}
                            className={btnGoldSmall}
                            style={{ background: IVORY, color: NAVY, borderColor: NAVY }}
                          >
                            <Send size={12} /> Share
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-lg border-2 hover:bg-red-50 transition-colors"
                            style={{ borderColor: NAVY, color: "#DC2626" }}
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
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorStudio;
