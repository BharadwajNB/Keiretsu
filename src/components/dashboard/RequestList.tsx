'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox } from 'lucide-react';
import RequestCard, { RequestData } from './RequestCard';
import styles from './RequestList.module.css';

const MOCK_REQUESTS: RequestData[] = [
  {
    id: 'req_1',
    senderName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    intent: 'startup',
    message: "Hey! I saw your profile and your work in Next.js is impressive. I'm building a fintech startup and would love to chat.",
    compatibility: 94,
  },
  {
    id: 'req_2',
    senderName: 'Marcus Rodriguez',
    avatarUrl: 'https://i.pravatar.cc/150?u=marcus',
    intent: 'hackathon',
    message: "Building a team for the upcoming Global AI Hackathon. We need a strong backend engineer. Interested?",
    compatibility: 88,
  },
  {
    id: 'req_3',
    senderName: 'Alex Rivers',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    intent: 'opensource',
    message: "Working on a new React library for 3D visualizations. Your experience with WebGL would be a huge help!",
    compatibility: 82,
  },
];

export default function RequestList() {
  const [requests, setRequests] = useState<RequestData[]>(MOCK_REQUESTS);

  const handleActionComplete = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleWrapper}>
          <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
            <Inbox size={20} />
          </div>
          <h2 className={styles.title}>Collaboration Requests</h2>
          <span className={styles.countBadge}>{requests.length}</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {requests.length > 0 ? (
          <motion.div 
            className={styles.grid}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {requests.map(request => (
              <RequestCard 
                key={request.id} 
                data={request} 
                onActionComplete={handleActionComplete} 
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p>No incoming requests at the moment.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
