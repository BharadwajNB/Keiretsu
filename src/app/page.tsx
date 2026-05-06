'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { MapPin, Code2, Users2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import styles from './page.module.css';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  return (
    <div className="page">
      <Navbar />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.glow} />
          
          <motion.div 
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeIn} className={styles.badge}>
              <span className={styles.badgeDot} />
              <span>Keiretsu Beta v1.0</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className={styles.title}>
              Find the right builders,<br />
              <span className={styles.highlight}>right where you are.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className={styles.subtitle}>
              A proximity-based network for students and engineers. 
              Discover who is building what around you, and find your next co-founder.
            </motion.p>
            
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
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <motion.div 
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
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
