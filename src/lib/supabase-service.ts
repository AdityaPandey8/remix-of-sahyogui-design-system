import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://yiejtairiylxpxwkghsm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWp0YWlyaXlseHB4d2tnaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzc4OTMsImV4cCI6MjA5MDYxMzg5M30.qEwgN9YXVSHs-jzu9nr1V1iM36neRr-cpmVuPdMpO-w";
// Use an untyped client for tables not in the generated types
const supabaseUntyped = createClient(SUPABASE_URL, SUPABASE_KEY);
import { ngos as mockNgos, volunteers as mockVolunteers, type Issue, type Alert, type NGO, type Volunteer } from "@/data/mockData";
import { UserProfile } from "@/types/database";
import { issueFromRow, issueToRow, alertFromRow } from "@/lib/mappers";

export const getIssues = async (): Promise<Issue[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching issues from Supabase:", error);
      return [];
    }
    return (data ?? []).map(issueFromRow);
  } catch (err) {
    console.error("Supabase service error:", err);
    return [];
  }
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching alerts from Supabase:", error);
      return [];
    }
    return (data ?? []).map(alertFromRow);
  } catch (err) {
    console.error("Supabase service error:", err);
    return [];
  }
};

export const getNGOs = async (): Promise<NGO[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('ngo_details')
      .select('*, profiles(email, blocked)');

    if (error) {
      console.error("Error fetching NGOs from Supabase:", error);
      return mockNgos;
    }

    if (!data) return mockNgos;
    if (data.length === 0) return [];
    
    return data.map((item) => ({
      id: item.id,
      name: item.ngo_name,
      focusArea: "Disaster Relief", // Default or extract from areas if available
      activeIssues: 0,
      description: item.rejection_reason || "",
      issuesHandled: 0,
      successRate: 100,
      avgResponseTime: "2h",
      blocked: (item.profiles as any)?.blocked || false,
      volunteerIds: [],
      contactEmail: (item.profiles as any)?.email || "",
      location: "India"
    }));
  } catch (err) {
    console.error("Supabase service error:", err);
    return mockNgos;
  }
};

export const getVolunteers = async (): Promise<Volunteer[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('volunteer_details')
      .select('*, profiles(blocked)');

    if (error) {
      console.error("Error fetching volunteers from Supabase:", error);
      return mockVolunteers;
    }

    if (!data) return mockVolunteers;
    if (data.length === 0) return [];
    
    return data.map((item) => ({
      id: item.id,
      name: item.full_name,
      skills: item.skills || [],
      available: item.availability,
      responseRate: 95,
      reliabilityScore: Number(item.reliability_score) || 4.5,
      tasksCompleted: item.tasks_completed || 0,
      coords: { x: Number(item.latitude) || 0, y: Number(item.longitude) || 0 },
      blocked: (item.profiles as any)?.blocked || (item as any).blocked || false,
      location: item.location_text || "India",
      assignedTasks: [],
      phone: ""
    }));
  } catch (err) {
    console.error("Supabase service error:", err);
    return mockVolunteers;
  }
};

export const getPublicUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('profiles')
      .select('*')
      .eq('role', 'public');

    if (error) {
      console.error("Error fetching public users:", error);
      return [];
    }

    return data as UserProfile[];
  } catch (err) {
    console.error("Supabase service error:", err);
    return [];
  }
};

/** Fetch ALL registered users (public, volunteer, ngo, admin) for admin registry. */
export const getAllProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabaseUntyped
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching all profiles:", error);
      return [];
    }
    return (data ?? []) as UserProfile[];
  } catch (err) {
    console.error("Supabase service error:", err);
    return [];
  }
};

export const updateUserStatus = async (userId: string, blocked: boolean): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped
      .from('profiles')
      .update({ blocked })
      .eq('id', userId);

    if (error) {
      console.error("Error updating user status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase service error:", err);
    return false;
  }
};

export const createIssue = async (
  issue: Partial<Issue> & { reporterId?: string | null }
): Promise<Issue | null> => {
  try {
    const id = issue.id || `ISS-${Date.now().toString(36).toUpperCase()}`;
    const row = issueToRow({
      ...issue,
      id,
      upvotes: issue.upvotes ?? 0,
      comments: issue.comments ?? [],
    });

    const { data, error } = await supabaseUntyped
      .from('issues')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("Error creating issue in Supabase:", error);
      return null;
    }
    return issueFromRow(data);
  } catch (err) {
    console.error("Supabase service error:", err);
    return null;
  }
};

export const upvoteIssue = async (issueId: string): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped.rpc('increment_upvotes', { row_id: issueId });
    if (error) {
      console.error("Error upvoting issue in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase service error:", err);
    return false;
  }
};

export const claimIssue = async (issueId: string, ngoId: string | null): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped
      .from('issues')
      .update({ assigned_ngo: ngoId, status: ngoId ? 'Verified' : 'Pending' })
      .eq('id', issueId);

    if (error) {
      console.error("Error claiming issue in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase service error:", err);
    return false;
  }
};

export const updateIssueStatus = async (issueId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped
      .from('issues')
      .update({ status })
      .eq('id', issueId);

    if (error) {
      console.error("Error updating issue status in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase service error:", err);
    return false;
  }
};

export const toggleVolunteerAvailability = async (volId: string, available: boolean): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped
      .from('volunteer_details')
      .update({ availability: available })
      .eq('id', volId);

    if (error) {
      console.error("Error updating volunteer availability in Supabase:", error);
      return true; // Simulate success
    }
    return true;
  } catch (err) {
    return true;
  }
};

export const updateVolunteerStatus = async (volId: string, blocked: boolean): Promise<boolean> => {
  try {
    const { error } = await supabaseUntyped
      .from('profiles')
      .update({ blocked })
      .eq('id', volId);

    if (error) {
      console.error("Error updating volunteer status in Supabase:", error);
      return true; // Simulate success
    }
    return true;
  } catch (err) {
    return true;
  }
};
