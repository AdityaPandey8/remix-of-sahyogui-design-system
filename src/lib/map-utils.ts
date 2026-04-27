import { type LatLngTuple } from "leaflet";

/**
 * Helper to map mock coords to lat/lng for visualization on a Leaflet map.
 * This maps relative {x, y} coordinates (0-100) to India's bounding box.
 */
export const getLatLng = (coords: { x: number; y: number }): LatLngTuple => {
  // Map x (roughly 20-70) to India latitude (roughly 8-37)
  // Map y (roughly 20-80) to India longitude (roughly 68-97)
  // These are just approximate for the mock data visualization
  const lat = 8 + (coords.x / 100) * 29;
  const lng = 68 + (coords.y / 100) * 29;
  return [lat, lng];
};

/**
 * Build a Google Maps tracking link for an issue.
 * Falls back to a search query when coords aren't usable.
 */
export const getIssueMapLink = (issue: {
  coords?: { x: number; y: number } | null;
  location?: string | null;
}): string => {
  if (issue.coords && typeof issue.coords.x === "number" && typeof issue.coords.y === "number") {
    const [lat, lng] = getLatLng(issue.coords);
    return `https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
  const q = encodeURIComponent(issue.location || "India");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};
