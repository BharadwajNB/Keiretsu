'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from './useProfile';
import type { ChatMessage, ChatConversation, Profile } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 50;
const TYPING_TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// Helper: build a stable channel name for a conversation pair
// ---------------------------------------------------------------------------
function conversationKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useChat() {
  const { profile: myProfile } = useProfile();
  const supabase = useMemo(() => createClient(), []);

  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeOtherProfileId, setActiveOtherProfileId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Refs for subscriptions
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOtherProfileIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeOtherProfileIdRef.current = activeOtherProfileId;
  }, [activeOtherProfileId]);

  // =========================================================================
  // Load conversation list
  // =========================================================================
  const loadConversations = useCallback(async () => {
    if (!myProfile) return;
    setLoadingConversations(true);

    try {
      // Fetch all messages involving the current user, newest first
      // We'll derive conversations client-side from the message data
      const { data: sentMsgs } = await supabase
        .from('messages')
        .select('id, sender_profile_id, receiver_profile_id, content, read_at, created_at')
        .eq('sender_profile_id', myProfile.id)
        .order('created_at', { ascending: false });

      const { data: recvMsgs } = await supabase
        .from('messages')
        .select('id, sender_profile_id, receiver_profile_id, content, read_at, created_at')
        .eq('receiver_profile_id', myProfile.id)
        .order('created_at', { ascending: false });

      const allMessages: ChatMessage[] = [...(sentMsgs || []), ...(recvMsgs || [])];

      // Group by the other participant
      const convMap = new Map<string, { lastMessage: ChatMessage; unreadCount: number }>();

      for (const msg of allMessages) {
        const otherId = msg.sender_profile_id === myProfile.id
          ? msg.receiver_profile_id
          : msg.sender_profile_id;

        const existing = convMap.get(otherId);
        if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
          convMap.set(otherId, {
            lastMessage: msg,
            unreadCount: existing?.unreadCount ?? 0,
          });
        }

        // Count unread (messages sent TO me that are not read)
        if (msg.receiver_profile_id === myProfile.id && !msg.read_at) {
          const entry = convMap.get(otherId)!;
          entry.unreadCount = (entry.unreadCount || 0) + 1;
          // Fix double-count: reset and recount below
        }
      }

      // Recount unread properly
      for (const [otherId, entry] of convMap.entries()) {
        entry.unreadCount = allMessages.filter(
          m => m.sender_profile_id === otherId
            && m.receiver_profile_id === myProfile.id
            && !m.read_at
        ).length;
      }

      // Fetch profiles for all conversation partners
      const otherIds = Array.from(convMap.keys());
      if (otherIds.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

      // Fetch skills for each profile
      const enrichedProfiles: Profile[] = [];
      for (const p of (profiles || [])) {
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('skills(name)')
          .eq('profile_id', p.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];
        enrichedProfiles.push({ ...p, skills });
      }

      const convs: ChatConversation[] = enrichedProfiles
        .map(p => {
          const entry = convMap.get(p.id);
          if (!entry) return null;
          return {
            otherProfile: p,
            lastMessage: entry.lastMessage,
            unreadCount: entry.unreadCount,
          };
        })
        .filter(Boolean) as ChatConversation[];

      // Sort by last message time, newest first
      convs.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [myProfile, supabase]);

  // =========================================================================
  // Load messages for a specific conversation
  // =========================================================================
  const loadMessages = useCallback(async (otherProfileId: string, before?: string) => {
    if (!myProfile) return;
    setLoadingMessages(true);

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_profile_id.eq.${myProfile.id},receiver_profile_id.eq.${otherProfileId}),` +
          `and(sender_profile_id.eq.${otherProfileId},receiver_profile_id.eq.${myProfile.id})`
        )
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) throw error;

      const fetched = (data || []).reverse(); // oldest first for display

      if (before) {
        // Prepend older messages
        setMessages(prev => [...fetched, ...prev]);
      } else {
        setMessages(fetched);
      }

      setHasMoreMessages((data?.length || 0) >= PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [myProfile, supabase]);

  // =========================================================================
  // Send a message
  // =========================================================================
  const sendMessage = useCallback(async (receiverProfileId: string, content: string) => {
    if (!myProfile || !content.trim()) return { error: 'Invalid input' };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_profile_id: myProfile.id,
          receiver_profile_id: receiverProfileId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically add to local messages
      if (data) {
        setMessages(prev => [...prev, data]);

        // Update conversation list
        setConversations(prev => {
          const idx = prev.findIndex(c => c.otherProfile.id === receiverProfileId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], lastMessage: data };
            // Move to top
            const [conv] = updated.splice(idx, 1);
            return [conv, ...updated];
          }
          return prev;
        });
      }

      // Stop typing indicator
      broadcastTyping(receiverProfileId, false);

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Failed to send message:', err);
      return { error: message };
    }
  }, [myProfile, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // =========================================================================
  // Mark messages as read
  // =========================================================================
  const markAsRead = useCallback(async (otherProfileId: string) => {
    if (!myProfile) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_profile_id', otherProfileId)
        .eq('receiver_profile_id', myProfile.id)
        .is('read_at', null);

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m.sender_profile_id === otherProfileId && !m.read_at
            ? { ...m, read_at: new Date().toISOString() }
            : m
        )
      );

      setConversations(prev =>
        prev.map(c =>
          c.otherProfile.id === otherProfileId
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [myProfile, supabase]);

  // =========================================================================
  // Typing indicators (Supabase Realtime Broadcast — ephemeral)
  // =========================================================================
  const broadcastTyping = useCallback((otherProfileId: string, isTyping: boolean) => {
    if (!myProfile) return;
    const key = conversationKey(myProfile.id, otherProfileId);
    const channel = supabase.channel(`typing:${key}`);

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { profileId: myProfile.id, isTyping },
    });
  }, [myProfile, supabase]);

  const setTyping = useCallback((otherProfileId: string) => {
    broadcastTyping(otherProfileId, true);

    // Auto-clear after timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(otherProfileId, false);
    }, TYPING_TIMEOUT_MS);
  }, [broadcastTyping]);

  // =========================================================================
  // Set active conversation — loads messages + subscribes to typing
  // =========================================================================
  const openConversation = useCallback((otherProfileId: string | null) => {
    setActiveOtherProfileId(otherProfileId);
    setMessages([]);
    setTypingUsers(new Set());

    // Unsubscribe from previous typing channel
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    if (!otherProfileId || !myProfile) return;

    // Load messages
    loadMessages(otherProfileId);

    // Mark as read
    markAsRead(otherProfileId);

    // Subscribe to typing broadcasts for this conversation
    const key = conversationKey(myProfile.id, otherProfileId);
    const typingChannel = supabase
      .channel(`typing:${key}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const data = payload.payload as { profileId: string; isTyping: boolean };
        if (data.profileId !== myProfile.id) {
          setTypingUsers(prev => {
            const next = new Set(prev);
            if (data.isTyping) {
              next.add(data.profileId);
            } else {
              next.delete(data.profileId);
            }
            return next;
          });
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;
  }, [myProfile, supabase, loadMessages, markAsRead]);

  // =========================================================================
  // Global Realtime subscription — new incoming messages
  // =========================================================================
  useEffect(() => {
    if (!myProfile) return;

    // Subscribe to new messages addressed to me
    const channel = supabase
      .channel('messages:incoming')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_profile_id=eq.${myProfile.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;

          // If this message is from the currently active conversation, append it
          if (activeOtherProfileIdRef.current === newMsg.sender_profile_id) {
            setMessages(prev => {
              // Deduplicate
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Auto-mark as read since user is viewing this conversation
            markAsRead(newMsg.sender_profile_id);
          }

          // Update conversation list
          setConversations(prev => {
            const idx = prev.findIndex(c => c.otherProfile.id === newMsg.sender_profile_id);
            if (idx >= 0) {
              const updated = [...prev];
              const isActive = activeOtherProfileIdRef.current === newMsg.sender_profile_id;
              updated[idx] = {
                ...updated[idx],
                lastMessage: newMsg,
                unreadCount: isActive ? 0 : updated[idx].unreadCount + 1,
              };
              // Move to top
              const [conv] = updated.splice(idx, 1);
              return [conv, ...updated];
            }
            // New conversation partner — reload conversations to get their profile
            loadConversations();
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_profile_id=eq.${myProfile.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // Read receipt: the receiver marked our message as read
          const updated = payload.new as ChatMessage;
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m)
          );
        }
      )
      .subscribe();

    messageChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myProfile, supabase, markAsRead, loadConversations]);

  // =========================================================================
  // Initial load
  // =========================================================================
  useEffect(() => {
    if (myProfile) {
      loadConversations();
    }
  }, [myProfile, loadConversations]);

  // =========================================================================
  // Cleanup
  // =========================================================================
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // =========================================================================
  // Load more (pagination)
  // =========================================================================
  const loadMoreMessages = useCallback(() => {
    if (!activeOtherProfileId || !messages.length) return;
    const oldestTimestamp = messages[0]?.created_at;
    if (oldestTimestamp) {
      loadMessages(activeOtherProfileId, oldestTimestamp);
    }
  }, [activeOtherProfileId, messages, loadMessages]);

  return {
    conversations,
    messages,
    activeOtherProfileId,
    loadingConversations,
    loadingMessages,
    hasMoreMessages,
    typingUsers,
    openConversation,
    sendMessage,
    markAsRead,
    setTyping,
    loadMoreMessages,
    loadConversations,
  };
}
