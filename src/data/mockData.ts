import placeholderImage from "@/assets/placeholder.svg?url";

export type IssueStatus = "Pending" | "Verified" | "In Progress" | "Solved";
export type Urgency = "High" | "Medium" | "Low";
export type Category = "Health" | "Disaster" | "Food" | "Infrastructure" | "Environment" | "Safety" | "Communication" | "Shelter";

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  urgency: Urgency;
  severity?: Urgency;
  status: IssueStatus;
  location: string;
  category: Category;
  images: string[];
  reportedBy: string;
  assignedNgo: string | null;
  assignedVolunteers: string[];
  responseTime: string | null;
  createdAt: string;
  upvotes: number;
  comments: Comment[];
  aiPriorityScore: number;
  affectedPeople: number;
  isAnonymous: boolean;
  isFake: boolean;
  coords: { x: number; y: number };
  photos: string[];
  locationRisk?: number;
  requiredResources?: string[];
  isAIVerified?: boolean;
}

export interface Task {
  id: string;
  issueId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  volunteersNeeded: number;
  volunteersSignedUp: number;
  status: "Open" | "In Progress" | "Completed";
  deadline: string;
}

export interface NGO {
  id: string;
  name: string;
  focusArea: string;
  activeIssues: number;
  description: string;
  issuesHandled: number;
  successRate: number;
  avgResponseTime: string;
  blocked: boolean;
  volunteerIds: string[];
  contactEmail: string;
  location: string;
}

export interface Volunteer {
  id: string;
  name: string;
  skills: string[];
  available: boolean;
  responseRate: number;
  reliabilityScore: number;
  tasksCompleted: number;
  coords: { x: number; y: number };
  blocked: boolean;
  location: string;
  assignedTasks: string[];
  phone: string;
}

export interface Alert {
  id: string;
  type: "disaster" | "weather" | "emergency" | "info";
  title: string;
  message: string;
  severity: Urgency;
  createdAt: string;
  details: string;
  photos: string[];
  affectedArea: string;
}

export interface PastCrisis {
  id: string;
  title: string;
  description: string;
  resolvedByNgo: string;
  resolvedByVolunteers: string[];
  responseTime: string;
  livesImpacted: number;
  date: string;
  photos: string[];
  category: Category;
  location: string;
}

export interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const issues: Issue[] = [
  { id: "ISS-001", title: "Flooded road near Sector 14", description: "Major waterlogging has blocked the main road near Sector 14. Vehicles stranded, pedestrians wading through knee-deep water.", urgency: "High", status: "Pending", location: "Gurugram, Haryana", category: "Disaster", images: [], reportedBy: "Rahul Verma", assignedNgo: null, assignedVolunteers: [], responseTime: null, createdAt: "2026-03-23T08:30:00Z", upvotes: 24, comments: [{ id: "c1", author: "Amit S.", text: "Same issue near Sector 15 too", createdAt: "2026-03-23T09:00:00Z" }], aiPriorityScore: 87, affectedPeople: 1200, isAnonymous: false, isFake: false, coords: { x: 28, y: 35 }, photos: [placeholderImage, placeholderImage] },
  { id: "ISS-002", title: "Collapsed wall at community center", description: "The eastern boundary wall of the community center has collapsed after heavy rain. Debris on the footpath, risk of injury.", urgency: "High", status: "Verified", location: "Pune, Maharashtra", category: "Infrastructure", images: [], reportedBy: "Sneha Patil", assignedNgo: "NGO-001", assignedVolunteers: ["VOL-001", "VOL-002"], responseTime: "2h 15m", createdAt: "2026-03-22T14:20:00Z", upvotes: 18, comments: [], aiPriorityScore: 82, affectedPeople: 350, isAnonymous: false, isFake: false, coords: { x: 52, y: 62 }, photos: [placeholderImage] },
  { id: "ISS-003", title: "Water supply disruption", description: "No water supply in 5 wards since yesterday morning. Residents relying on tankers.", urgency: "Medium", status: "In Progress", location: "Jaipur, Rajasthan", category: "Infrastructure", images: [], reportedBy: "Kavita Sharma", assignedNgo: "NGO-002", assignedVolunteers: ["VOL-003"], responseTime: "4h 30m", createdAt: "2026-03-22T06:00:00Z", upvotes: 31, comments: [{ id: "c2", author: "Ravi K.", text: "We haven't had water for 36 hours now", createdAt: "2026-03-22T18:00:00Z" }], aiPriorityScore: 71, affectedPeople: 8500, isAnonymous: false, isFake: false, coords: { x: 38, y: 42 }, photos: [] },
  { id: "ISS-004", title: "Food shortage in relief camp", description: "Camp holding 600 displaced families. Food supplies will run out by evening. Urgent replenishment needed.", urgency: "High", status: "In Progress", location: "Patna, Bihar", category: "Food", images: [], reportedBy: "Anonymous", assignedNgo: "NGO-003", assignedVolunteers: ["VOL-005", "VOL-007"], responseTime: "1h 45m", createdAt: "2026-03-23T05:00:00Z", upvotes: 42, comments: [{ id: "c3", author: "Deepa M.", text: "Children are the worst affected", createdAt: "2026-03-23T07:00:00Z" }], aiPriorityScore: 95, affectedPeople: 2400, isAnonymous: true, isFake: false, coords: { x: 65, y: 38 }, photos: [placeholderImage, placeholderImage, placeholderImage] },
  { id: "ISS-005", title: "Power outage in 3 wards", description: "Complete blackout in wards 7, 8, and 12. Hospitals running on generators.", urgency: "Medium", status: "Pending", location: "Chennai, Tamil Nadu", category: "Infrastructure", images: [], reportedBy: "Suresh R.", assignedNgo: null, assignedVolunteers: [], responseTime: null, createdAt: "2026-03-23T10:00:00Z", upvotes: 15, comments: [], aiPriorityScore: 64, affectedPeople: 4200, isAnonymous: false, isFake: false, coords: { x: 55, y: 82 }, photos: [] },
  { id: "ISS-006", title: "Medical supplies running low", description: "District hospital running critically low on IV fluids, antibiotics, and bandages.", urgency: "High", status: "Verified", location: "Bhopal, Madhya Pradesh", category: "Health", images: [], reportedBy: "Dr. Nisha Agarwal", assignedNgo: "NGO-003", assignedVolunteers: ["VOL-002", "VOL-008"], responseTime: "3h", createdAt: "2026-03-22T20:00:00Z", upvotes: 28, comments: [{ id: "c4", author: "Rajesh P.", text: "Patients being turned away", createdAt: "2026-03-23T06:00:00Z" }], aiPriorityScore: 91, affectedPeople: 1800, isAnonymous: false, isFake: false, coords: { x: 45, y: 50 }, photos: [placeholderImage] },
  { id: "ISS-007", title: "Road debris blocking evacuation", description: "Fallen trees and rocks blocking NH-7 near Mussoorie. Evacuation routes compromised.", urgency: "Medium", status: "Solved", location: "Dehradun, Uttarakhand", category: "Disaster", images: [], reportedBy: "Vikram S.", assignedNgo: "NGO-001", assignedVolunteers: ["VOL-007"], responseTime: "5h 20m", createdAt: "2026-03-21T16:00:00Z", upvotes: 12, comments: [], aiPriorityScore: 45, affectedPeople: 600, isAnonymous: false, isFake: false, coords: { x: 42, y: 22 }, photos: [] },
  { id: "ISS-008", title: "Shelter tents damaged by wind", description: "High winds have torn apart 15 relief tents in Camp B. Families exposed to elements.", urgency: "Low", status: "Pending", location: "Lucknow, Uttar Pradesh", category: "Shelter", images: [], reportedBy: "Meera Tiwari", assignedNgo: null, assignedVolunteers: [], responseTime: null, createdAt: "2026-03-23T07:00:00Z", upvotes: 9, comments: [], aiPriorityScore: 38, affectedPeople: 120, isAnonymous: false, isFake: false, coords: { x: 55, y: 35 }, photos: [] },
  { id: "ISS-009", title: "Communication tower down", description: "Cell tower in Block C non-functional. No mobile connectivity for 2 km radius.", urgency: "Medium", status: "Verified", location: "Ranchi, Jharkhand", category: "Communication", images: [], reportedBy: "Anil Dubey", assignedNgo: "NGO-002", assignedVolunteers: ["VOL-004"], responseTime: "6h", createdAt: "2026-03-22T12:00:00Z", upvotes: 7, comments: [], aiPriorityScore: 55, affectedPeople: 3200, isAnonymous: false, isFake: false, coords: { x: 62, y: 45 }, photos: [] },
  { id: "ISS-010", title: "Stray animal rescue needed", description: "Pack of stray dogs trapped in flooded underpass near Railway Station.", urgency: "Low", status: "Solved", location: "Ahmedabad, Gujarat", category: "Safety", images: [], reportedBy: "Pooja Shah", assignedNgo: "NGO-001", assignedVolunteers: ["VOL-001"], responseTime: "8h", createdAt: "2026-03-21T10:00:00Z", upvotes: 34, comments: [{ id: "c5", author: "Animal lover", text: "Thank you for rescuing them!", createdAt: "2026-03-21T20:00:00Z" }], aiPriorityScore: 22, affectedPeople: 0, isAnonymous: false, isFake: false, coords: { x: 30, y: 55 }, photos: [placeholderImage] },
  { id: "ISS-011", title: "Emergency oxygen shortage", description: "City Hospital reported critical shortage of oxygen cylinders. 15 patients in ICU at risk.", urgency: "High", status: "Pending", location: "Mumbai, Maharashtra", category: "Health", images: [], reportedBy: "Dr. K. Nair", assignedNgo: null, assignedVolunteers: [], responseTime: null, createdAt: "2026-03-24T02:15:00Z", upvotes: 56, comments: [], aiPriorityScore: 98, affectedPeople: 45, isAnonymous: false, isFake: false, coords: { x: 51, y: 65 }, photos: [], requiredResources: ["Oxygen Cylinders", "ICU Meds"], isAIVerified: true },
];

