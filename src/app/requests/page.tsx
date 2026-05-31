'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, ArrowLeft, Check, Rocket, Users, Code, Cpu, Loader2, MessageSquare } from 'lucide-react';
import { useConnectionRequests } from '@/hooks/useConnectionRequests';
import Navbar from '@/components/layout/Navbar';
import type { ConnectionRequest } from '@/lib/types';
import styles from './page.module.css';

const INTENT_CONFIG = {
  startup: { label: 'Startup Idea', icon: Rocket },
  hackathon: { label: 'Hackathon Team', icon: Users },
  opensource: { label: 'Open Source', icon: Code },
  aiml: { label: 'AI/ML Project', icon: Cpu },
};

function RequestCard({
  request,
  onAccept,
  onDecline
}: {
  request: ConnectionRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const handleAccept = () => {
    setStatus('accepted');
    setTimeout(() => {
      onAccept(request.id);
    }, 1200);
  };

  const handleDecline = () => {
    setStatus('declined');
    setTimeout(() => {
      onDecline(request.id);
    }, 400);
  };

  if (status === 'declined') return null;

  const sender = request.sender_profile;
  if (!sender) return null;

  const intent = INTENT_CONFIG[request.intent] || INTENT_CONFIG.startup;
  const Icon = intent.icon;

  // Simple compatibility calculation based on mock matching or skills overlay
  const matchPercent = request.sender_profile?.skills
    ? Math.min(100, 75 + request.sender_profile.skills.length * 5)
    : 80;

  return (
    <motion.div
      className={styles.card}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.cardHeader}>
        <Link href={`/profile/${sender.id}`} className={styles.profileLink}>
          <div className={styles.avatarRing}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(() => {
                if (sender.avatar_url) return sender.avatar_url;
                if (sender.github_url) {
                  const match = sender.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                  if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
                }
                return '/default-avatar.svg';
              })()}
              alt={sender.name}
              className={styles.avatar}
            />
          </div>
          <div>
            <h3 className={styles.senderName}>{sender.name}</h3>
            <p className={styles.metaText}>{sender.college} • Year {sender.year}</p>
            <div className={styles.intentBadge}>
              <Icon size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>{intent.label}</span>
            </div>
          </div>
        </Link>
        <div className={styles.compatibility}>{matchPercent}% Match</div>
      </div>

      {request.message && (
        <p className={styles.message}>
          &ldquo;{request.message}&rdquo;
        </p>
      )}

      {sender.skills && sender.skills.length > 0 && (
        <div className={styles.skillsSection}>
          <h4 className={styles.skillsTitle}>Tech Stack</h4>
          <div className={styles.skillsGrid}>
            {sender.skills.map((skill) => (
              <span key={skill} className={styles.skillTag}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.acceptBtn} onClick={handleAccept}>
          <Check size={16} />
          Accept Collaboration
        </button>
        <button className={styles.declineBtn} onClick={handleDecline}>
          Decline
        </button>
      </div>

      <AnimatePresence>
        {status === 'accepted' && (
          <motion.div
            className={styles.successOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              style={{ background: 'rgba(52, 211, 153, 0.15)', borderRadius: '50%', padding: '12px' }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check size={32} color="var(--accent-green)" />
            </motion.div>
            <span className={styles.successText}>Collaboration Confirmed!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RequestsPage() {
  const { requests, loading, acceptRequest, declineRequest } = useConnectionRequests();

  return (
    <div className={styles.container}>
      <Navbar />
      
      <main className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconContainer}>
              <Inbox size={24} />
            </div>
            <h1 className={styles.title}>INCOMING REQUESTS</h1>
            {!loading && requests.length > 0 && (
              <span className={styles.countBadge}>{requests.length}</span>
            )}
          </div>
          <Link href="/map" className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to Map
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsContainer}>
          <button className={`${styles.tab} ${styles.activeTab}`}>
            <Inbox size={16} />
            <span>Connection Requests</span>
            {!loading && requests.length > 0 && (
              <span className={styles.tabBadge}>{requests.length}</span>
            )}
          </button>
          <Link href="/chat" className={styles.tab}>
            <MessageSquare size={16} />
            <span>Direct Messages</span>
          </Link>
        </div>

        {loading ? (
          <div className={styles.loaderWrapper}>
            <Loader2 className="spinner" size={32} color="var(--accent-primary)" />
            <p className={styles.loaderText}>Loading connection requests...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {requests.length > 0 ? (
              <motion.div className={styles.listGrid} layout>
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                className={styles.emptyState}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <Inbox size={48} />
                </div>
                <h3 className={styles.emptyTitle}>Your Inbox is Empty</h3>
                <p className={styles.emptySubtitle}>
                  No pending connection requests. Open the Map to explore builders nearby and send collaboration invites.
                </p>
                <Link href="/map" className={styles.exploreBtn}>
                  Explore Nearby Builders
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
