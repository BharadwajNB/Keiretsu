export interface Profile {
  id: string;
  user_id: string;
  name: string;
  college: string;
  year: number;
  bio: string;
  avatar_url: string;
  github_url: string;
  availability_status: AvailabilityStatus;
  latitude?: number;
  longitude?: number;
  location_updated_at?: string;
  created_at: string;
  updated_at: string;
  skills?: string[];
  distance_km?: number;
}

export type AvailabilityStatus = 'open_to_collab' | 'busy' | 'looking_for_cofounder';

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface NearbyUserParams {
  lat: number;
  lng: number;
  radiusKm: number;
  skillFilter?: string[];
  collegeFilter?: string;
  nameSearch?: string;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  open_to_collab: 'Open to Collab',
  busy: 'Busy',
  looking_for_cofounder: 'Looking for Co-founder',
};

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  open_to_collab: '#22c55e',
  busy: '#ef4444',
  looking_for_cofounder: '#f59e0b',
};

export const SKILL_CATEGORIES: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  language: 'Languages',
  database: 'Database',
  ai: 'AI / ML',
  data: 'Data',
  mobile: 'Mobile',
  devops: 'DevOps',
  design: 'Design',
  web3: 'Web3',
  security: 'Security',
  general: 'General',
};