export const tasks: Task[] = [
  { id: "TSK-001", issueId: "ISS-001", title: "Food Distribution", description: "Distribute 200 food packets to stranded families in Sector 14.", requiredSkills: ["Logistics", "Local Language"], volunteersNeeded: 5, volunteersSignedUp: 3, status: "Open", deadline: "2026-03-24T18:00:00Z" },
  { id: "TSK-002", issueId: "ISS-004", title: "Camp Management", description: "Help manage registration and sleeping arrangements at Patna relief camp.", requiredSkills: ["Coordination", "Patience"], volunteersNeeded: 8, volunteersSignedUp: 6, status: "In Progress", deadline: "2026-03-25T08:00:00Z" },
];

export const ngos: NGO[] = [
  { id: "NGO-001", name: "HelpBridge Foundation", focusArea: "Disaster Relief", activeIssues: 4, description: "Rapid response disaster relief and rehabilitation across India.", issuesHandled: 187, successRate: 92, avgResponseTime: "2h 30m", blocked: false, volunteerIds: ["VOL-001", "VOL-003", "VOL-007"], contactEmail: "help@helpbridge.org", location: "Delhi, India" },
  { id: "NGO-002", name: "GreenHands Trust", focusArea: "Environment & Water", activeIssues: 2, description: "Sustainable water supply and environmental restoration projects.", issuesHandled: 124, successRate: 88, avgResponseTime: "3h 45m", blocked: false, volunteerIds: ["VOL-004", "VOL-005"], contactEmail: "info@greenhands.org", location: "Jaipur, Rajasthan" },
  { id: "NGO-003", name: "CareLine Initiative", focusArea: "Healthcare", activeIssues: 3, description: "Emergency medical aid and healthcare access for underserved communities.", issuesHandled: 203, successRate: 95, avgResponseTime: "1h 50m", blocked: false, volunteerIds: ["VOL-002", "VOL-005", "VOL-008", "VOL-010"], contactEmail: "contact@careline.org", location: "Mumbai, Maharashtra" },
];

