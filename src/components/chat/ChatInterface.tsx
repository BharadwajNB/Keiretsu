'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Image as ImageIcon, Paperclip, Smile, Rocket, Users, Code, Cpu, MoreVertical, Phone, Video } from 'lucide-react';
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
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    status: 'online',
    projectType: 'startup',
    compatibility: 94,
    lastMessage: 'Let\'s schedule a call for tomorrow?',
    time: '2m ago',
    messages: [
      { id: 'm1', text: 'Hey Sarah! Thanks for reaching out.', senderId: 'me', timestamp: '10:30 AM' },
      { id: 'm2', text: 'I saw your project idea for the fintech startup.', senderId: 'me', timestamp: '10:31 AM' },
      { id: 'm3', text: 'Hi! Yes, I think your background in Next.js would be perfect for the frontend.', senderId: 'sarah', timestamp: '10:35 AM' },
      { id: 'm4', text: 'Let\'s schedule a call for tomorrow?', senderId: 'sarah', timestamp: '10:36 AM' },
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
    messages: [
      { id: 'm1', text: 'Ready for the hackathon?', senderId: 'marcus', timestamp: 'Yesterday' },
      { id: 'm2', text: 'Almost! Just finishing the base boilerplate.', senderId: 'me', timestamp: 'Yesterday' },
      { id: 'm3', text: 'The repo is public now.', senderId: 'marcus', timestamp: '9:15 AM' },
    ]
  },
  {
    id: 'conv_3',
    name: 'AI Lab Team',
    avatar: 'https://i.pravatar.cc/150?u=ai',
    status: 'online',
    projectType: 'aiml',
    compatibility: 92,
    lastMessage: 'The weights are finished training.',
    time: '15m ago',
    messages: [
      { id: 'm1', text: 'How are the training runs looking?', senderId: 'me', timestamp: '11:00 AM' },
      { id: 'm2', text: 'The weights are finished training.', senderId: 'ai', timestamp: '11:45 AM' },
    ]
  }
];

export default function ChatInterface() {
  const [activeConvId, setActiveConvId] = useState(MOCK_CONVERSATIONS[0].id);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = MOCK_CONVERSATIONS.find(c => c.id === activeConvId) || MOCK_CONVERSATIONS[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConvId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    // In a real app, logic to append message would go here
    setInputText('');
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'startup': return <Rocket size={14} />;
      case 'hackathon': return <Users size={14} />;
      case 'opensource': return <Code size={14} />;
      case 'aiml': return <Cpu size={14} />;
      default: return null;
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Messages</h2>
        </div>
        <div className={styles.conversationList}>
          {MOCK_CONVERSATIONS.map(conv => (
            <div 
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
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.chatArea}>
        {/* Header */}
        <header className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatarWrapper}>
              <img src={activeConv.avatar} alt={activeConv.name} className={styles.avatar} style={{ width: 40, height: 40 }} />
              <span className={`${styles.statusIndicator} ${activeConv.status === 'online' ? styles.statusOnline : styles.statusOffline}`} />
            </div>
            <div className={styles.headerMeta}>
              <h3>{activeConv.name}</h3>
              <div className={styles.projectBadge}>
                {getProjectIcon(activeConv.projectType)}
                <span>{activeConv.projectType} • {activeConv.compatibility}% Match</span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Video size={20} /></button>
            <button className={styles.iconBtn}><Phone size={20} /></button>
            <button className={styles.iconBtn}><MoreVertical size={20} /></button>
          </div>
        </header>

        {/* Message Thread */}
        <div className={styles.messages} ref={scrollRef}>
          {activeConv.messages.map(msg => (
            <div 
              key={msg.id} 
              className={`${styles.messageRow} ${msg.senderId === 'me' ? styles.messageRowSent : styles.messageRowReceived}`}
            >
              <div className={`${styles.bubble} ${msg.senderId === 'me' ? styles.bubbleSent : styles.bubbleReceived}`}>
                {msg.text}
              </div>
              <span className={styles.messageTime}>{msg.timestamp}</span>
            </div>
          ))}
          
          {activeConv.status === 'online' && (
            <div className={styles.typingIndicator}>
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <button className={styles.iconBtn}><Plus size={20} /></button>
            <input 
              type="text" 
              className={styles.chatInput} 
              placeholder="Type a futuristic message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <div className={styles.inputActions}>
              <button className={styles.iconBtn}><ImageIcon size={20} /></button>
              <button className={styles.iconBtn}><Paperclip size={20} /></button>
              <button className={styles.iconBtn}><Smile size={20} /></button>
            </div>
            <button className={styles.sendBtn} onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
