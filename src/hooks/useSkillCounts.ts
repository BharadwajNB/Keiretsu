'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SkillCount {
  skill_name: string;
  category: string;
  builder_count: number;
}

interface UseSkillCountsParams {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

/**
 * Fetches aggregated skill-builder counts within a radius.
 * Returns how many nearby builders have each skill, sorted by popularity.
 */
export function useSkillCounts({ lat, lng, radiusKm }: UseSkillCountsParams) {
  const [skillCounts, setSkillCounts] = useState<SkillCount[]>([]);
  const [loading, setLoading] = useState(false);
  const supabaseRef = useRef(createClient());

  const fetchCounts = useCallback(async () => {
    if (!lat || !lng) return;

    setLoading(true);
    const { data, error } = await supabaseRef.current.rpc('get_skill_counts_nearby', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
    });

    if (!error && data) {
      setSkillCounts(
        (data as SkillCount[]).map((d) => ({
          skill_name: d.skill_name,
          category: d.category,
          builder_count: Number(d.builder_count),
        }))
      );
    }
    setLoading(false);
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCounts();
  }, [fetchCounts]);

  return { skillCounts, loading, refetch: fetchCounts };
}
