import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { toast } from "sonner";
import type { Issue } from "@/data/mockData";
import { buildAlertMessage, getNearbyServices, type NearbyService } from "@/lib/crisis-utils";

export type CrisisRole = "admin" | "ngo" | "volunteer" | "public" | "system";

export interface CrisisRequest {
  id: string;
  issue: Issue;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface CrisisBroadcast {
  ngos: number;
  volunteers: number;
  services: NearbyService[];
  sentAt: string;
  message: string;
}

interface CrisisContextValue {
  crisisMode: boolean;
  activeIssue: Issue | null;
  broadcast: CrisisBroadcast | null;
  requests: CrisisRequest[];
  activateCrisis: (issue: Issue, role: CrisisRole) => void;
  deactivateCrisis: () => void;
  requestActivation: (issue: Issue, requestedBy: string) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
}

const CrisisContext = createContext<CrisisContextValue | undefined>(undefined);

const STORAGE_KEY = "sahyogai:crisis-state";
const AUTO_DISABLED_KEY = "sahyogai:crisis-auto-disabled";

interface PersistedState {
  crisisMode: boolean;
  activeIssue: Issue | null;
  broadcast: CrisisBroadcast | null;
  requests: CrisisRequest[];
}

function readPersisted(): PersistedState {
  if (typeof window === "undefined") return { crisisMode: false, activeIssue: null, broadcast: null, requests: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { crisisMode: false, activeIssue: null, broadcast: null, requests: [] };
    return JSON.parse(raw) as PersistedState;
  } catch {
    return { crisisMode: false, activeIssue: null, broadcast: null, requests: [] };
  }
}

export function CrisisProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readPersisted, []);
  const [crisisMode, setCrisisMode] = useState(initial.crisisMode);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(initial.activeIssue);
  const [broadcast, setBroadcast] = useState<CrisisBroadcast | null>(initial.broadcast);
  const [requests, setRequests] = useState<CrisisRequest[]>(initial.requests);

  // Persist
  useEffect(() => {
    const data: PersistedState = { crisisMode, activeIssue, broadcast, requests };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }, [crisisMode, activeIssue, broadcast, requests]);

  const activateCrisis = useCallback((issue: Issue, role: CrisisRole) => {
    const services = getNearbyServices(issue);
    const next: CrisisBroadcast = {
      ngos: 3,
      volunteers: 5,
      services,
      sentAt: new Date().toISOString(),
      message: buildAlertMessage(issue),
    };
    setActiveIssue(issue);
    setBroadcast(next);
    setCrisisMode(true);
    if (role === "system") {
      toast("⚡ Auto Crisis Activated due to high priority", {
        description: issue.title,
      });
    } else {
      toast.error("🚨 Crisis Protocol Engaged", {
        description: "All nearby responders have been notified.",
      });
    }
  }, []);

  const deactivateCrisis = useCallback(() => {
    setCrisisMode(false);
    setActiveIssue(null);
    setBroadcast(null);
    try { sessionStorage.setItem(AUTO_DISABLED_KEY, "1"); } catch { /* noop */ }
    toast.success("Crisis protocol deactivated");
  }, []);

  const requestActivation = useCallback((issue: Issue, requestedBy: string) => {
    const req: CrisisRequest = {
      id: `CR-${Date.now()}`,
      issue,
      requestedBy,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [req, ...prev]);
    toast.success("Request sent to admin for approval");
  }, []);

  const approveRequest = useCallback((id: string) => {
    setRequests((prev) => {
      const found = prev.find((r) => r.id === id);
      if (found) {
        // Activate after approval
        setTimeout(() => activateCrisis(found.issue, "admin"), 0);
      }
      return prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r));
    });
  }, [activateCrisis]);

  const rejectRequest = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    toast("Request rejected");
  }, []);

  const value = useMemo<CrisisContextValue>(() => ({
    crisisMode, activeIssue, broadcast, requests,
    activateCrisis, deactivateCrisis, requestActivation, approveRequest, rejectRequest,
  }), [crisisMode, activeIssue, broadcast, requests, activateCrisis, deactivateCrisis, requestActivation, approveRequest, rejectRequest]);

  return <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>;
}

export function useCrisis(): CrisisContextValue {
  const ctx = useContext(CrisisContext);
  if (!ctx) throw new Error("useCrisis must be used within <CrisisProvider>");
  return ctx;
}

/**
 * Hook that auto-activates crisis mode when any issue exceeds priority 90,
 * but only once per session and only until the user manually deactivates.
 */
export function useAutoCrisis(issues: Issue[] | undefined) {
  const { crisisMode, activeIssue, activateCrisis } = useCrisis();
  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    if (crisisMode || activeIssue) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTO_DISABLED_KEY)) return;
    if (!issues || issues.length === 0) return;
    const top = issues.find((i) => (i.aiPriorityScore ?? 0) > 90);
    if (top) {
      triggered.current = true;
      activateCrisis(top, "system");
    }
  }, [issues, crisisMode, activeIssue, activateCrisis]);
}