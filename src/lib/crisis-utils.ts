import { toast } from "sonner";
import type { Issue, Category } from "@/data/mockData";
import { getLatLng } from "@/lib/map-utils";
import {
  emergencyServices,
  type EmergencyService,
  type EmergencyServiceType,
} from "@/data/emergencyServices";

/** Resolve an issue's lat/lng (mock issues only have x/y, real ones may carry lat/lng later). */
export function getIssueLatLng(issue: Issue): { lat: number; lng: number } {
  const anyIssue = issue as unknown as { lat?: number; lng?: number };
  if (typeof anyIssue.lat === "number" && typeof anyIssue.lng === "number") {
    return { lat: anyIssue.lat, lng: anyIssue.lng };
  }
  const [lat, lng] = getLatLng(issue.coords);
  return { lat, lng };
}

export function generateCrisisLink(issue: Issue): string {
  const { lat, lng } = getIssueLatLng(issue);
  return `https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

/** Map an issue category to the emergency-service types that should respond. */
export function getRequiredServices(category: Category): EmergencyServiceType[] {
  switch (category) {
    case "Health":
    case "Food":
      return ["hospital"];
    case "Disaster":
      return ["fire", "hospital"];
    case "Safety":
      return ["police", "hospital"];
    case "Infrastructure":
      return ["fire", "police"];
    case "Environment":
      return ["fire"];
    case "Communication":
      return ["police"];
    case "Shelter":
      return ["hospital", "police"];
    default:
      return ["police"];
  }
}

export interface NearbyService extends EmergencyService {
  distance: number;
}

/**
 * AI-style selector: filter mock services to those of the right type and
 * within `radius` (Euclidean degrees on lat/lng — a deliberately loose mock).
 */
export function getNearbyServices(issue: Issue, radius = 4): NearbyService[] {
  const { lat, lng } = getIssueLatLng(issue);
  const required = getRequiredServices(issue.category);
  return emergencyServices
    .filter((s) => required.includes(s.type))
    .map((s) => ({ ...s, distance: getDistance(lat, lng, s.lat, s.lng) }))
    .filter((s) => s.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

export function buildAlertMessage(issue: Issue): string {
  const link = generateCrisisLink(issue);
  return [
    "🚨 EMERGENCY ALERT – SAHYOGAI",
    "",
    `Crisis: ${issue.title}`,
    `Location: ${issue.location}`,
    `Urgency: ${issue.urgency}`,
    "",
    "📍 View Location:",
    link,
    "",
    "Immediate action required.",
  ].join("\n");
}

export async function copyCrisisLink(issue: Issue): Promise<void> {
  const link = generateCrisisLink(issue);
  try {
    await navigator.clipboard.writeText(link);
    toast.success("Link copied", { description: link });
  } catch {
    toast.error("Couldn't copy link");
  }
}

/** Simulated ETA: ~3 min per 0.1° distance, clamped 4–25 min. */
export function estimateEta(distance: number): number {
  return Math.max(4, Math.min(25, Math.round(4 + distance * 30)));
}