export const volunteers: Volunteer[] = [
  { id: "VOL-001", name: "Arjun Mehta", skills: ["First Aid", "Logistics"], available: true, responseRate: 94, reliabilityScore: 88, tasksCompleted: 32, coords: { x: 30, y: 40 }, blocked: false, location: "Delhi, India", assignedTasks: ["Deliver supplies to Camp A"], phone: "+91 98765 43210" },
  { id: "VOL-002", name: "Priya Sharma", skills: ["Medical", "Counseling"], available: true, responseRate: 97, reliabilityScore: 95, tasksCompleted: 48, coords: { x: 50, y: 60 }, blocked: false, location: "Mumbai, Maharashtra", assignedTasks: ["Medical aid at District Hospital"], phone: "+91 98765 43211" },
  { id: "VOL-003", name: "Ravi Kumar", skills: ["Driving", "Supply Chain"], available: false, responseRate: 78, reliabilityScore: 72, tasksCompleted: 21, coords: { x: 40, y: 35 }, blocked: false, location: "Jaipur, Rajasthan", assignedTasks: [], phone: "+91 98765 43212" },
  { id: "VOL-004", name: "Neha Gupta", skills: ["Teaching", "Communication"], available: true, responseRate: 91, reliabilityScore: 86, tasksCompleted: 27, coords: { x: 58, y: 45 }, blocked: false, location: "Pune, Maharashtra", assignedTasks: ["Coordinate relief camp communication"], phone: "+91 98765 43213" },
  { id: "VOL-005", name: "Sanjay Patel", skills: ["Construction", "Electrical"], available: true, responseRate: 85, reliabilityScore: 90, tasksCompleted: 39, coords: { x: 35, y: 55 }, blocked: false, location: "Ahmedabad, Gujarat", assignedTasks: ["Repair shelter tents"], phone: "+91 98765 43214" },
  { id: "VOL-006", name: "Ananya Reddy", skills: ["Data Entry", "Coordination"], available: false, responseRate: 82, reliabilityScore: 78, tasksCompleted: 15, coords: { x: 60, y: 70 }, blocked: false, location: "Hyderabad, Telangana", assignedTasks: [], phone: "+91 98765 43215" },
  { id: "VOL-007", name: "Vikram Singh", skills: ["Search & Rescue", "Navigation"], available: true, responseRate: 96, reliabilityScore: 93, tasksCompleted: 54, coords: { x: 25, y: 30 }, blocked: false, location: "Dehradun, Uttarakhand", assignedTasks: ["Search operations in flood zone"], phone: "+91 98765 43216" },
  { id: "VOL-008", name: "Fatima Khan", skills: ["Translation", "First Aid"], available: true, responseRate: 89, reliabilityScore: 84, tasksCompleted: 22, coords: { x: 48, y: 50 }, blocked: false, location: "Bhopal, Madhya Pradesh", assignedTasks: [], phone: "+91 98765 43217" },
  { id: "VOL-009", name: "Deepak Joshi", skills: ["Photography", "Documentation"], available: false, responseRate: 73, reliabilityScore: 68, tasksCompleted: 11, coords: { x: 42, y: 65 }, blocked: false, location: "Lucknow, Uttar Pradesh", assignedTasks: [], phone: "+91 98765 43218" },
  { id: "VOL-010", name: "Lakshmi Iyer", skills: ["Cooking", "Shelter Mgmt"], available: true, responseRate: 92, reliabilityScore: 91, tasksCompleted: 36, coords: { x: 55, y: 80 }, blocked: false, location: "Chennai, Tamil Nadu", assignedTasks: ["Manage food distribution at Camp B"], phone: "+91 98765 43219" },
];

export const alerts: Alert[] = [
  { id: "ALT-001", type: "disaster", title: "Flood Warning", message: "Heavy rainfall expected in Bihar and Jharkhand. River levels rising rapidly.", severity: "High", createdAt: "2026-03-23T06:00:00Z", details: "The meteorological department has issued a red alert for Bihar and Jharkhand. River Kosi and Gandak are flowing above danger mark. 15 districts are on high alert. NDRF teams deployed in 8 locations.", photos: [placeholderImage, placeholderImage], affectedArea: "Bihar, Jharkhand" },
  { id: "ALT-002", type: "weather", title: "Cyclone Alert", message: "Cyclonic storm approaching Tamil Nadu coast. Landfall expected in 48 hours.", severity: "High", createdAt: "2026-03-23T08:00:00Z", details: "Cyclone DANA has intensified into a severe cyclonic storm with wind speeds of 120-140 km/h. Coastal areas advised to evacuate. Fishermen warned not to venture into sea.", photos: [placeholderImage], affectedArea: "Tamil Nadu, Andhra Pradesh Coast" },
  { id: "ALT-003", type: "emergency", title: "Medical Emergency", message: "Blood bank shortage reported in 3 districts of Madhya Pradesh.", severity: "Medium", createdAt: "2026-03-23T09:30:00Z", details: "Critical blood shortage reported at district hospitals in Bhopal, Indore, and Jabalpur. O-negative and AB-positive blood types critically low. Blood donation camps being organized.", photos: [], affectedArea: "Madhya Pradesh" },
  { id: "ALT-004", type: "info", title: "Relief Camp Update", message: "New relief camp established in Patna. Capacity: 500 families.", severity: "Low", createdAt: "2026-03-23T10:00:00Z", details: "A new relief camp has been set up at Patna Stadium with capacity for 500 families. Facilities include medical aid, food distribution, and temporary shelter. Volunteers needed for camp management.", photos: [placeholderImage], affectedArea: "Patna, Bihar" },
  { id: "ALT-005", type: "weather", title: "Heatwave Advisory", message: "Temperatures exceeding 45°C expected in Rajasthan this week.", severity: "Medium", createdAt: "2026-03-23T07:00:00Z", details: "IMD has issued an orange alert for Rajasthan with temperatures expected to reach 47°C in western districts. Advisory to avoid outdoor activities between 11 AM - 4 PM. Water distribution points being set up.", photos: [], affectedArea: "Rajasthan" },
];

