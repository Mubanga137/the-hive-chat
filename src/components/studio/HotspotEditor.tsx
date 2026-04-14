import { Trash2 } from "lucide-react";

interface HotspotData {
  id: string;
  x: number;
  y: number;
  label: string;
  price: number;
}

interface HotspotEditorProps {
  hotspots: HotspotData[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: "x" | "y", value: number) => void;
}

const HotspotEditor: React.FC<HotspotEditorProps> = ({ hotspots, onDelete, onUpdate }) => {
  if (hotspots.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">Click the image to add hotspots.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hotspots ({hotspots.length})</p>
      {hotspots.map((hs) => (
        <div key={hs.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2 text-xs">
          <span className="font-semibold text-foreground truncate flex-1">🏷️ {hs.label}</span>
          <label className="text-muted-foreground">X</label>
          <input
            type="number"
            value={Math.round(hs.x)}
            onChange={(e) => onUpdate(hs.id, "x", Number(e.target.value))}
            className="w-12 px-1 py-0.5 rounded bg-background border border-border text-center text-xs"
          />
          <label className="text-muted-foreground">Y</label>
          <input
            type="number"
            value={Math.round(hs.y)}
            onChange={(e) => onUpdate(hs.id, "y", Number(e.target.value))}
            className="w-12 px-1 py-0.5 rounded bg-background border border-border text-center text-xs"
          />
          <button onClick={() => onDelete(hs.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default HotspotEditor;
