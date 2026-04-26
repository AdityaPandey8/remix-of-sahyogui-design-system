export type EmergencyServiceType = "hospital" | "fire" | "police";

export interface EmergencyService {
  id: string;
  type: EmergencyServiceType;
  name: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
}

/**
 * Mock emergency services across India.
 * Coordinates roughly within India's lat/lng bounding box so they pair with
 * the same `coordsToLatLng` mapping used by mock issues.
 */
export const emergencyServices: EmergencyService[] = [
  { id: "ES-H01", type: "hospital", name: "AIIMS Delhi", city: "Delhi", phone: "+91 11 2658 8500", lat: 28.5672, lng: 77.2100 },
  { id: "ES-H02", type: "hospital", name: "City Care Hospital", city: "Lucknow", phone: "+91 522 408 8000", lat: 26.85, lng: 80.94 },
  { id: "ES-H03", type: "hospital", name: "KEM Hospital", city: "Mumbai", phone: "+91 22 2410 7000", lat: 19.00, lng: 72.84 },
  { id: "ES-H04", type: "hospital", name: "Apollo Hospital", city: "Chennai", phone: "+91 44 2829 3333", lat: 13.06, lng: 80.25 },
  { id: "ES-F01", type: "fire", name: "Fire Station Sector 12", city: "Lucknow", phone: "101", lat: 26.84, lng: 80.95 },
  { id: "ES-F02", type: "fire", name: "Mumbai Central Fire", city: "Mumbai", phone: "101", lat: 18.97, lng: 72.82 },
  { id: "ES-F03", type: "fire", name: "Connaught Fire Brigade", city: "Delhi", phone: "101", lat: 28.63, lng: 77.21 },
  { id: "ES-F04", type: "fire", name: "Egmore Fire Station", city: "Chennai", phone: "101", lat: 13.07, lng: 80.26 },
  { id: "ES-P01", type: "police", name: "Hazratganj Police", city: "Lucknow", phone: "100", lat: 26.86, lng: 80.93 },
  { id: "ES-P02", type: "police", name: "Colaba Police", city: "Mumbai", phone: "100", lat: 18.92, lng: 72.83 },
  { id: "ES-P03", type: "police", name: "Parliament Street Police", city: "Delhi", phone: "100", lat: 28.62, lng: 77.21 },
  { id: "ES-P04", type: "police", name: "T. Nagar Police", city: "Chennai", phone: "100", lat: 13.04, lng: 80.23 },
];

export const serviceTypeLabel: Record<EmergencyServiceType, string> = {
  hospital: "Hospital",
  fire: "Fire Station",
  police: "Police Station",
};

export const serviceTypeEmoji: Record<EmergencyServiceType, string> = {
  hospital: "🏥",
  fire: "🚒",
  police: "🚓",
};