export const pastCrises: PastCrisis[] = [
  { id: "PC-001", title: "Kerala Flood Relief 2025", description: "Massive flooding in 8 districts of Kerala. Over 50,000 people displaced. Coordinated rescue and relief operations spanning 3 weeks.", resolvedByNgo: "NGO-001", resolvedByVolunteers: ["VOL-001", "VOL-003", "VOL-007"], responseTime: "45 min", livesImpacted: 52000, date: "2025-08-15", photos: [placeholderImage, placeholderImage, placeholderImage], category: "Disaster", location: "Kerala" },
  { id: "PC-002", title: "Cholera Outbreak Response", description: "Cholera outbreak in rural Bihar affecting 3 villages. Emergency medical teams deployed, water purification systems installed.", resolvedByNgo: "NGO-003", resolvedByVolunteers: ["VOL-002", "VOL-008"], responseTime: "1h 20m", livesImpacted: 8400, date: "2025-11-02", photos: [placeholderImage], category: "Health", location: "Bihar" },
  { id: "PC-003", title: "Cyclone Shelter Operations", description: "Cyclone Mocha preparedness and response. 12 emergency shelters activated, 15,000 people evacuated safely.", resolvedByNgo: "NGO-001", resolvedByVolunteers: ["VOL-005", "VOL-007", "VOL-010"], responseTime: "2h", livesImpacted: 15000, date: "2025-05-20", photos: [placeholderImage, placeholderImage], category: "Disaster", location: "Odisha" },
  { id: "PC-004", title: "Food Distribution Drive", description: "Emergency food distribution to 200 tribal villages during drought. 3-month sustained operation with daily supply runs.", resolvedByNgo: "NGO-002", resolvedByVolunteers: ["VOL-001", "VOL-004", "VOL-005"], responseTime: "3h", livesImpacted: 34000, date: "2025-03-10", photos: [placeholderImage], category: "Food", location: "Rajasthan" },
  { id: "PC-005", title: "Bridge Collapse Rescue", description: "Emergency rescue after bridge collapse on NH-44. 12 people trapped, all rescued within 6 hours.", resolvedByNgo: "NGO-001", resolvedByVolunteers: ["VOL-007", "VOL-003"], responseTime: "30 min", livesImpacted: 1200, date: "2026-01-18", photos: [placeholderImage, placeholderImage], category: "Infrastructure", location: "Maharashtra" },
];

export const safetyTips: SafetyTip[] = [
  { id: "ST-001", title: "During a Flood", content: "Move to higher ground immediately. Avoid walking through flowing water. 6 inches of moving water can knock you down. Keep emergency supplies ready.", category: "Disaster" },
  { id: "ST-002", title: "Earthquake Safety", content: "Drop, Cover, and Hold On. Stay away from windows and heavy furniture. If outdoors, move to an open area away from buildings.", category: "Disaster" },
  { id: "ST-003", title: "First Aid Basics", content: "Apply pressure to stop bleeding. Keep the injured person warm and calm. Call emergency services immediately for serious injuries.", category: "Health" },
  { id: "ST-004", title: "Emergency Kit Essentials", content: "Keep water (1 gallon per person per day), non-perishable food, flashlight, batteries, first aid kit, medications, and important documents.", category: "Preparedness" },
  { id: "ST-005", title: "Evacuation Planning", content: "Know your evacuation routes. Keep your vehicle fueled. Have a meeting point for family members. Carry ID and important documents.", category: "Preparedness" },
];

export const helplineNumbers = [
  { name: "National Disaster Response", number: "1078" },
  { name: "Police", number: "100" },
  { name: "Fire Brigade", number: "101" },
  { name: "Ambulance", number: "102" },
  { name: "Women Helpline", number: "1091" },
  { name: "Child Helpline", number: "1098" },
];

