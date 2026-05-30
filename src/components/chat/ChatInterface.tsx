'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Image as ImageIcon, Paperclip, Smile, 
  Rocket, Users, Code, Cpu, MoreVertical, Phone, Video,
  Zap, Shield, Target, Sparkles, MessageCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import styles from './ChatInterface.module.css';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  projectType: 'startup' | 'hackathon' | 'opensource' | 'aiml';
  compatibility: number;
  lastMessage: string;
  time: string;
  role: string;
  messages: Message[];
}

export default function ChatInterface() {
  const { profile: myProfile } = useProfile();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Load real conversations from localStorage & fetch accepted DB connections
  useEffect(() => {
    if (!myProfile) return;

    const loadConversations = async () => {
      setLoading(true);
      const storageKey = `keiretsu_chats_${myProfile.id}`;
      let localConvs: Conversation[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          localConvs = (JSON.parse(stored) as Conversation[]).filter(c => !c.id.startsWith('conv_'));
        }
      } catch (e) {
        console.warn('Failed to parse chats from localStorage:', e);
      }

      try {
        const supabase = createClient();
        const { data: connRequests } = await supabase
          .from('connection_requests')
          .select(`
            id,
            status,
            sender_id,
            receiver_id,
            intent,
            sender_profile:profiles!sender_id(*),
            receiver_profile:profiles!receiver_id(*)
          `)
          .or(`sender_id.eq.${myProfile.id},receiver_id.eq.${myProfile.id}`)
          .eq('status', 'accepted');

        if (connRequests) {
          const dbConvs: Conversation[] = [];
          for (const req of connRequests) {
            const otherProfile = req.sender_id === myProfile.id ? req.receiver_profile : req.sender_profile;
            if (!otherProfile) continue;

            // Avoid duplicating if already in localConvs
            if (localConvs.some(c => c.id === otherProfile.id)) {
              continue;
            }

            const getAvatarUrl = (p: any) => {
              if (p.avatar_url) return p.avatar_url;
              if (p.github_url) {
                const match = p.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
              }
              return 'https://i.pravatar.cc/150?u=' + p.id;
            };

            const getRole = (p: any) => {
              if (p.bio) {
                return p.bio.length > 50 ? p.bio.slice(0, 47) + '...' : p.bio;
              }
              if (p.college) {
                return `${p.college} Student`;
              }
              return 'Collaborator';
            };

            dbConvs.push({
              id: otherProfile.id,
              name: otherProfile.name,
              avatar: getAvatarUrl(otherProfile),
              status: otherProfile.availability_status === 'open_to_collab' ? 'online' : 'offline',
              projectType: req.intent || 'startup',
              compatibility: 90,
              lastMessage: '',
              time: 'Just now',
              role: getRole(otherProfile),
              messages: []
            });
          }

          const combined = [...localConvs, ...dbConvs];
          setConversations(combined);
          if (combined.length > 0 && !activeConvId) {
            setActiveConvId(combined[0].id);
          }
        } else {
          setConversations(localConvs);
          if (localConvs.length > 0 && !activeConvId) {
            setActiveConvId(localConvs[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load connections from DB:', err);
        setConversations(localConvs);
        if (localConvs.length > 0 && !activeConvId) {
          setActiveConvId(localConvs[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile]);

  // Handle URL redirect query param for userId
  useEffect(() => {
    if (loading || !targetUserId) return;

    const existing = conversations.find(c => c.id === targetUserId);
    if (existing) {
      setActiveConvId(targetUserId);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return;
    }

    // Otherwise, fetch target user profile from Supabase
    const fetchTargetProfile = async () => {
      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (error || !profile) {
          throw new Error(error?.message || 'Profile not found');
        }

        // Fetch skills for overlap compatibility calculation
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('skills(name)')
          .eq('profile_id', profile.id);
        const userSkills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];

        // Fetch connection intent if accepted
        let intent: 'startup' | 'hackathon' | 'opensource' | 'aiml' = 'startup';
        if (myProfile) {
          const { data: connData } = await supabase
            .from('connection_requests')
            .select('intent')
            .or(`and(sender_id.eq.${myProfile.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${myProfile.id})`)
            .eq('status', 'accepted')
            .maybeSingle();
          if (connData?.intent) {
            intent = connData.intent as any;
          }
        }

        const getAvatarUrl = (p: any) => {
          if (p.avatar_url) return p.avatar_url;
          if (p.github_url) {
            const match = p.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
            if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
          }
          return 'https://i.pravatar.cc/150?u=' + p.id;
        };

        const calculateCompatibility = (myS: string[] = [], userS: string[] = []) => {
          if (!myS.length || !userS.length) return 85;
          const overlap = myS.filter(s => userS.includes(s)).length;
          const union = new Set([...myS, ...userS]).size;
          if (union === 0) return 85;
          const jaccard = overlap / union;
          return Math.min(99, Math.max(80, Math.round(80 + jaccard * 20)));
        };

        const getRole = (p: any) => {
          if (p.bio) {
            return p.bio.length > 50 ? p.bio.slice(0, 47) + '...' : p.bio;
          }
          if (p.college) {
            return `${p.college} Student`;
          }
          return 'Collaborator';
        };

        const newConv: Conversation = {
          id: profile.id,
          name: profile.name,
          avatar: getAvatarUrl(profile),
          status: profile.availability_status === 'open_to_collab' ? 'online' : 'offline',
          projectType: intent,
          compatibility: calculateCompatibility(myProfile?.skills || [], userSkills),
          lastMessage: '',
          time: 'Just now',
          role: getRole(profile),
          messages: []
        };

        setConversations(prev => {
          const updated = [newConv, ...prev.filter(c => c.id !== profile.id)];
          const storageKey = myProfile ? `keiretsu_chats_${myProfile.id}` : 'keiretsu_chats_guest';
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to write chats to localStorage:', e);
          }
          return updated;
        });

        setActiveConvId(profile.id);
        
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);

      } catch (err) {
        console.warn('Could not load profile for chat:', err);
      }
    };

    fetchTargetProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, targetUserId, myProfile]);

  // Scroll to bottom when active conversation changes or new messages are appended/typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConvId, activeConv?.messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: inputText,
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: newMsg.text,
            time: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      });

      const storageKey = myProfile ? `keiretsu_chats_${myProfile.id}` : 'keiretsu_chats_guest';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to write chats to localStorage:', e);
      }
      return updated;
    });

    setInputText('');

    // Trigger mock auto-reply if chatting with dynamically added users
    if (activeConv.id.match(/^[0-9a-fA-F-]+$/)) {
      setIsTyping(true);
      setTimeout(() => {
        const responseMsg: Message = {
          id: `msg_${Date.now() + 1}`,
          text: `Hey! Thanks for messaging. Let's review the project details and sync up on the next steps. I'm excited to collaborate!`,
          senderId: activeConv.id,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setIsTyping(false);
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id === activeConv.id) {
              return {
                ...c,
                lastMessage: responseMsg.text,
                time: 'Just now',
                messages: [...c.messages, responseMsg]
              };
            }
            return c;
          });

          const storageKey = myProfile ? `keiretsu_chats_${myProfile.id}` : 'keiretsu_chats_guest';
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to write chats to localStorage:', e);
          }
          return updated;
        });
      }, 1500);
    }
  };

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
          <h2 className={styles.sidebarTitle}>Messages</h2>
          <button className={styles.newChatBtn}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className={styles.conversationList}>
          {conversations.length === 0 ? (
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
                key={conv.id}
                className={`${styles.conversationItem} ${activeConvId === conv.id ? styles.conversationItemActive : ''}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className={styles.avatarWrapper}>
                  <img src={conv.avatar} alt={conv.name} className={styles.avatar} />
                  <span className={`${styles.statusIndicator} ${conv.status === 'online' ? styles.statusOnline : styles.statusOffline}`} />
                </div>
                <div className={styles.convMeta}>
                  <div className={styles.convHeader}>
                    <span className={styles.convName}>{conv.name}</span>
                    <span className={styles.convTime}>{conv.time}</span>
                  </div>
                  <div className={styles.lastMessage}>{conv.lastMessage || 'No messages yet'}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      {conversations.length === 0 || !activeConv ? (
        <main className={styles.chatArea} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
          <div className={styles.systemMessage} style={{ position: 'absolute', top: 24 }}>
            <Shield size={12} />
            <span>End-to-end encrypted collaboration</span>
          </div>
          <MessageCircle size={48} style={{ color: 'var(--accent-primary)', marginBottom: 16, opacity: 0.8 }} />
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontFamily: 'var(--font-playmegames)' }}>Secure Comms Portal</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
            No active conversations. View a user profile from the Skill Map and click "Message" to start a chat.
          </p>
        </main>
      ) : (
        <main className={styles.chatArea}>
          {/* Header */}
          <header className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.headerAvatarWrapper}>
                <img src={activeConv.avatar} alt={activeConv.name} className={styles.headerAvatar} />
                <span className={`${styles.statusIndicator} ${activeConv.status === 'online' ? styles.statusOnline : styles.statusOffline}`} />
              </div>
              <div className={styles.headerMeta}>
                <h3>{activeConv.name}</h3>
                <p className={styles.userRole}>{activeConv.role}</p>
              </div>
              <div className={styles.compatibilityBadge}>
                <div className={styles.badgeGlow} />
                <Sparkles size={12} className={styles.badgeIcon} />
                <span>{activeConv.compatibility}% Match</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.projectTypeTag}>
                {getProjectIcon(activeConv.projectType)}
                <span>{activeConv.projectType}</span>
              </div>
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

            {activeConv.messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.6, padding: '40px 20px', textAlign: 'center' }}>
                <Sparkles size={32} style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
                <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-playmegames)' }}>Beginning of secure chat with {activeConv.name}</h4>
                <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Send a message to initiate your collaboration request</p>
              </div>
            )}
            
            <AnimatePresence mode="popLayout">
              {activeConv.messages.map((msg, idx) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className={`${styles.messageRow} ${msg.senderId === 'me' ? styles.messageRowSent : styles.messageRowReceived}`}
                >
                  <div className={`${styles.bubble} ${msg.senderId === 'me' ? styles.bubbleSent : styles.bubbleReceived}`}>
                    {msg.text}
                    <span className={styles.messageTime}>{msg.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
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
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
