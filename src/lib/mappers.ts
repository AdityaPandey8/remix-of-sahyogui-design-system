import type { Issue, Alert } from "@/data/mockData";

/** Defensive coords parser — Supabase jsonb may arrive as object or string. */
function parseCoords(raw: any): { x: number; y: number } {
  if (!raw) return { x: 50, y: 50 };
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return { x: 50, y: 50 }; }
  }
  const x = Number(raw.x);
  const y = Number(raw.y);
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  };
}

/** Map a snake_case `issues` row from Supabase into the camelCase `Issue` UI type. */
export function issueFromRow(row: any): Issue {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    urgency: (row.urgency ?? "Medium") as Issue["urgency"],
    severity: row.severity ?? undefined,
    status: (row.status ?? "Pending") as Issue["status"],
    location: row.location ?? "",
    category: (row.category ?? "Infrastructure") as Issue["category"],
    images: row.images ?? [],
    photos: row.photos ?? [],
    reportedBy: row.reported_by ?? (row.is_anonymous ? "Anonymous" : "Unknown"),
    assignedNgo: row.assigned_ngo ?? null,
    assignedVolunteers: row.assigned_volunteers ?? [],
    responseTime: row.response_time ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    upvotes: row.upvotes ?? 0,
    comments: Array.isArray(row.comments) ? row.comments : [],
    aiPriorityScore: row.ai_priority_score ?? 0,
    affectedPeople: row.affected_people ?? 0,
    isAnonymous: !!row.is_anonymous,
    isFake: !!row.is_fake,
    coords: parseCoords(row.coords),
    locationRisk: row.location_risk ?? undefined,
    requiredResources: row.required_resources ?? [],
    isAIVerified: !!row.is_ai_verified,
  };
}

/** Map a camelCase `Issue` (or partial) into a snake_case row for INSERT/UPDATE. */
export function issueToRow(issue: Partial<Issue> & { reporterId?: string | null }): any {
  const row: any = {};
  if (issue.id !== undefined) row.id = issue.id;
  if (issue.title !== undefined) row.title = issue.title;
  if (issue.description !== undefined) row.description = issue.description;
  if (issue.urgency !== undefined) row.urgency = issue.urgency;
  if (issue.severity !== undefined) row.severity = issue.severity;
  if (issue.status !== undefined) row.status = issue.status;
  if (issue.location !== undefined) row.location = issue.location;
  if (issue.category !== undefined) row.category = issue.category;
  if (issue.images !== undefined) row.images = issue.images;
  if (issue.photos !== undefined) row.photos = issue.photos;
  if (issue.reportedBy !== undefined) row.reported_by = issue.reportedBy;
  if (issue.assignedNgo !== undefined) row.assigned_ngo = issue.assignedNgo;
  if (issue.assignedVolunteers !== undefined) row.assigned_volunteers = issue.assignedVolunteers;
  if (issue.responseTime !== undefined) row.response_time = issue.responseTime;
  if (issue.upvotes !== undefined) row.upvotes = issue.upvotes;
  if (issue.comments !== undefined) row.comments = issue.comments;
  if (issue.aiPriorityScore !== undefined) row.ai_priority_score = issue.aiPriorityScore;
  if (issue.affectedPeople !== undefined) row.affected_people = issue.affectedPeople;
  if (issue.isAnonymous !== undefined) row.is_anonymous = issue.isAnonymous;
  if (issue.isFake !== undefined) row.is_fake = issue.isFake;
  if (issue.coords !== undefined) row.coords = issue.coords;
  if (issue.locationRisk !== undefined) row.location_risk = issue.locationRisk;
  if (issue.requiredResources !== undefined) row.required_resources = issue.requiredResources;
  if (issue.isAIVerified !== undefined) row.is_ai_verified = issue.isAIVerified;
  if (issue.reporterId !== undefined) row.reporter_id = issue.reporterId;
  return row;
}

/** Map a snake_case `alerts` row to the camelCase `Alert` UI type. */
export function alertFromRow(row: any): Alert {
  return {
    id: row.id,
    type: (row.type ?? "info") as Alert["type"],
    title: row.title ?? "",
    message: row.message ?? "",
    severity: (row.severity ?? "Medium") as Alert["severity"],
    createdAt: row.created_at ?? new Date().toISOString(),
    details: row.details ?? "",
    photos: row.photos ?? [],
    affectedArea: row.affected_area ?? "",
  };
}

export function alertToRow(alert: Partial<Alert>): any {
  const row: any = {};
  if (alert.id !== undefined) row.id = alert.id;
  if (alert.type !== undefined) row.type = alert.type;
  if (alert.title !== undefined) row.title = alert.title;
  if (alert.message !== undefined) row.message = alert.message;
  if (alert.severity !== undefined) row.severity = alert.severity;
  if (alert.details !== undefined) row.details = alert.details;
  if (alert.photos !== undefined) row.photos = alert.photos;
  if (alert.affectedArea !== undefined) row.affected_area = alert.affectedArea;
  return row;
}