// =====================================================
// INVITE CODES (mock fallback for demo when DB unavailable)
// =====================================================
export interface InviteCodeMock {
  code: string;
  ngoId: string;
  ngoName: string;
  active: boolean;
}
export const mockInviteCodes: InviteCodeMock[] = [
  { code: "HELP2026", ngoId: "NGO-001", ngoName: "HelpBridge Foundation", active: true },
  { code: "GREEN2026", ngoId: "NGO-002", ngoName: "GreenHands Trust", active: true },
  { code: "CARE2026", ngoId: "NGO-003", ngoName: "CareLine Initiative", active: true },
];

// =====================================================
// COMMUNITY INTELLIGENCE: Polls & Discussions
// =====================================================

export interface PollOption {
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  issueId: string;
  question: string;
  options: PollOption[];
  active: boolean;
  createdAt: string;
}

export interface DiscussionComment {
  id: string;
  issueId: string;
  user: string;
  text: string;
  time: string; // ISO timestamp
  flagged?: boolean;
}

export interface AIWeights {
  voteWeight: number;
  pollWeight: number;
  discussionWeight: number;
}

export const defaultAIWeights: AIWeights = {
  voteWeight: 0.3,
  pollWeight: 0.4,
  discussionWeight: 0.2,
};

export const polls: Poll[] = [
  { id: "POLL-001", issueId: "ISS-001", question: "Is this flooding situation urgent?", active: true, createdAt: "2026-03-23T09:00:00Z",
    options: [{ label: "Yes, urgent", votes: 142 }, { label: "Can wait", votes: 18 }] },
  { id: "POLL-002", issueId: "ISS-004", question: "Should food relief be prioritized over shelter?", active: true, createdAt: "2026-03-23T06:00:00Z",
    options: [{ label: "Yes", votes: 230 }, { label: "No", votes: 42 }, { label: "Both equally", votes: 88 }] },
  { id: "POLL-003", issueId: "ISS-006", question: "Are medical supplies critically needed?", active: true, createdAt: "2026-03-22T22:00:00Z",
    options: [{ label: "Yes", votes: 178 }, { label: "Moderate", votes: 24 }] },
  { id: "POLL-004", issueId: "ISS-003", question: "Is water tanker frequency sufficient?", active: true, createdAt: "2026-03-22T08:00:00Z",
    options: [{ label: "No, need more", votes: 96 }, { label: "Yes", votes: 31 }] },
  { id: "POLL-005", issueId: "ISS-002", question: "Should the community center be rebuilt this month?", active: false, createdAt: "2026-03-22T15:00:00Z",
    options: [{ label: "Yes", votes: 67 }, { label: "Wait next quarter", votes: 22 }] },
];

export const discussions: DiscussionComment[] = [
  { id: "DSC-001", issueId: "ISS-001", user: "Rahul", text: "Water level rising quickly near sector 14 — need rescue boats.", time: "2026-03-23T09:10:00Z" },
  { id: "DSC-002", issueId: "ISS-001", user: "Priya M.", text: "My elderly parents are stuck on the second floor. Please help.", time: "2026-03-23T09:25:00Z" },
  { id: "DSC-003", issueId: "ISS-004", user: "Deepa", text: "Children at the camp haven't eaten since morning.", time: "2026-03-23T07:15:00Z" },
  { id: "DSC-004", issueId: "ISS-004", user: "Anonymous", text: "We can donate 200 meal packets by evening. Coordinate?", time: "2026-03-23T08:00:00Z" },
  { id: "DSC-005", issueId: "ISS-006", user: "Dr. Nisha", text: "IV fluids running out within 4 hours. URGENT.", time: "2026-03-23T05:30:00Z" },
  { id: "DSC-006", issueId: "ISS-003", user: "Ravi K.", text: "36 hours without water. Tankers haven't reached our ward.", time: "2026-03-22T18:00:00Z" },
  { id: "DSC-007", issueId: "ISS-002", user: "Sneha", text: "Debris cleared from footpath today, thanks volunteers!", time: "2026-03-23T11:00:00Z" },
  { id: "DSC-008", issueId: "ISS-005", user: "Suresh", text: "Power still out in ward 8. Hospitals on backup generators.", time: "2026-03-23T10:30:00Z" },
];
