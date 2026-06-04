'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UNIVERSITY_COORDS,
  findUniversityCoord,
  type UniversityNode,
} from '@/lib/universityData';

/**
 * Decodes PostGIS geometry point hex string into lat/lng coordinates.
 */
function parseWkbPoint(wkbHex: string): { lat: number; lng: number } | null {
  if (!wkbHex || wkbHex.length < 50) return null;
  const xHex = wkbHex.slice(18, 34);
  const yHex = wkbHex.slice(34, 50);

  const hexToDouble = (hex: string) => {
    const bytes = new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
    const view = new DataView(bytes.buffer);
    return view.getFloat64(0, true);
  };

  try {
    const lng = hexToDouble(xHex);
    const lat = hexToDouble(yHex);
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Queries the profiles table grouped by `college` to produce
 * real builder counts and top skills for each university.
 * Predefined universities with 0 users get dimmed markers.
 * Registered universities not in our static list are dynamically placed using profile location.
 */
export function useUniversityStats() {
  // Initialize with all known static universities (dimmed) so the globe is populated
  // immediately while the async query fetches real data
  const [universities, setUniversities] = useState<UniversityNode[]>(() => buildDefaultNodes());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      // 1. Fetch all profiles with their college and location
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, college, location');

      if (error) {
        console.warn('Failed to fetch profiles for university stats:', error.message);
        setUniversities(buildDefaultNodes());
        return;
      }

      // 2. Group profiles by resolved university ID
      // If college is static: group by static university ID
      // If college is custom/unknown: dynamic resolved coordinates from profiles
      const coordGroups = new Map<string, string[]>(); // ID -> profile_ids[]
      const profileToCoordId = new Map<string, string>();
      const dynamicColleges = new Map<string, { id: string; name: string; shortName: string; city: string; lat: number; lng: number }>();

      for (const p of profiles || []) {
        if (!p.college) continue;
        
        const coord = findUniversityCoord(p.college);
        if (coord) {
          const existing = coordGroups.get(coord.id) || [];
          existing.push(p.id);
          coordGroups.set(coord.id, existing);
          profileToCoordId.set(p.id, coord.id);
        } else if (p.location) {
          const parsedCoords = parseWkbPoint(p.location);
          if (parsedCoords) {
            const normalizedCollege = p.college.trim();
            const collegeKey = normalizedCollege.toLowerCase();
            const dynamicId = `dynamic_${collegeKey.replace(/[^a-z0-9]/g, '_')}`;

            if (!dynamicColleges.has(collegeKey)) {
              const displayName = normalizedCollege
                .split(/\s+/)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              dynamicColleges.set(collegeKey, {
                id: dynamicId,
                name: displayName,
                shortName: displayName,
                city: 'India',
                lat: parsedCoords.lat,
                lng: parsedCoords.lng,
              });
            }

            const existing = coordGroups.get(dynamicId) || [];
            existing.push(p.id);
            coordGroups.set(dynamicId, existing);
            profileToCoordId.set(p.id, dynamicId);
          }
        }
      }

      // 3. Fetch skills for all matched profile IDs
      const allMatchedIds = [...profileToCoordId.keys()];
      const coordSkillCounts = new Map<string, Map<string, number>>();

      if (allMatchedIds.length > 0) {
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('profile_id, skills(name)')
          .in('profile_id', allMatchedIds);

        for (const row of skillData || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const skillName = (row as any).skills?.name;
          const coordId = profileToCoordId.get(row.profile_id);
          if (!skillName || !coordId) continue;

          if (!coordSkillCounts.has(coordId)) {
            coordSkillCounts.set(coordId, new Map());
          }
          const skillMap = coordSkillCounts.get(coordId)!;
          skillMap.set(skillName, (skillMap.get(skillName) || 0) + 1);
        }
      }

      // 4. Build UniversityNode array from resolved groups
      const nodes: UniversityNode[] = [];
      const usedCoordIds = new Set<string>();

      for (const [coordId, ids] of coordGroups) {
        let coord = UNIVERSITY_COORDS.find(c => c.id === coordId);
        
        // If not predefined, find it in dynamic colleges map
        if (!coord) {
          const dynamicMatch = [...dynamicColleges.values()].find(c => c.id === coordId);
          if (dynamicMatch) {
            coord = {
              id: dynamicMatch.id,
              name: dynamicMatch.name,
              shortName: dynamicMatch.shortName,
              city: dynamicMatch.city,
              lat: dynamicMatch.lat,
              lng: dynamicMatch.lng,
              aliases: [],
            };
          }
        }

        if (!coord) continue;
        usedCoordIds.add(coord.id);

        // Top 3 skills by frequency
        const skillMap = coordSkillCounts.get(coordId);
        const topSkills = skillMap
          ? [...skillMap.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name)
          : [];

        nodes.push({
          id: coord.id,
          name: coord.name,
          shortName: coord.shortName,
          city: coord.city,
          lat: coord.lat,
          lng: coord.lng,
          builderCount: ids.length,
          topSkills,
          color: '#818cf8',
        });
      }

      // 5. Add remaining predefined universities with 0 builders (dimmed)
      for (const coord of UNIVERSITY_COORDS) {
        if (usedCoordIds.has(coord.id)) continue;
        nodes.push({
          id: coord.id,
          name: coord.name,
          shortName: coord.shortName,
          city: coord.city,
          lat: coord.lat,
          lng: coord.lng,
          builderCount: 0,
          topSkills: [],
          color: '#555555',
        });
      }

      setUniversities(nodes);
    } catch (err) {
      console.warn('useUniversityStats error:', err);
      setUniversities(buildDefaultNodes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { universities, loading, refresh: load };
}

/** Fallback: all known universities with 0 builders */
function buildDefaultNodes(): UniversityNode[] {
  return UNIVERSITY_COORDS.map(coord => ({
    id: coord.id,
    name: coord.name,
    shortName: coord.shortName,
    city: coord.city,
    lat: coord.lat,
    lng: coord.lng,
    builderCount: 0,
    topSkills: [],
    color: '#555555',
  }));
}

