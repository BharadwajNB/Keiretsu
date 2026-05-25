'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, NearbyUserParams } from '@/lib/types';

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
  created_at: string;
  updated_at: string;
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

export function useNearbyUsers(params: NearbyUserParams | null) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchNearbyUsers = useCallback(async () => {
    if (!params || !params.lat || !params.lng) return;

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_nearby_users', {
      user_lat: params.lat,
      user_lng: params.lng,
      radius_km: params.radiusKm,
      skill_filter: null,
      college_filter: null,
      name_search: null,
    });

    let rawUsers: Profile[] = [];

    if (!rpcError && data && data.length > 0) {
      rawUsers = (data || []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        user_id: (u.user_id as string) || '',
        name: u.name as string,
        college: u.college as string,
        year: u.year as number,
        bio: u.bio as string,
        avatar_url: u.avatar_url as string,
        github_url: u.github_url as string,
        availability_status: u.availability_status as Profile['availability_status'],
        latitude: u.latitude as number,
        longitude: u.longitude as number,
        distance_km: u.distance_km as number,
        skills: u.skills as string[],
        created_at: '',
        updated_at: '',
      }));
    } else {
      // Fallback: Fetch all profiles from REST if RPC returns empty or fails
      const { data: restData, error: restError } = await supabase
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
          created_at,
          updated_at,
          profile_skills (
            skills (
              name
            )
          )
        `);

      if (!restError && restData) {
        const typedData = restData as unknown as PostgrestProfile[];

        rawUsers = typedData.map(u => {
          let latVal: number | undefined = undefined;
          let lngVal: number | undefined = undefined;
          if (u.location) {
            const coords = parseWkbPoint(u.location);
            if (coords) {
              latVal = coords.lat;
              lngVal = coords.lng;
            }
          }
          const skills = u.profile_skills?.map(ps => ps.skills?.name).filter((name): name is string => !!name) || [];

          return {
            id: u.id,
            user_id: u.user_id,
            name: u.name,
            college: u.college,
            year: u.year,
            bio: u.bio,
            avatar_url: u.avatar_url,
            github_url: u.github_url,
            availability_status: u.availability_status as Profile['availability_status'],
            latitude: latVal,
            longitude: lngVal,
            distance_km: undefined, // Distance unknown
            skills,
            created_at: u.created_at,
            updated_at: u.updated_at,
          };
        });
      } else if (rpcError) {
        setError(rpcError.message);
      }
    }

    // Apply filters in-memory
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    let currentProfileId: string | undefined = undefined;
    if (currentUserId) {
      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentUserId)
          .single();
        currentProfileId = currentProfile?.id;
      } catch (err) {
        console.warn('Failed to fetch current user profile ID for exclusion:', err);
      }
    }

    const filteredUsers = rawUsers.filter(u => {
      // Exclude current user
      if (currentProfileId && u.id === currentProfileId) return false;
      if (currentUserId && u.user_id === currentUserId) return false;

      // Filter by nameSearch (Unified search across name, bio, college, and skills)
      if (params.nameSearch) {
        const q = params.nameSearch.toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(q);
        const bioMatch = u.bio?.toLowerCase().includes(q);
        const collegeMatch = u.college?.toLowerCase().includes(q);
        const skillMatch = u.skills?.some(s => s.toLowerCase().includes(q));
        if (!nameMatch && !bioMatch && !collegeMatch && !skillMatch) return false;
      }

      // Filter by collegeFilter
      if (params.collegeFilter) {
        const q = params.collegeFilter.toLowerCase();
        if (!u.college?.toLowerCase().includes(q)) return false;
      }

      // Filter by skillFilter (at least one matching tag)
      if (params.skillFilter && params.skillFilter.length > 0) {
        const hasSkill = u.skills?.some(s => params.skillFilter!.includes(s)) ?? false;
        if (!hasSkill) return false;
      }

      return true;
    });

    setUsers(filteredUsers);
    setLoading(false);
  }, [params, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  return { users, loading, error, refetch: fetchNearbyUsers };
}
