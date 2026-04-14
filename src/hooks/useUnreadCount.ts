import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the count of conversations with unread messages.
 * For now, counts conversations where last_message_at > user's last read.
 * Simplified: counts total conversations as placeholder until read_at tracking is added.
 */
export const useUnreadCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { count: total } = await (supabase as any)
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .not("last_message", "is", null);
    setCount(total ?? 0);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time refresh
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("unread-count")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  return count;
};
