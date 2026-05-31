'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Image as ImageIcon, Paperclip, Smile,
  Rocket, Users, Code, Cpu, MoreVertical, Phone, Video,
  Zap, Shield, Target, Sparkles, MessageCircle, Check, CheckCheck, ChevronUp, ArrowLeft
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import type { Profile } from '@/lib/types';
import styles from './ChatInterface.module.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAvatarUrl(p: Profile): string {
  if (p.avatar_url) return p.avatar_url;
  if (p.github_url) {
    const match = p.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
    if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
  }
  return '/default-avatar.svg';
}

function getRole(p: Profile): string {
  if (p.bio) return p.bio.length > 50 ? p.bio.slice(0, 47) + '...' : p.bio;
  if (p.college) return `${p.college} Student`;
  return 'Collaborator';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusClass(status?: string): string {
  if (status === 'open_to_collab') return styles.statusOnline;
  if (status === 'looking_for_cofounder') return styles.statusLooking;
  return styles.statusBusy;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ChatInterface() {
  const { profile: myProfile } = useProfile();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const {
    conversations,
    messages,
    activeOtherProfileId,
    loadingConversations,
    loadingMessages,
    hasMoreMessages,
    typingUsers,
    openConversation,
    sendMessage,
    setTyping,
    loadMoreMessages,
    loadConversations,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.otherProfile.id === activeOtherProfileId);
  const isOtherTyping = activeOtherProfileId ? typingUsers.has(activeOtherProfileId) : false;

  // Handle URL redirect query param for userId
  useEffect(() => {
    if (loadingConversations || !targetUserId || !myProfile) return;

    openConversation(targetUserId);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [loadingConversations, targetUserId, myProfile, openConversation]);

  // Scroll to bottom when messages change or typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !activeOtherProfileId) return;

    const text = inputText;
    setInputText('');
    await sendMessage(activeOtherProfileId, text);
  }, [inputText, activeOtherProfileId, sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (activeOtherProfileId && e.target.value.trim()) {
      setTyping(activeOtherProfileId);
    }
  }, [activeOtherProfileId, setTyping]);

  const handleConvClick = useCallback((profileId: string) => {
    openConversation(profileId);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [openConversation]);

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'startup': return <Rocket size={14} />;
      case 'hackathon': return <Zap size={14} />;
      case 'opensource': return <Code size={14} />;
      case 'aiml': return <Cpu size={14} />;
      default: return <Target size={14} />;
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/map" className={styles.backToMapBtn} title="Back to Map">
              <ArrowLeft size={18} />
            </Link>
            <h2 className={styles.sidebarTitle}>Messages</h2>
          </div>
          <button className={styles.newChatBtn}>
            <Plus size={20} />
          </button>
        </div>

        <div className={styles.conversationList}>
          {loadingConversations ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', opacity: 0.6 }}>
              <Users size={24} style={{ color: 'var(--text-muted)', marginBottom: 12, display: 'inline-block' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No active chats</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                Connect with other builders on the map to start messaging.
              </p>
            </div>
          ) : (
            conversations.map((conv, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={conv.otherProfile.id}
                className={`${styles.conversationItem} ${activeOtherProfileId === conv.otherProfile.id ? styles.conversationItemActive : ''}`}
                onClick={() => handleConvClick(conv.otherProfile.id)}
              >
                <div className={styles.avatarWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getAvatarUrl(conv.otherProfile)} alt={conv.otherProfile.name} className={styles.avatar} />
                  <span className={`${styles.statusIndicator} ${getStatusClass(conv.otherProfile.availability_status)}`} />
                </div>
                <div className={styles.convMeta}>
                  <div className={styles.convHeader}>
                    <span className={styles.convName}>{conv.otherProfile.name}</span>
                    <span className={styles.convTime}>
                      {conv.lastMessage ? formatTime(conv.lastMessage.created_at) : ''}
                    </span>
                  </div>
                  <div className={styles.lastMessage}>
                    {conv.lastMessage
                      ? (conv.lastMessage.sender_profile_id === myProfile?.id ? 'You: ' : '') + conv.lastMessage.content
                      : 'No messages yet'
                    }
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                )}
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      {!activeConv ? (
        <main className={styles.chatArea} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
          <div className={styles.systemMessage} style={{ position: 'absolute', top: 24 }}>
            <Shield size={12} />
            <span>End-to-end encrypted collaboration</span>
          </div>
          <MessageCircle size={48} style={{ color: 'var(--accent-primary)', marginBottom: 16, opacity: 0.8 }} />
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontFamily: 'var(--font-playmegames)', letterSpacing: '0.06em', wordSpacing: '0.15em' }}>Secure Comms Portal</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
            {conversations.length === 0
              ? 'No active conversations. View a user profile from the Skill Map and click "Message" to start a chat.'
              : 'Select a conversation from the sidebar to start messaging.'
            }
          </p>
        </main>
      ) : (
        <main className={styles.chatArea}>
          {/* Header */}
          <header className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <Link href="/map" className={styles.headerBackBtn} title="Back to Map">
                <ArrowLeft size={18} />
              </Link>
              <div className={styles.headerAvatarWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getAvatarUrl(activeConv.otherProfile)} alt={activeConv.otherProfile.name} className={styles.headerAvatar} />
                <span className={`${styles.statusIndicator} ${getStatusClass(activeConv.otherProfile.availability_status)}`} />
              </div>
              <div className={styles.headerMeta}>
                <h3>{activeConv.otherProfile.name}</h3>
                <p className={styles.userRole}>
                  {isOtherTyping ? 'typing...' : getRole(activeConv.otherProfile)}
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.actionDivider} />
              <button className={styles.iconBtn} title="Video Call"><Video size={20} /></button>
              <button className={styles.iconBtn} title="Voice Call"><Phone size={20} /></button>
              <button className={styles.iconBtn} title="More"><MoreVertical size={20} /></button>
            </div>
          </header>

          {/* Message Thread */}
          <div className={styles.messages} ref={scrollRef}>
            <div className={styles.systemMessage}>
              <Shield size={12} />
              <span>End-to-end encrypted collaboration</span>
            </div>

            {/* Load More Button */}
            {hasMoreMessages && (
              <button
                onClick={loadMoreMessages}
                disabled={loadingMessages}
                className={styles.loadMoreBtn}
                style={{
                  alignSelf: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: '#181822',
                  border: '1px solid #282836',
                  borderRadius: 12,
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                <ChevronUp size={14} />
                {loadingMessages ? 'Loading...' : 'Load earlier messages'}
              </button>
            )}

            {messages.length === 0 && !loadingMessages && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.6, padding: '40px 20px', textAlign: 'center' }}>
                <Sparkles size={32} style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
                <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-playmegames)', letterSpacing: '0.06em', wordSpacing: '0.15em' }}>Beginning of secure chat with {activeConv.otherProfile.name}</h4>
                <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Send a message to start collaborating</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => {
                const isMine = msg.sender_profile_id === myProfile?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`${styles.messageRow} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}
                  >
                    <div className={`${styles.bubble} ${isMine ? styles.bubbleSent : styles.bubbleReceived}`}>
                      {msg.content}
                      <span className={styles.messageTime}>
                        {formatMessageTime(msg.created_at)}
                        {isMine && (
                          <span style={{ marginLeft: 4, display: 'inline-flex', verticalAlign: 'middle' }}>
                            {msg.read_at ? (
                              <CheckCheck size={13} style={{ color: '#34d399' }} />
                            ) : (
                              <Check size={13} style={{ opacity: 0.5 }} />
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isOtherTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.typingIndicator}
              >
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <button className={styles.attachBtn}><Plus size={20} /></button>
              <input
                ref={inputRef}
                type="text"
                className={styles.chatInput}
                placeholder="Send a secure message..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className={styles.inputActions}>
                <button className={styles.iconBtn}><ImageIcon size={18} /></button>
                <button className={styles.iconBtn}><Paperclip size={18} /></button>
                <button className={styles.iconBtn}><Smile size={18} /></button>
              </div>
              <button className={styles.sendBtn} onClick={handleSend}>
                <Send size={18} />
                <div className={styles.sendBtnGlow} />
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
