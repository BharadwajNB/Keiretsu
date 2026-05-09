'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { MapPin, Code2, Users2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarField from '@/components/globe/StarField';
import UniversityPopup from '@/components/globe/UniversityPopup';
import { UNIVERSITIES } from '@/lib/universityData';
import type { UniversityNode } from '@/lib/universityData';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedHub from '@/components/home/AuthenticatedHub';
import { usePathname, useRouter } from 'next/navigation';
import { LoginContent } from './login/page';
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

export default function Home({ defaultShowLogin = false }: { defaultShowLogin?: boolean }) {
  const { user, loading } = useAuth();
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityNode | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDetailedMap, setShowDetailedMap] = useState(false);
  const [fullyHideGlobe, setFullyHideGlobe] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const heroRightRef = useRef<HTMLDivElement>(null);

  const [showLoginModal, setShowLoginModal] = useState(defaultShowLogin);
  const pathname = usePathname();
  const router = useRouter();

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
    if (pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);

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

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero} style={{ pointerEvents: 'none' }}>
            {/* Left: Skeleton Details */}
            <div className={styles.heroLeft}>
              <div className={`${styles.skeleton} ${styles.skeletonBadge}`} />
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '70%', marginTop: '12px' }} />
              <div className={styles.accentLine} style={{ opacity: 0.1 }} />
              <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '85%' }} />
              <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '50%' }} />
              
              <div className={styles.ctaGroup} style={{ marginTop: '36px' }}>
                <div className={`${styles.skeleton} ${styles.skeletonBtn}`} />
                <div className={`${styles.skeleton} ${styles.skeletonBtn}`} style={{ width: '130px' }} />
              </div>
            </div>

            {/* Right: Skeleton Globe */}
            <div className={styles.heroRight}>
              <div className={styles.globeGlow} style={{ opacity: 0.5 }} />
              <div className={`${styles.skeleton} ${styles.skeletonGlobe}`} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (user) {
    return (
      <div className="page">
        <Navbar />
        <main className={styles.main}>
          <StarField />
          <AuthenticatedHub />
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar onSignInClick={() => setShowLoginModal(true)} />

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

              <motion.div variants={fadeIn} className={styles.ctaGroup}>
                <button onClick={() => setShowLoginModal(true)} className={styles.primaryBtn}>
                  Get Started
                  <ArrowRight size={16} className={styles.btnIcon} />
                </button>
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

        {/* How It Works Section */}
        <section className={styles.howItWorks}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>How It Works</span>
            <h2 className={styles.sectionTitle}>Join the proximity network in three steps</h2>
            <p className={styles.sectionSubtitle}>Connecting with local developers has never been easier.</p>
          </div>
          
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.iconWrapper}>
                <MapPin size={24} className={styles.featureIcon} />
              </div>
              <h3>Drop a Pin</h3>
              <p>Securely share your approximate coordinates. You choose exactly when and how your profile is visible on the local map.</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.iconWrapper}>
                <Code2 size={24} className={styles.featureIcon} />
              </div>
              <h3>Tag Your Stack</h3>
              <p>Add your technical skills and clear availability status: open to collaborate, looking for a co-founder, or busy.</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.iconWrapper}>
                <Users2 size={24} className={styles.featureIcon} />
              </div>
              <h3>Discover Builders</h3>
              <p>Browse the map, filter by exact skills, and reach out to nearby developers for walking-distance collaboration.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Core Pillars</span>
            <h2 className={styles.sectionTitle}>Engineered for real-world collaboration</h2>
            <p className={styles.sectionSubtitle}>A secure, developer-first platform built to eliminate friction and spark innovation.</p>
          </div>

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

      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseLoginModal}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <LoginContent isModal={true} onCancel={handleCloseLoginModal} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
