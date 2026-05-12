'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import RequestList from '../dashboard/RequestList';
import styles from './AuthenticatedHub.module.css';

// Reusing the same GlobeView for consistency, no SSR
const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  ),
});

export default function AuthenticatedHub() {
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  useEffect(() => {
    // Delay globe to ensure smooth entry animation
    const timer = setTimeout(() => setIsGlobeReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.hubWrapper}>
      <motion.div 
        className={styles.hubCard}
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left Typography */}
        <div className={styles.cardLeft}>
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Keiretsu Multiverse
          </motion.h1>
          <motion.div 
            className={styles.accentLine} 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ transformOrigin: 'left' }}
          />
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Connecting the Brightest Minds
          </motion.p>
        </div>

        {/* Right Globe Area */}
        <div className={styles.cardRight}>
          <div className={styles.globeWrapper}>
            {isGlobeReady && <GlobeView onNodeClick={() => {}} />}
          </div>
        </div>

        {/* Maximize Icon */}
        <Link href="/map" className={styles.expandButton} aria-label="Enter Map View">
          <Maximize2 size={24} />
        </Link>

        <div className={styles.controls}>
          <div className="badge" style={{ background: 'rgba(16,16,20,0.8)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', marginRight: 8, boxShadow: '0 0 8px var(--accent-green)' }} />
            Interaction Active
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <RequestList />
      </motion.div>
    </div>
  );
}
