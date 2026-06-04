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
  /** Alternate names, abbreviations, and keywords users might type */
  aliases: string[];
}

export const UNIVERSITY_COORDS: UniversityCoord[] = [
  { id: 'iitb', name: 'IIT Bombay', shortName: 'IIT-B', city: 'Mumbai', lat: 19.0760, lng: 72.8777,
    aliases: ['iit bombay', 'iitb', 'iit-b', 'iit b', 'indian institute of technology bombay', 'iit mumbai'] },
  { id: 'iitd', name: 'IIT Delhi', shortName: 'IIT-D', city: 'New Delhi', lat: 28.5460, lng: 77.1855,
    aliases: ['iit delhi', 'iitd', 'iit-d', 'iit d', 'indian institute of technology delhi'] },
  { id: 'iitm', name: 'IIT Madras', shortName: 'IIT-M', city: 'Chennai', lat: 12.9916, lng: 80.2336,
    aliases: ['iit madras', 'iitm', 'iit-m', 'iit m', 'indian institute of technology madras', 'iit chennai'] },
  { id: 'iitk', name: 'IIT Kanpur', shortName: 'IIT-K', city: 'Kanpur', lat: 26.5123, lng: 80.2329,
    aliases: ['iit kanpur', 'iitk', 'iit-k', 'iit k', 'indian institute of technology kanpur'] },
  { id: 'iitkgp', name: 'IIT Kharagpur', shortName: 'IIT-KGP', city: 'Kharagpur', lat: 22.3149, lng: 87.3105,
    aliases: ['iit kharagpur', 'iitkgp', 'iit-kgp', 'iit kgp', 'indian institute of technology kharagpur'] },
  { id: 'bits', name: 'BITS Pilani', shortName: 'BITS', city: 'Pilani', lat: 28.3625, lng: 75.5870,
    aliases: ['bits pilani', 'bits', 'birla institute of technology and science', 'bits goa', 'bits hyderabad', 'bits hyd'] },
  { id: 'iiith', name: 'IIIT Hyderabad', shortName: 'IIIT-H', city: 'Hyderabad', lat: 17.4455, lng: 78.3489,
    aliases: ['iiit hyderabad', 'iiith', 'iiit-h', 'iiit h', 'iiit hyd', 'international institute of information technology hyderabad'] },
  { id: 'nitt', name: 'NIT Trichy', shortName: 'NIT-T', city: 'Tiruchirappalli', lat: 10.7590, lng: 78.8129,
    aliases: ['nit trichy', 'nitt', 'nit-t', 'nit t', 'nit tiruchirappalli', 'national institute of technology tiruchirappalli'] },
  { id: 'vit', name: 'VIT Vellore', shortName: 'VIT', city: 'Vellore', lat: 12.9692, lng: 79.1559,
    aliases: ['vit vellore', 'vit', 'vit university', 'vellore institute of technology', 'vit chennai', 'vit bhopal', 'vit ap'] },
  { id: 'srm', name: 'SRM University', shortName: 'SRM', city: 'Chennai', lat: 12.8231, lng: 80.0441,
    aliases: ['srm university', 'srm', 'srm institute', 'srmist', 'srm chennai', 'srm kattankulathur'] },
  { id: 'lpu', name: 'LPU', shortName: 'LPU', city: 'Phagwara', lat: 31.2532, lng: 75.7024,
    aliases: ['lpu', 'lovely professional university', 'lovely professional'] },
  { id: 'dtu', name: 'DTU Delhi', shortName: 'DTU', city: 'New Delhi', lat: 28.7499, lng: 77.1170,
    aliases: ['dtu', 'dtu delhi', 'delhi technological university', 'delhi tech', 'dce'] },
  { id: 'nsut', name: 'NSUT Delhi', shortName: 'NSUT', city: 'New Delhi', lat: 28.6090, lng: 77.0380,
    aliases: ['nsut', 'nsut delhi', 'netaji subhas university of technology', 'nsit'] },
  { id: 'pec', name: 'PEC Chandigarh', shortName: 'PEC', city: 'Chandigarh', lat: 30.7600, lng: 76.7644,
    aliases: ['pec chandigarh', 'pec', 'punjab engineering college'] },
  { id: 'iisc', name: 'IISc Bangalore', shortName: 'IISc', city: 'Bangalore', lat: 13.0219, lng: 77.5671,
    aliases: ['iisc', 'iisc bangalore', 'iisc bengaluru', 'indian institute of science'] },
  { id: 'iiitb', name: 'IIIT Bangalore', shortName: 'IIIT-B', city: 'Bangalore', lat: 12.8449, lng: 77.6632,
    aliases: ['iiit bangalore', 'iiitb', 'iiit-b', 'iiit b', 'iiit bengaluru'] },
  { id: 'coep', name: 'COEP Pune', shortName: 'COEP', city: 'Pune', lat: 18.5293, lng: 73.8568,
    aliases: ['coep', 'coep pune', 'college of engineering pune', 'coep technological university'] },
  { id: 'nitw', name: 'NIT Warangal', shortName: 'NIT-W', city: 'Warangal', lat: 17.9784, lng: 79.5301,
    aliases: ['nit warangal', 'nitw', 'nit-w', 'nit w', 'national institute of technology warangal'] },
  { id: 'nitk', name: 'NIT Surathkal', shortName: 'NIT-K', city: 'Mangalore', lat: 13.0109, lng: 74.7942,
    aliases: ['nit surathkal', 'nitk', 'nit-k', 'nit k', 'nit mangalore', 'national institute of technology karnataka'] },
  { id: 'iiita', name: 'IIIT Allahabad', shortName: 'IIIT-A', city: 'Prayagraj', lat: 25.4358, lng: 81.8463,
    aliases: ['iiit allahabad', 'iiita', 'iiit-a', 'iiit a', 'iiit prayagraj'] },
  // Additional popular colleges
  { id: 'jntu', name: 'JNTU Hyderabad', shortName: 'JNTU', city: 'Hyderabad', lat: 17.4933, lng: 78.3914,
    aliases: ['jntu', 'jntu hyderabad', 'jntuh', 'jntu-h', 'jawaharlal nehru technological university'] },
  { id: 'manipal', name: 'Manipal University', shortName: 'MIT', city: 'Manipal', lat: 13.3525, lng: 74.7928,
    aliases: ['manipal', 'manipal university', 'mit manipal', 'manipal institute of technology', 'mahe'] },
  { id: 'amity', name: 'Amity University', shortName: 'Amity', city: 'Noida', lat: 28.5440, lng: 77.3340,
    aliases: ['amity', 'amity university', 'amity noida'] },
  { id: 'thapar', name: 'Thapar University', shortName: 'Thapar', city: 'Patiala', lat: 30.3530, lng: 76.3720,
    aliases: ['thapar', 'thapar university', 'thapar institute', 'tiet'] },
  { id: 'rvce', name: 'RV College of Engineering', shortName: 'RVCE', city: 'Bangalore', lat: 12.9237, lng: 77.4987,
    aliases: ['rvce', 'rv college', 'rv college of engineering', 'rvu'] },
  { id: 'pesit', name: 'PES University', shortName: 'PES', city: 'Bangalore', lat: 12.9346, lng: 77.5357,
    aliases: ['pes', 'pes university', 'pesit', 'pesu', 'pes bangalore'] },
  { id: 'christ', name: 'Christ University', shortName: 'Christ', city: 'Bangalore', lat: 12.9354, lng: 77.6050,
    aliases: ['christ', 'christ university', 'christ bangalore'] },
  { id: 'kiit', name: 'KIIT University', shortName: 'KIIT', city: 'Bhubaneswar', lat: 20.3541, lng: 85.8144,
    aliases: ['kiit', 'kiit university', 'kalinga institute of industrial technology'] },
  { id: 'iitr', name: 'IIT Roorkee', shortName: 'IIT-R', city: 'Roorkee', lat: 29.8644, lng: 77.8960,
    aliases: ['iit roorkee', 'iitr', 'iit-r', 'iit r', 'indian institute of technology roorkee'] },
  { id: 'iitg', name: 'IIT Guwahati', shortName: 'IIT-G', city: 'Guwahati', lat: 26.1928, lng: 91.6959,
    aliases: ['iit guwahati', 'iitg', 'iit-g', 'iit g', 'indian institute of technology guwahati'] },
  { id: 'iith', name: 'IIT Hyderabad', shortName: 'IIT-H', city: 'Hyderabad', lat: 17.5921, lng: 78.1232,
    aliases: ['iit hyderabad', 'iith', 'iit-h', 'indian institute of technology hyderabad'] },
  { id: 'iitbhu', name: 'IIT BHU Varanasi', shortName: 'IIT-BHU', city: 'Varanasi', lat: 25.2677, lng: 82.9913,
    aliases: ['iit bhu', 'iitbhu', 'iit-bhu', 'iit varanasi', 'bhu', 'banaras hindu university'] },
];

/**
 * Matches a free-text college name against our known universities.
 * Uses alias-based matching (case-insensitive) for robust fuzzy matching.
 */
export function findUniversityCoord(collegeName: string): UniversityCoord | undefined {
  const normalized = collegeName.toLowerCase().trim();
  if (!normalized) return undefined;

  // 1. Exact alias match (highest priority)
  for (const u of UNIVERSITY_COORDS) {
    if (u.aliases.some(alias => alias === normalized)) {
      return u;
    }
  }

  // 2. Input contains an alias or alias contains input
  for (const u of UNIVERSITY_COORDS) {
    if (u.aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return u;
    }
  }

  // 3. Name/shortName fallback
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
