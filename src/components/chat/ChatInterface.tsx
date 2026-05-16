'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Image as ImageIcon, Paperclip, Smile, 
  Rocket, Users, Code, Cpu, MoreVertical, Phone, Video,
  Zap, Shield, Target, Sparkles
} from 'lucide-react';
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

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    status: 'online',
    projectType: 'startup',
    compatibility: 98,
    lastMessage: "Let's schedule a deep dive for tomorrow?",
    time: '2m ago',
    role: 'Lead Architect @ Pulse',
    messages: [
      { id: 'm1', text: "Hey Sarah! Thanks for reaching out. I've been reviewing the project brief you sent over.", senderId: 'me', timestamp: '10:30 AM' },
      { id: 'm2', text: "The fintech space is definitely ready for a proximity-based networking tool. Your vision for local liquidity pools is fascinating.", senderId: 'me', timestamp: '10:31 AM' },
      { id: 'm3', text: "Hi! Exactly. I think your background in Next.js and real-time systems would be perfect for the frontend architecture.", senderId: 'sarah', timestamp: '10:35 AM' },
      { id: 'm4', text: "I've drafted some initial wireframes in Figma. Let's schedule a deep dive for tomorrow to sync on the roadmap?", senderId: 'sarah', timestamp: '10:36 AM' },
    ]
  },
  {
    id: 'conv_2',
    name: 'Marcus Rodriguez',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    status: 'offline',
    projectType: 'hackathon',
    compatibility: 88,
    lastMessage: 'The repo is public now.',
    time: '1h ago',
    role: 'Fullstack Dev @ Ethos',
    messages: [
      { id: 'm1', text: 'Yo! Ready for the Global AI Hackathon this weekend? I just saw the prize pool.', senderId: 'marcus', timestamp: 'Yesterday' },
      { id: 'm2', text: 'Almost! Just finishing the base boilerplate with Tailwind and Framer Motion. We should focus on the RAG pipeline first.', senderId: 'me', timestamp: 'Yesterday' },
      { id: 'm3', text: 'Agreed. I just pushed the initial vector store setup to GitHub. The repo is public now.', senderId: 'marcus', timestamp: '9:15 AM' },
    ]
  },
  {
    id: 'conv_3',
    name: 'Elena Volkov',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    status: 'online',
    projectType: 'aiml',
    compatibility: 92,
    lastMessage: 'The model weights are ready.',
    time: '15m ago',
    role: 'ML Researcher @ Neural',
    messages: [
      { id: 'm1', text: 'How are the training runs looking for the multimodal model?', senderId: 'me', timestamp: '11:00 AM' },
      { id: 'm2', text: 'Loss is converging nicely. We hit a new baseline on the validation set!', senderId: 'elena', timestamp: '11:30 AM' },
      { id: 'm3', text: 'Just checked the cluster. The weights are finished training and uploaded to S3.', senderId: 'elena', timestamp: '11:45 AM' },
    ]
  }
];

export default function ChatInterface() {
  const [activeConvId, setActiveConvId] = useState(MOCK_CONVERSATIONS[0].id);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = MOCK_CONVERSATIONS.find(c => c.id === activeConvId) || MOCK_CONVERSATIONS[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConvId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setInputText('');
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
          {MOCK_CONVERSATIONS.map((conv, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
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
                <div className={styles.lastMessage}>{conv.lastMessage}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
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
          
          {activeConv.status === 'online' && (
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
    </div>
  );
}
