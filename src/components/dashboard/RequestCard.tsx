'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Rocket, Users, Code, Cpu } from 'lucide-react';
import styles from './RequestCard.module.css';

export interface RequestData {
  id: string;
  senderName: string;
  avatarUrl: string;
  intent: 'startup' | 'hackathon' | 'opensource' | 'aiml';
  message: string;
  compatibility: number;
}

interface RequestCardProps {
  data: RequestData;
  onActionComplete: (id: string) => void;
}

const INTENT_CONFIG = {
  startup: { label: 'Startup Idea', icon: Rocket },
  hackathon: { label: 'Hackathon Team', icon: Users },
  opensource: { label: 'Open Source', icon: Code },
  aiml: { label: 'AI/ML Project', icon: Cpu },
};

export default function RequestCard({ data, onActionComplete }: RequestCardProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);

  const handleAccept = () => {
    setIsAccepted(true);
    setTimeout(() => {
      onActionComplete(data.id);
    }, 1500);
  };

  const handleDecline = () => {
    setIsDeclined(true);
    setTimeout(() => {
      onActionComplete(data.id);
    }, 500);
  };

  if (isDeclined) return null;

  const intent = INTENT_CONFIG[data.intent];
  const Icon = intent.icon;

  return (
    <motion.div 
      className={styles.card}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatarRing}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.avatarUrl} alt={data.senderName} className={styles.avatar} />
          </div>
          <div>
            <div className={styles.name}>{data.senderName}</div>
            <div className={styles.intent}>
              <Icon size={14} />
              {intent.label}
            </div>
          </div>
        </div>
        <div className={styles.compatibility}>
          {data.compatibility}% Match
        </div>
      </div>

      <p className={styles.message}>
        &ldquo;{data.message}&rdquo;
      </p>

      <div className={styles.footer}>
        <button className={styles.acceptBtn} onClick={handleAccept}>
          <Check size={16} />
          Accept
        </button>
        <button className={styles.declineBtn} onClick={handleDecline}>
          Decline
        </button>
      </div>

      <AnimatePresence>
        {isAccepted && (
          <motion.div 
            className={styles.successOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', borderRadius: '50%', padding: '8px' }}>
              <Check size={24} color="var(--accent-green)" />
            </div>
            <span className={styles.successText}>Request Accepted!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
