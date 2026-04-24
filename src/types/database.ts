export type VerificationStatus = string; // 'pending' | 'verified' | 'rejected'
export type VolunteerType = string; // 'basic' | 'verified' | 'ngo_verified'
export type AppRole = 'admin' | 'ngo' | 'volunteer' | 'public';

export interface UserProfile {
  id: string;
  email: string | null;
  role: AppRole;
  blocked: boolean;
  created_at: string;
}

export interface NGODetails {
  id: string;
  ngo_name: string;
  registration_number: string;
  darpan_id: string | null;
  pan_tax_id: string;
  ngo_type?: string | null;
  document_url: string | null;
  video_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string | null;
    blocked: boolean;
  };
}

export interface VolunteerDetails {
  id: string;
  full_name: string;
  skills: string[];
  type: VolunteerType;
  verification_status: VerificationStatus;
  trust_score: number;
  reliability_score: number;
  tasks_completed: number;
  availability: boolean;
  blocked: boolean;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerJoinRequest {
  id: string;
  volunteer_id: string;
  ngo_id: string;
  status: VerificationStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields if any
  volunteer_details?: VolunteerDetails;
}
