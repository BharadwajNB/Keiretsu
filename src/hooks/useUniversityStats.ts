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
  const [universities, setUniversities] = useState<UniversityNode[]>([]);
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

      // 2. Group profiles by college
      const collegeGroups = new Map<string, string[]>(); // college -> profile_ids[]
      for (const p of profiles || []) {
        if (!p.college) continue;
        const existing = collegeGroups.get(p.college) || [];
        existing.push(p.id);
        collegeGroups.set(p.college, existing);
      }

      // 3. Fetch skills for all profile IDs that have a matching university
      const matchedProfileIds: string[] = [];
      const profileToCollege = new Map<string, string>();

      for (const [college, ids] of collegeGroups) {
        const coord = findUniversityCoord(college);
        if (coord) {
          matchedProfileIds.push(...ids);
          for (const id of ids) {
            profileToCollege.set(id, college);
          }
        }
      }

      // Build skills map: college -> skill counts
      const collegeSkillCounts = new Map<string, Map<string, number>>();

      if (matchedProfileIds.length > 0) {
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('profile_id, skills(name)')
          .in('profile_id', matchedProfileIds);

        for (const row of skillData || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const skillName = (row as any).skills?.name;
          const college = profileToCollege.get(row.profile_id);
          if (!skillName || !college) continue;

          if (!collegeSkillCounts.has(college)) {
            collegeSkillCounts.set(college, new Map());
          }
          const skillMap = collegeSkillCounts.get(college)!;
          skillMap.set(skillName, (skillMap.get(skillName) || 0) + 1);
        }
      }

      // 4. Build UniversityNode array
      const nodes: UniversityNode[] = [];
      const usedCoordIds = new Set<string>();

      for (const [college, ids] of collegeGroups) {
        const coord = findUniversityCoord(college);
        if (!coord) continue; // College not in our known list
        usedCoordIds.add(coord.id);

        // Top 3 skills by frequency
        const skillMap = collegeSkillCounts.get(college);
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
          color: ids.length > 0 ? '#818cf8' : '#555555',
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
