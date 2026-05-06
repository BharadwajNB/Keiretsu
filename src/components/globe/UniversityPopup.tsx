'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Wrench, ArrowRight, X } from 'lucide-react';
import type { UniversityNode } from '@/lib/universityData';
import styles from './UniversityPopup.module.css';

interface UniversityPopupProps {
  university: UniversityNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function UniversityPopup({ university, position, onClose }: UniversityPopupProps) {
  return (
    <motion.div
      className={styles.popup}
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <button className={styles.close} onClick={onClose} aria-label="Close popup">
        <X size={12} />
      </button>

      <div className={styles.header}>
        <div className={styles.icon}>
          <GraduationCap size={20} />
        </div>
        <div>
          <div className={styles.name}>{university.name}</div>
          <div className={styles.city}>{university.city}</div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.stats}>
        <Users size={15} className={styles.statIcon} />
        <span className={styles.statText}>
          {university.builderCount} builder{university.builderCount !== 1 ? 's' : ''} active
        </span>
      </div>

      <div className={styles.stats}>
        <Wrench size={15} className={styles.statIcon} />
        <span className={styles.statText}>Top skills</span>
      </div>

      <div className={styles.skillsRow}>
        {university.topSkills.map((skill) => (
          <span key={skill} className={styles.skillTag}>{skill}</span>
        ))}
      </div>

      <Link href="/login" className={styles.cta}>
        Join to Connect
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}
