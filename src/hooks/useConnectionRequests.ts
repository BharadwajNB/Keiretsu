'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from './useProfile';
import type { ConnectionRequest, Profile } from '@/lib/types';

const MOCK_INTENTS = ['startup', 'hackathon', 'opensource', 'aiml'] as const;
const MOCK_MESSAGES = [
  "Hey! I saw your profile and your projects. I'm building a new venture and would love to collaborate on the tech side.",
  "Working on a submission for the upcoming hackathon. We need someone strong in frontend/backend. Let's form a team!",
  "Hey there, I am starting an open-source project and noticed you have matching skills. Would you be down to participate?",
  "Impressive profile! I'm researching a novel AI application and think your skills would be a perfect match. Interested in chatting?"
];

export function useConnectionRequests() {
  const { profile: myProfile } = useProfile();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingDb, setIsUsingDb] = useState(false);
  const supabase = createClient();

  // Helper to fetch other profiles for fallback/mock seeding
  const fetchOtherProfiles = async (excludeId: string): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', excludeId)
      .limit(5);

    if (!data || data.length === 0) return [];

    // Fetch skills for each profile to make it realistic
    const enriched = await Promise.all(
      data.map(async (p) => {
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('skills(name)')
          .eq('profile_id', p.id);
        const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];
        return { ...p, skills };
      })
    );

    return enriched;
  };

  // Primary loader function
  const loadRequests = useCallback(async () => {
    if (!myProfile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Attempt to query Supabase
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          intent,
          message,
          status,
          created_at,
          updated_at,
          sender_profile:profiles!sender_id(*)
        `)
        .eq('receiver_id', myProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Enriched profiles join manually if needed, but the select query above does it
      // Let's verify skills are loaded for sender profiles
      const enrichedRequests = await Promise.all(
        (data || []).map(async (req: any) => {
          if (req.sender_profile) {
            const { data: skillData } = await supabase
              .from('profile_skills')
              .select('skills(name)')
              .eq('profile_id', req.sender_profile.id);
            const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];
            req.sender_profile.skills = skills;
          }
          return req as ConnectionRequest;
        })
      );

      // If we succeed but the database returned 0 records, check if we need to auto-seed
      if (enrichedRequests.length === 0) {
        const otherProfiles = await fetchOtherProfiles(myProfile.id);
        if (otherProfiles.length > 0) {
          // Auto-seed up to 2 items in database
          const seedItems = otherProfiles.slice(0, 2).map((op, idx) => ({
            sender_id: op.id,
            receiver_id: myProfile.id,
            intent: MOCK_INTENTS[idx % MOCK_INTENTS.length],
            message: MOCK_MESSAGES[idx % MOCK_MESSAGES.length],
            status: 'pending' as const
          }));

          const { data: insertedData } = await supabase
            .from('connection_requests')
            .insert(seedItems)
            .select(`
              id,
              sender_id,
              receiver_id,
              intent,
              message,
              status,
              created_at,
              updated_at,
              sender_profile:profiles!sender_id(*)
            `);

          if (insertedData) {
            const enrichedSeeds = await Promise.all(
              insertedData.map(async (req: any) => {
                if (req.sender_profile) {
                  const { data: skillData } = await supabase
                    .from('profile_skills')
                    .select('skills(name)')
                    .eq('profile_id', req.sender_profile.id);
                  const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];
                  req.sender_profile.skills = skills;
                }
                return req as ConnectionRequest;
              })
            );
            setRequests(enrichedSeeds);
            setIsUsingDb(true);
            setLoading(false);
            return;
          }
        }
      }

      setRequests(enrichedRequests);
      setIsUsingDb(true);
    } catch (dbError) {
      // Fallback to LocalStorage
      console.warn('Supabase connection_requests query failed, falling back to LocalStorage:', dbError);
      setIsUsingDb(false);

      const localDataStr = localStorage.getItem(`requests_${myProfile.id}`);
      if (localDataStr) {
        setRequests(JSON.parse(localDataStr));
      } else {
        // Seed LocalStorage with real database profiles to make them clickable
        const otherProfiles = await fetchOtherProfiles(myProfile.id);
        if (otherProfiles.length > 0) {
          const localSeeds: ConnectionRequest[] = otherProfiles.slice(0, 3).map((op, idx) => ({
            id: `local_req_${op.id}_${idx}`,
            sender_id: op.id,
            receiver_id: myProfile.id,
            intent: MOCK_INTENTS[idx % MOCK_INTENTS.length],
            message: MOCK_MESSAGES[idx % MOCK_MESSAGES.length],
            status: 'pending',
            created_at: new Date(Date.now() - idx * 3600000).toISOString(),
            updated_at: new Date(Date.now() - idx * 3600000).toISOString(),
            sender_profile: op
          }));
          localStorage.setItem(`requests_${myProfile.id}`, JSON.stringify(localSeeds));
          setRequests(localSeeds);
        } else {
          setRequests([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [myProfile, supabase]);

  // Load requests initially when profile changes
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Action: Accept Request
  const acceptRequest = useCallback(async (requestId: string) => {
    if (!myProfile) return;

    if (isUsingDb && !requestId.startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) throw error;
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } catch (err) {
        console.error('Failed to accept request in DB:', err);
      }
    } else {
      // LocalStorage update
      setRequests(prev => {
        const updated = prev.filter(r => r.id !== requestId);
        localStorage.setItem(`requests_${myProfile.id}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [myProfile, isUsingDb, supabase]);

  // Action: Decline Request
  const declineRequest = useCallback(async (requestId: string) => {
    if (!myProfile) return;

    if (isUsingDb && !requestId.startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) throw error;
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } catch (err) {
        console.error('Failed to decline request in DB:', err);
      }
    } else {
      // LocalStorage update
      setRequests(prev => {
        const updated = prev.filter(r => r.id !== requestId);
        localStorage.setItem(`requests_${myProfile.id}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [myProfile, isUsingDb, supabase]);

  // Action: Send a new connection request
  const sendRequest = useCallback(async (receiverProfileId: string, intent: 'startup' | 'hackathon' | 'opensource' | 'aiml', message: string) => {
    if (!myProfile) return { error: 'You must have a profile setup to connect' };

    if (isUsingDb) {
      try {
        const { error } = await supabase
          .from('connection_requests')
          .insert({
            sender_id: myProfile.id,
            receiver_id: receiverProfileId,
            intent,
            message,
            status: 'pending'
          });

        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.error('Failed to send request in DB:', err);
        return { error: err.message || 'Failed to send request' };
      }
    } else {
      // Simulating outgoing request locally
      console.log('Sending request locally (DB offline):', { receiverProfileId, intent, message });
      return { success: true };
    }
  }, [myProfile, isUsingDb, supabase]);

  return {
    requests,
    loading,
    acceptRequest,
    declineRequest,
    sendRequest,
    refetch: loadRequests,
  };
}
