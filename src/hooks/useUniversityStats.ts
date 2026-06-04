'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UNIVERSITY_COORDS,
  findUniversityCoord,
  type UniversityNode,
} from '@/lib/universityData';

/**
 * Queries the profiles table grouped by `college` to produce
 * real builder counts and top skills for each university.
 * Universities with 0 users get dimmed markers.
 */
export function useUniversityStats() {
  // Initialize with all known universities (dimmed) so the globe is populated
  // immediately while the async query fetches real data
  const [universities, setUniversities] = useState<UniversityNode[]>(() => buildDefaultNodes());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      // 1. Fetch all profiles with their college and skills
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, college');

      if (error) {
        console.warn('Failed to fetch profiles for university stats:', error.message);
        // Fall back to empty counts for all known universities
        setUniversities(buildDefaultNodes());
        return;
      }

      // 2. Group profiles by resolved university coord ID
      // (e.g. "IIT Bombay" and "iit b" both resolve to coord.id = 'iitb')
      const coordGroups = new Map<string, string[]>(); // coordId -> profile_ids[]
      const profileToCoordId = new Map<string, string>();

      for (const p of profiles || []) {
        if (!p.college) continue;
        const coord = findUniversityCoord(p.college);
        if (!coord) continue; // College not in our known list — skip
        const existing = coordGroups.get(coord.id) || [];
        existing.push(p.id);
        coordGroups.set(coord.id, existing);
        profileToCoordId.set(p.id, coord.id);
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
        const coord = UNIVERSITY_COORDS.find(c => c.id === coordId);
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

      // 5. Add remaining universities with 0 builders (dimmed)
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
