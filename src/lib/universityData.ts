export interface UniversityNode {
  id: string;
  name: string;
  shortName: string;
  city: string;
  lat: number;
  lng: number;
  builderCount: number;
  topSkills: string[];
  color: string;
}

/**
 * Static coordinate lookup for known universities.
 * These do NOT contain live stats — those are filled at runtime
 * by the useUniversityStats hook querying the profiles table.
 */
export interface UniversityCoord {
  id: string;
  name: string;
  shortName: string;
  city: string;
  lat: number;
  lng: number;
}

export const UNIVERSITY_COORDS: UniversityCoord[] = [
  { id: 'iitb', name: 'IIT Bombay', shortName: 'IIT-B', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { id: 'iitd', name: 'IIT Delhi', shortName: 'IIT-D', city: 'New Delhi', lat: 28.5460, lng: 77.1855 },
  { id: 'iitm', name: 'IIT Madras', shortName: 'IIT-M', city: 'Chennai', lat: 12.9916, lng: 80.2336 },
  { id: 'iitk', name: 'IIT Kanpur', shortName: 'IIT-K', city: 'Kanpur', lat: 26.5123, lng: 80.2329 },
  { id: 'iitkgp', name: 'IIT Kharagpur', shortName: 'IIT-KGP', city: 'Kharagpur', lat: 22.3149, lng: 87.3105 },
  { id: 'bits', name: 'BITS Pilani', shortName: 'BITS', city: 'Pilani', lat: 28.3625, lng: 75.5870 },
  { id: 'iiith', name: 'IIIT Hyderabad', shortName: 'IIIT-H', city: 'Hyderabad', lat: 17.4455, lng: 78.3489 },
  { id: 'nitt', name: 'NIT Trichy', shortName: 'NIT-T', city: 'Tiruchirappalli', lat: 10.7590, lng: 78.8129 },
  { id: 'vit', name: 'VIT Vellore', shortName: 'VIT', city: 'Vellore', lat: 12.9692, lng: 79.1559 },
  { id: 'srm', name: 'SRM University', shortName: 'SRM', city: 'Chennai', lat: 12.8231, lng: 80.0441 },
  { id: 'lpu', name: 'LPU', shortName: 'LPU', city: 'Phagwara', lat: 31.2532, lng: 75.7024 },
  { id: 'dtu', name: 'DTU Delhi', shortName: 'DTU', city: 'New Delhi', lat: 28.7499, lng: 77.1170 },
  { id: 'nsut', name: 'NSUT Delhi', shortName: 'NSUT', city: 'New Delhi', lat: 28.6090, lng: 77.0380 },
  { id: 'pec', name: 'PEC Chandigarh', shortName: 'PEC', city: 'Chandigarh', lat: 30.7600, lng: 76.7644 },
  { id: 'iisc', name: 'IISc Bangalore', shortName: 'IISc', city: 'Bangalore', lat: 13.0219, lng: 77.5671 },
  { id: 'iiitb', name: 'IIIT Bangalore', shortName: 'IIIT-B', city: 'Bangalore', lat: 12.8449, lng: 77.6632 },
  { id: 'coep', name: 'COEP Pune', shortName: 'COEP', city: 'Pune', lat: 18.5293, lng: 73.8568 },
  { id: 'nitw', name: 'NIT Warangal', shortName: 'NIT-W', city: 'Warangal', lat: 17.9784, lng: 79.5301 },
  { id: 'nitk', name: 'NIT Surathkal', shortName: 'NIT-K', city: 'Mangalore', lat: 13.0109, lng: 74.7942 },
  { id: 'iiita', name: 'IIIT Allahabad', shortName: 'IIIT-A', city: 'Prayagraj', lat: 25.4358, lng: 81.8463 },
];

/**
 * Builds a lookup map from college name → coordinates.
 * Used by useUniversityStats to map profile.college values to lat/lng.
 * Matches are case-insensitive and support partial matching.
 */
export function findUniversityCoord(collegeName: string): UniversityCoord | undefined {
  const normalized = collegeName.toLowerCase().trim();
  return UNIVERSITY_COORDS.find(u => {
    const nameMatch = u.name.toLowerCase();
    const shortMatch = u.shortName.toLowerCase();
    return normalized.includes(nameMatch) || normalized.includes(shortMatch)
      || nameMatch.includes(normalized) || shortMatch.includes(normalized);
  });
}

// Network arcs connecting universities — visual flair showing collaboration
export interface NetworkArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

export const NETWORK_ARCS: NetworkArc[] = [
  { startLat: 19.0760, startLng: 72.8777, endLat: 28.5460, endLng: 77.1855, color: 'rgba(129,140,248,0.25)' },
  { startLat: 12.9916, startLng: 80.2336, endLat: 13.0219, endLng: 77.5671, color: 'rgba(129,140,248,0.25)' },
  { startLat: 28.3625, startLng: 75.5870, endLat: 26.5123, endLng: 80.2329, color: 'rgba(129,140,248,0.20)' },
  { startLat: 17.4455, startLng: 78.3489, endLat: 12.8449, endLng: 77.6632, color: 'rgba(129,140,248,0.20)' },
  { startLat: 22.3149, startLng: 87.3105, endLat: 25.4358, endLng: 81.8463, color: 'rgba(129,140,248,0.15)' },
  { startLat: 31.2532, startLng: 75.7024, endLat: 30.7600, endLng: 76.7644, color: 'rgba(129,140,248,0.20)' },
  { startLat: 10.7590, startLng: 78.8129, endLat: 12.9692, endLng: 79.1559, color: 'rgba(129,140,248,0.15)' },
  { startLat: 18.5293, startLng: 73.8568, endLat: 19.0760, endLng: 72.8777, color: 'rgba(129,140,248,0.20)' },
];
