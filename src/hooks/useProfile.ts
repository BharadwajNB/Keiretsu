'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      // Fetch skills
      const { data: skillData } = await supabase
        .from('profile_skills')
        .select('skills(name)')
        .eq('profile_id', data.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];

      setProfile({ ...data, skills });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (!error) {
        await fetchProfile();
      }

      return { error: error?.message || null };
    },
    [supabase, fetchProfile]
  );

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('update_user_location', {
        user_lat: lat,
        user_lng: lng,
      });

      await fetchProfile();
    },
    [supabase, fetchProfile]
  );

  const updateSkills = useCallback(
    async (skillNames: string[]) => {
      if (!profile) return;

      // Get skill IDs
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', skillNames);

      if (!skills) return;

      // Delete existing skills
      await supabase
        .from('profile_skills')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new skills
      if (skills.length > 0) {
        await supabase.from('profile_skills').insert(
          skills.map((s) => ({
            profile_id: profile.id,
            skill_id: s.id,
          }))
        );
      }

      await fetchProfile();
    },
    [supabase, profile, fetchProfile]
  );

  return { profile, loading, updateProfile, updateLocation, updateSkills, refetch: fetchProfile };
}
