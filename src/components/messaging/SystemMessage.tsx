interface SystemMessageProps {
  content: string;
}

const SystemMessage = ({ content }: SystemMessageProps) => (
  <div className="flex justify-center my-3">
    <div
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-border/30"
      style={{
        backgroundColor: "rgba(240,237,230,0.85)",
        backdropFilter: "blur(8px)",
        color: "#0F1A35",
      }}
    >
      <span className="text-[11px]">🤖</span>
      <span className="font-semibold" style={{ color: "#B37C1C" }}>Hive Bot</span>
      <span className="mx-0.5">·</span>
      <span>{content}</span>
    </div>
  </div>
);

export default SystemMessage;
