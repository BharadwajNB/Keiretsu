'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, NearbyUserParams } from '@/lib/types';

export function useNearbyUsers(params: NearbyUserParams | null) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchNearbyUsers = useCallback(async () => {
    if (!params || !params.lat || !params.lng) return;

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_nearby_users', {
      user_lat: params.lat,
      user_lng: params.lng,
      radius_km: params.radiusKm,
      skill_filter: params.skillFilter?.length ? params.skillFilter : null,
      college_filter: params.collegeFilter || null,
      name_search: params.nameSearch || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setUsers([]);
    } else {
      setUsers(
        (data || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          user_id: '',
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
        }))
      );
    }

    setLoading(false);
  }, [params, supabase]);

  useEffect(() => {
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  return { users, loading, error, refetch: fetchNearbyUsers };
}
