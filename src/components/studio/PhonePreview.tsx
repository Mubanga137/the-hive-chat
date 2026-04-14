import { motion } from "framer-motion";
import { Image } from "lucide-react";
import React from "react";

interface HotspotData {
  id: string;
  x: number;
  y: number;
  label: string;
  price: number;
}

interface PhonePreviewProps {
  preview: string | null;
  mediaType: "image" | "video" | null;
  hotspots: HotspotData[];
  title: string;
  price: string;
  storeName: string;
  editable?: boolean;
  onScreenClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCtaClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const PhonePreview: React.FC<PhonePreviewProps> = ({
  preview, mediaType, hotspots, title, price, storeName,
  editable = false, onScreenClick, onCtaClick, containerRef,
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[280px]" ref={containerRef}>
        <div className="border-[6px] border-foreground/80 rounded-[2.5rem] overflow-hidden shadow-2xl bg-background">
          {/* Notch */}
          <div className="h-6 bg-foreground/80 flex items-center justify-center">
            <div className="w-20 h-3 bg-foreground rounded-full" />
          </div>
          {/* Screen */}
          <div
            onClick={editable ? onScreenClick : undefined}
            className={`aspect-[9/16] bg-secondary/30 relative overflow-hidden ${editable ? "cursor-crosshair" : "cursor-default"}`}
          >
            {preview ? (
              mediaType === "video" ? (
                <video src={preview} className="w-full h-full object-cover" muted autoPlay loop />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                <Image size={48} />
                <p className="text-xs mt-2">Upload media to preview</p>
              </div>
            )}

            {/* Hotspots */}
            {hotspots.map((hs) => (
              <motion.div
                key={hs.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute z-10"
                style={{ left: `${hs.x}%`, top: `${hs.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap shadow-lg">
                  🏷️ {hs.label} — K{hs.price}
                </div>
              </motion.div>
            ))}

            {/* Hive Overlay */}
            {preview && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-4">
                <p className="text-xs font-bold text-background truncate">{title || "Product Title"}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-primary font-bold text-sm">ZMW {price || "0"}</span>
                  <span className="text-[9px] text-background/70">{storeName}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onCtaClick?.(); }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold"
                >
                  🛒 BUY NOW
                </button>
              </div>
            )}
          </div>
          {/* Home bar */}
          <div className="h-5 bg-foreground/80 flex items-center justify-center">
            <div className="w-24 h-1 bg-background/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhonePreview;
