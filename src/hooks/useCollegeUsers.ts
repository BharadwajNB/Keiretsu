'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { findUniversityCoord, type UniversityCoord } from '@/lib/universityData';
import type { Profile } from '@/lib/types';

interface PostgrestProfile {
  id: string;
  user_id: string;
  name: string;
  college: string;
  year: number;
  bio: string;
  avatar_url: string;
  github_url: string;
  availability_status: string;
  location: string | null;
  profile_skills?: Array<{
    skills?: {
      name: string;
    } | null;
  }>;
}

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
 * Adds a small random offset to coordinates so overlapping markers
 * spread out visually inside the community circle.
 */
function jitterCoord(lat: number, lng: number, index: number): { lat: number; lng: number } {
  const angle = (index * 137.508) * (Math.PI / 180); // golden angle spread
  const radius = 0.003 + (index * 0.001); // ~300m base + incremental
  return {
    lat: lat + radius * Math.cos(angle),
    lng: lng + radius * Math.sin(angle),
  };
}

export interface CollegeCircleData {
  coord: UniversityCoord;
  users: Profile[];
  topSkills: string[];
}

/**
 * Fetches all users belonging to a specific college, resolves their
 * coordinates from the location column, and jitters overlapping positions.
 */
export function useCollegeUsers() {
  const [data, setData] = useState<CollegeCircleData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCollegeUsers = useCallback(async (collegeName: string, coord: UniversityCoord) => {
    setLoading(true);

    const supabase = createClient();

    try {
      // Fetch all profiles and filter by college match client-side
      // (since college is free-text and we need fuzzy matching)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          college,
          year,
          bio,
          avatar_url,
          github_url,
          availability_status,
          location,
          profile_skills (
            skills (
              name
            )
          )
        `);

      if (error) {
        console.warn('Failed to fetch college users:', error.message);
        setData(null);
        return;
      }

      const typedProfiles = (profiles || []) as unknown as PostgrestProfile[];

      // Filter profiles whose college resolves to the same university coord
      const matchedUsers: Profile[] = [];
      const skillCounts = new Map<string, number>();
      let jitterIndex = 0;

      for (const p of typedProfiles) {
        if (!p.college) continue;
        const resolved = findUniversityCoord(p.college);

        // Match if resolved to same static coord, or if college name matches directly
        const isMatch = resolved?.id === coord.id ||
          p.college.toLowerCase().trim() === collegeName.toLowerCase().trim();

        if (!isMatch) continue;

        // Parse location
        let lat = coord.lat;
        let lng = coord.lng;
        if (p.location) {
          const parsed = parseWkbPoint(p.location);
          if (parsed) {
            lat = parsed.lat;
            lng = parsed.lng;
          }
        }

        // Apply jitter so markers don't stack
        const jittered = jitterCoord(lat, lng, jitterIndex++);

        const skills = p.profile_skills
          ?.map(ps => ps.skills?.name)
          .filter((name): name is string => !!name) || [];

        // Count skills for top skills
        for (const s of skills) {
          skillCounts.set(s, (skillCounts.get(s) || 0) + 1);
        }

        matchedUsers.push({
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          college: p.college,
          year: p.year,
          bio: p.bio,
          avatar_url: p.avatar_url,
          github_url: p.github_url,
          availability_status: p.availability_status as Profile['availability_status'],
          latitude: jittered.lat,
          longitude: jittered.lng,
          skills,
          created_at: '',
          updated_at: '',
        });
      }

      const topSkills = [...skillCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      setData({
        coord,
        users: matchedUsers,
        topSkills,
      });
    } catch (err) {
      console.warn('useCollegeUsers error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
  }, []);

  return { collegeData: data, collegeLoading: loading, fetchCollegeUsers, clearCollege: clear };
}
