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
  const angle = (index * 135) * (Math.PI / 180);
  const radius = 0.005 + (index * 0.002); // ~550m base + 220m incremental
  return {
    lat: lat + radius * Math.cos(angle),
    lng: lng + radius * Math.sin(angle),
  };
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
}

export interface CollegeCircleData {
  coord: UniversityCoord;
  users: Profile[];
  topSkills: string[];
  usersByZone: {
    primary: Profile[];
    secondary: Profile[];
    tertiary: Profile[];
  };
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

      const matchedUsers: Profile[] = [];
      const primaryUsers: Profile[] = [];
      const secondaryUsers: Profile[] = [];
      const tertiaryUsers: Profile[] = [];
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
        const hasCustomLoc = !!p.location;
        let lat = coord.lat;
        let lng = coord.lng;
        if (p.location) {
          const parsed = parseWkbPoint(p.location);
          if (parsed) {
            lat = parsed.lat;
            lng = parsed.lng;
          }
        }

        // Calculate distance of actual coordinates from university center
        let distanceKm = p.location ? getDistanceKm(coord.lat, coord.lng, lat, lng) : 999;

        // If they don't have custom coordinates, or their custom coordinates are outside the community circle (> 5km),
        // we dynamically project them into the community circle so they are scattered across the zones!
        const needsProjection = !hasCustomLoc || distanceKm > 5.0;

        let jittered;
        if (needsProjection) {
          const tier = jitterIndex % 3;
          let minR = 0.004; // ~440m (Primary)
          let maxR = 0.010;  // ~1.1km
          if (tier === 1) {
            minR = 0.016; // ~1.7km (Secondary)
            maxR = 0.026; // ~2.8km
          } else if (tier === 2) {
            minR = 0.032; // ~3.5km (Tertiary)
            maxR = 0.044; // ~4.8km
          }
          const angle = (jitterIndex * 135) * (Math.PI / 180);
          const r = minR + (Math.random() * (maxR - minR));
          jittered = {
            lat: coord.lat + r * Math.cos(angle),
            lng: coord.lng + r * Math.sin(angle),
          };
          distanceKm = getDistanceKm(coord.lat, coord.lng, jittered.lat, jittered.lng);
        } else {
          jittered = jitterCoord(lat, lng, jitterIndex);
          distanceKm = getDistanceKm(coord.lat, coord.lng, jittered.lat, jittered.lng);
        }
        jitterIndex++;

        const skills = p.profile_skills
          ?.map(ps => ps.skills?.name)
          .filter((name): name is string => !!name) || [];

        // Count skills for top skills
        for (const s of skills) {
          skillCounts.set(s, (skillCounts.get(s) || 0) + 1);
        }

        const profile: Profile = {
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
          distance_km: distanceKm,
          skills,
          created_at: '',
          updated_at: '',
        };

        matchedUsers.push(profile);

        // Group by zone
        if (distanceKm <= 1.2) {
          primaryUsers.push(profile);
        } else if (distanceKm <= 3.0) {
          secondaryUsers.push(profile);
        } else {
          tertiaryUsers.push(profile);
        }
      }

      const topSkills = [...skillCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      setData({
        coord,
        users: matchedUsers,
        topSkills,
        usersByZone: {
          primary: primaryUsers,
          secondary: secondaryUsers,
          tertiary: tertiaryUsers,
        },
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
