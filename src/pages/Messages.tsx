import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Paperclip, Send, Search, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import HoneycombBackground from "@/components/HoneycombBackground";
import hiveLogo from "@/assets/hive-logo.jpeg";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// ---------- Types (tables not yet in generated types) ----------

interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message: string | null;
  last_message_at: string | null;
  context_order_id: number | null;
  context_item_id: number | null;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string; // 'text' | 'product'
  product_data: Record<string, any> | null;
  created_at: string;
}

interface ProfileSummary {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

// ---------- Helpers ----------

const formatTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initials = (name: string | null) =>
  (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ---------- Component ----------

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uid = user?.id;

  // ---- Fetch conversations ----
  const loadConversations = useCallback(async () => {
    if (!uid) return;
    const { data } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
      .order("last_message_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [uid]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---- Resolve profiles for participants ----
  useEffect(() => {
    if (!conversations.length || !uid) return;
    const ids = new Set<string>();
    conversations.forEach((c) => {
      ids.add(c.participant_a);
      ids.add(c.participant_b);
    });
    ids.delete(uid);
    const missing = [...ids].filter((id) => !profiles[id]);
    if (!missing.length) return;

    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", missing);
      if (data) {
        const map: Record<string, ProfileSummary> = { ...profiles };
        (data as ProfileSummary[]).forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, uid]);

  // ---- Fetch messages for active conversation ----
  useEffect(() => {
    if (!activeConv) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConv.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    })();
  }, [activeConv]);

  // ---- Real-time subscription on messages ----
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv]);

  // ---- Real-time subscription on conversations list ----
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "conversations" },
        () => {
          loadConversations();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, loadConversations]);

  // ---- Auto-scroll ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Send message ----
  const handleSend = async () => {
    if (!draft.trim() || !activeConv || !uid || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");

    await (supabase as any).from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: uid,
      content: text,
      message_type: "text",
    });

    await (supabase as any)
      .from("conversations")
      .update({ last_message: text, last_message_at: new Date().toISOString() })
      .eq("id", activeConv.id);

    setSending(false);
    inputRef.current?.focus();
  };

  // ---- Derived ----
  const getOtherProfile = (conv: Conversation): ProfileSummary | undefined => {
    if (!uid) return undefined;
    const otherId = conv.participant_a === uid ? conv.participant_b : conv.participant_a;
    return profiles[otherId];
  };

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const p = getOtherProfile(c);
    return (
      p?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // ---- Render: Inbox list ----
  const InboxPanel = () => (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-xl">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <img src={hiveLogo} alt="The Hive" className="w-8 h-8 rounded-full object-cover border border-primary/20" />
          <h1 className="font-display font-bold text-foreground text-lg">Messages</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/60 border-border/40 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
            <MessageSquare size={40} className="opacity-40" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const other = getOtherProfile(conv);
            const isSelected = activeConv?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/30 transition-colors text-left ${
                  isSelected ? "bg-primary/8" : "hover:bg-secondary/50"
                }`}
              >
                <Avatar className="h-11 w-11 shrink-0 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {initials(other?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {other?.full_name || "Unknown"}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message || "Start a conversation"}
                  </p>
                  {/* Context badges */}
                  <div className="flex gap-1.5 mt-1">
                    {conv.context_order_id && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-navy text-ivory border-0"
                        style={{ backgroundColor: "hsl(220, 55%, 13%)", color: "#FFFBF2" }}
                      >
                        📦 Order #{conv.context_order_id}
                      </Badge>
                    )}
                    {conv.context_item_id && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 border-0"
                        style={{ backgroundColor: "#B37C1C", color: "#FFFBF2" }}
                      >
                        🛍️ Product Inquiry
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );

  // ---- Render: Chat panel ----
  const ChatPanel = () => {
    if (!activeConv) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-secondary/20 text-muted-foreground gap-3">
          <MessageSquare size={56} className="opacity-30" />
          <p className="text-base font-medium">Select a conversation</p>
          <p className="text-xs">Choose from the inbox to start chatting</p>
        </div>
      );
    }

    const other = getOtherProfile(activeConv);

    return (
      <div className="flex-1 flex flex-col h-full bg-background/60">
        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 backdrop-blur-sm"
        >
          {isMobile && (
            <button
              onClick={() => setActiveConv(null)}
              className="p-1.5 rounded-lg hover:bg-secondary text-foreground mr-1"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials(other?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {other?.full_name || "Unknown"}
            </p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
          {other?.phone && (
            <a
              href={`tel:${other.phone}`}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
              style={{ backgroundColor: "#B37C1C" }}
            >
              <Phone size={18} color="#FFFBF2" />
            </a>
          )}
        </div>

        {/* Messages body */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-2 max-w-2xl mx-auto">
            {messages.map((msg) => {
              const isMine = msg.sender_id === uid;

              // Product card
              if (msg.message_type === "product" && msg.product_data) {
                const pd = msg.product_data;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="rounded-2xl overflow-hidden border border-border/40 max-w-[260px] shadow-sm"
                      style={{ backgroundColor: isMine ? "#B37C1C" : "#FFFFFF" }}
                    >
                      {pd.image_url && (
                        <img src={pd.image_url as string} alt="" className="w-full h-32 object-cover" />
                      )}
                      <div className="p-3">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: isMine ? "#FFFBF2" : "hsl(220, 55%, 13%)" }}
                        >
                          {pd.product_name as string}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: isMine ? "rgba(255,251,242,0.8)" : "hsl(220,20%,46%)" }}
                        >
                          K{pd.price as number}
                        </p>
                        <button
                          className="mt-2 w-full text-xs font-bold py-1.5 rounded-lg"
                          style={{
                            backgroundColor: isMine ? "#FFFBF2" : "#B37C1C",
                            color: isMine ? "#B37C1C" : "#FFFBF2",
                          }}
                        >
                          ⚡ View Item
                        </button>
                      </div>
                      <div className="px-3 pb-1.5 text-right">
                        <span
                          className="text-[9px]"
                          style={{ color: isMine ? "rgba(255,251,242,0.6)" : "hsl(220,20%,46%)" }}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Text bubble
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm"
                    style={{
                      backgroundColor: isMine ? "#B37C1C" : "#FFFFFF",
                      color: isMine ? "#FFFBF2" : "hsl(220, 55%, 13%)",
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className="text-[9px] mt-1 text-right"
                      style={{ opacity: 0.6 }}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-card/90 backdrop-blur-sm px-3 py-3">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <button
              className="p-2.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              title="Attach Product"
            >
              <Paperclip size={20} />
            </button>
            <Input
              ref={inputRef}
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 bg-secondary/50 border-border/40 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all disabled:opacity-40"
              style={{ backgroundColor: "#B37C1C" }}
            >
              <Send size={18} color="#FFFBF2" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---- Mobile: show list or chat ----
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col relative">
        <HoneycombBackground />
        <AnimatePresence mode="wait">
          {activeConv ? (
            <motion.div
              key="chat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-0 z-20 flex flex-col"
            >
              <ChatPanel />
            </motion.div>
          ) : (
            <motion.div
              key="inbox"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-0 z-10 flex flex-col"
            >
              <InboxPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---- Desktop: two-panel ----
  return (
    <div className="h-screen flex relative">
      <HoneycombBackground />
      <div className="relative z-10 w-[360px] shrink-0 border-r border-border flex flex-col">
        <InboxPanel />
      </div>
      <div className="relative z-10 flex-1 flex flex-col">
        <ChatPanel />
      </div>
    </div>
  );
};

export default Messages;
