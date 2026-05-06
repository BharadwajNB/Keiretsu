'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MapPin, Code2, Users2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarField from '@/components/globe/StarField';
import UniversityPopup from '@/components/globe/UniversityPopup';
import { UNIVERSITIES, TOTAL_BUILDERS, TOTAL_UNIVERSITIES } from '@/lib/universityData';
import type { UniversityNode } from '@/lib/universityData';
import styles from './page.module.css';

// Dynamic import of GlobeView — no SSR (WebGL)
const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  ),
});

// Dynamic import of DetailedMapView — no SSR (Leaflet relies on window)
const DetailedMapView = dynamic(() => import('@/components/globe/DetailedMapView'), {
  ssr: false,
});

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityNode | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDetailedMap, setShowDetailedMap] = useState(false);
  const [fullyHideGlobe, setFullyHideGlobe] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const heroRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay the heavy WebGL globe initialization so Framer Motion text animations
    // run buttery smooth on the main thread during initial page load.
    const timer = setTimeout(() => setIsGlobeReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNodeClick = useCallback((node: UniversityNode, position?: { x: number; y: number }) => {
    const el = heroRightRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    
    // Always center the popup in the DetailedMapView since we are overriding global view
    setPopupPosition({
      x: rect.width / 2,
      y: rect.height / 2 - 40,
    });
    
    setSelectedUniversity(node);
    
    // Show detailed map after globe zoom animation completes
    setTimeout(() => {
      setShowDetailedMap(true);
      // Once the map is fully faded in (1.5s), hide the globe to save GPU
      setTimeout(() => setFullyHideGlobe(true), 1500);
    }, 2000);
  }, []);

  const handleDetailedMarkerClick = useCallback((node: UniversityNode) => {
    setSelectedUniversity(node);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowDetailedMap(false);
    setFullyHideGlobe(false);
    
    // Slight delay to allow fade out before removing university entirely
    setTimeout(() => {
      setSelectedUniversity(null);
    }, 300);
  }, []);

  // Duplicate ticker list for seamless loop
  const tickerItems = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <div className="page">
      <Navbar />

      <main className={styles.main}>
        {/* Hero Section — Split Layout */}
        <section className={styles.hero}>
          <StarField />

          {/* Left: Title + CTAs */}
          <div className={styles.heroLeft}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeIn} className={styles.badge}>
                <span className={styles.badgeDot} />
                <span>Keiretsu Beta v1.0</span>
              </motion.div>

              <motion.h1 variants={fadeIn} className={styles.title}>
                Find the <span style={{ whiteSpace: 'nowrap' }}>right builders,</span> <span className={styles.highlight}>right where you are.</span>
              </motion.h1>

              <motion.div variants={fadeIn} className={styles.accentLine} />

              <motion.p variants={fadeIn} className={styles.subtitle}>
                A proximity-based network for students and engineers.
                Discover who is building what around you, and find your next co-founder.
              </motion.p>

              <motion.div variants={fadeIn} className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{TOTAL_BUILDERS}+</span>
                  <span className={styles.statLabel}>Builders</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{TOTAL_UNIVERSITIES}</span>
                  <span className={styles.statLabel}>Universities</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>12</span>
                  <span className={styles.statLabel}>Cities</span>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className={styles.ctaGroup}>
                <Link href="/login" className={styles.primaryBtn}>
                  Get Started
                  <ArrowRight size={16} className={styles.btnIcon} />
                </Link>
                <Link href="/search" className={styles.secondaryBtn}>
                  Explore Skills
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right: Globe */}
          <div className={styles.heroRight} ref={heroRightRef}>
            <div className={styles.globeGlow} />
            
            <div className={styles.globeContainer} style={{ display: fullyHideGlobe ? 'none' : 'block' }}>
              {isGlobeReady ? (
                <GlobeView onNodeClick={handleNodeClick} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" />
                </div>
              )}
            </div>
              
            {/* Detailed Leaflet Overlay */}
            {showDetailedMap && selectedUniversity && (
              <DetailedMapView 
                university={selectedUniversity} 
                onClose={handleClosePopup} 
                onMarkerClick={handleDetailedMarkerClick}
              />
            )}

            {/* Popup (Z-index ensures it sits above both globe and leaflet) */}
            <AnimatePresence>
              {selectedUniversity && (
                <UniversityPopup
                  university={selectedUniversity}
                  position={popupPosition}
                  onClose={handleClosePopup}
                />
              )}
            </AnimatePresence>

            {/* Globe Controls */}
            <div className={styles.globeControls}>
              <div className={styles.interactionBadge}>
                <span className={styles.interactionDot} />
                <span>Interaction Active</span>
              </div>
              <div className={styles.controlHint}>Scroll to Zoom</div>
              <div className={styles.controlHint}>Drag to Rotate</div>
            </div>
          </div>
        </section>

        {/* University Ticker */}
        <section className={styles.universityTicker}>
          <div className={styles.tickerLabel}>Trusted by builders at</div>
          <div className={styles.tickerTrack}>
            {tickerItems.map((uni, i) => (
              <div key={`${uni.id}-${i}`} className={styles.tickerItem}>
                <span className={styles.tickerDot} />
                <span>{uni.shortName}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <motion.div
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeIn} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <MapPin size={24} className={styles.featureIcon} />
              </div>
              <h3>Proximity First</h3>
              <p>See exactly who is coding near you right now. Perfect for college campuses and local tech hubs.</p>
            </motion.div>

            <motion.div variants={fadeIn} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <Code2 size={24} className={styles.featureIcon} />
              </div>
              <h3>Skill-Based Discovery</h3>
              <p>Filter the map by exact tech stacks. Looking for a Next.js wizard or a PyTorch expert? Just search.</p>
            </motion.div>

            <motion.div variants={fadeIn} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <Users2 size={24} className={styles.featureIcon} />
              </div>
              <h3>Frictionless Collab</h3>
              <p>Profiles show clear availability statuses. Know instantly if someone is looking for a co-founder or just browsing.</p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
