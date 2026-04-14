import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BotMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  ts: number;
}

const AUTO_REPLIES: Record<string, string> = {
  hello: "👋 Hey there! I'm the Hive Bot. How can I help you today?",
  help: "I can help with:\n• 📦 Order tracking\n• 💳 Payment issues\n• 🛍️ Product questions\n• 📞 Contact a vendor\n\nJust type your question!",
  order: "To track an order, go to **Track My Orders** in your dashboard. Need help with a specific order? Share the order number.",
  payment: "For payment issues, visit your **Wallet** section. If a payment is stuck, our team usually resolves it within 24 hours.",
  default: "Thanks for reaching out! A support agent will follow up shortly. In the meantime, type **help** to see what I can assist with.",
};

const getReply = (input: string): string => {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(key)) return val;
  }
  return AUTO_REPLIES.default;
};

const HiveBotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    { id: "welcome", role: "bot", text: "🐝 Welcome to The Hive! I'm your assistant. Type **help** to get started.", ts: Date.now() },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!draft.trim()) return;
    const userMsg: BotMessage = { id: `u-${Date.now()}`, role: "user", text: draft.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    const reply = getReply(draft);
    setDraft("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: "bot", text: reply, ts: Date.now() }]);
    }, 600);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: "#B37C1C" }}
        aria-label="Support Bot"
      >
        {open ? <X size={22} color="#FFFBF2" /> : <Bot size={24} color="#FFFBF2" />}
      </button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[100] w-[340px] max-w-[calc(100vw-48px)] rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 420, backgroundColor: "#FFFBF2" }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-border" style={{ backgroundColor: "#0F1A35" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#B37C1C" }}>
                <Bot size={16} color="#FFFBF2" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#FFFBF2" }}>🤖 Hive Bot</p>
                <p className="text-[10px]" style={{ color: "rgba(255,251,242,0.6)" }}>Always online</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        backgroundColor: m.role === "user" ? "#B37C1C" : "#F0EDE6",
                        color: m.role === "user" ? "#FFFBF2" : "#0F1A35",
                        borderBottomRightRadius: m.role === "user" ? 4 : 16,
                        borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: "#FFFBF2" }}>
              <Input
                placeholder="Ask Hive Bot…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="flex-1 text-sm bg-secondary/40 border-border/40"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ backgroundColor: "#B37C1C" }}
              >
                <Send size={15} color="#FFFBF2" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HiveBotWidget;
