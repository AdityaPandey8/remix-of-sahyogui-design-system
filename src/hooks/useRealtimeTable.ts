import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Postgres changes on a Supabase table.
 * Calls `onChange` for every event (INSERT/UPDATE/DELETE).
 */
export function useRealtimeTable(table: string, onChange: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`rt-${table}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => {
          onChange();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, enabled]);
}