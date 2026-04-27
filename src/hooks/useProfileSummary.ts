import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProfileSummary {
  displayName: string;
  email: string;
  initials: string;
  role: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

export function useProfileSummary(): ProfileSummary {
  const { user, profile } = useAuth();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setName("");
      return;
    }
    const role = profile?.role;
    const fallback = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User";

    const fetch = async () => {
      if (role === "ngo") {
        const { data } = await supabase.from("ngo_details").select("ngo_name").eq("id", user.id).maybeSingle();
        setName(data?.ngo_name || fallback);
      } else if (role === "volunteer") {
        const { data } = await supabase.from("volunteer_details").select("full_name").eq("id", user.id).maybeSingle();
        setName(data?.full_name || fallback);
      } else {
        setName(fallback);
      }
    };
    fetch();
  }, [user, profile?.role]);

  const displayName = name || "User";
  return {
    displayName,
    email: user?.email || profile?.email || "",
    initials: initialsOf(displayName),
    role: profile?.role || "public",
  };
}