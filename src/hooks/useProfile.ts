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
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const { data, error: authError } = await supabase.auth.getUser();
      const user = data?.user;
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
      const { data, error: authError } = await supabase.auth.getUser();
      const user = data?.user;
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

      // Get existing skill IDs
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', skillNames);

      let allSkills = existingSkills || [];
      const existingNames = allSkills.map((s) => s.name.toLowerCase());
      
      // Find which ones are missing (case insensitive)
      const missingNames = skillNames.filter((name) => !existingNames.includes(name.toLowerCase()));

      // Insert missing skills
      if (missingNames.length > 0) {
        const { data: newSkills, error: insertError } = await supabase
          .from('skills')
          .insert(missingNames.map((name) => ({ name, category: 'general' })))
          .select('id, name');

        if (newSkills) {
          allSkills = [...allSkills, ...newSkills];
        } else {
          console.error("Failed to insert custom skills:", insertError);
          // If RLS fails, we just ignore the custom skills and proceed with existing
        }
      }

      if (allSkills.length === 0) return;

      // Delete existing skills
      await supabase
        .from('profile_skills')
        .delete()
        .eq('profile_id', profile.id);

      // Insert all skills
      await supabase.from('profile_skills').insert(
        allSkills.map((s) => ({
          profile_id: profile.id,
          skill_id: s.id,
        }))
      );

      await fetchProfile();
    },
    [supabase, profile, fetchProfile]
  );

  return { profile, loading, updateProfile, updateLocation, updateSkills, refetch: fetchProfile };
}
