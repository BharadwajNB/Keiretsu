'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import { AVAILABILITY_LABELS } from '@/lib/types';
import type { Profile } from '@/lib/types';
import { MapPin, ExternalLink, Building2, Calendar, MessageCircle, Map, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';
import ConnectModal from '@/components/profile/ConnectModal';

// ---- Skeleton ----------------------------------------------------------------
function ProfileSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      <div className={`${styles.skeleton} ${styles.skHero}`} />
      <div className={`${styles.skeleton} ${styles.skAvatar}`} />
      <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '40%' }} />
        <div className={`${styles.skeleton} ${styles.skLineSm}`} style={{ width: '60%' }} />
        <div style={{ height: 1 }} />
        <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '100%' }} />
        <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '85%' }} />
        <div className={`${styles.skeleton} ${styles.skLineSm}`} style={{ width: '70%' }} />
      </div>
    </div>
  );
}

// ---- Main Page ---------------------------------------------------------------
export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        const { data: skillData } = await supabase
          .from('profile_skills')
          .select('skills(name)')
          .eq('profile_id', data.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const skills = skillData?.map((s: any) => s.skills?.name).filter(Boolean) || [];
        setProfile({ ...data, skills });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  // ---- Loading ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className={styles.main}>
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  // ---- Not Found -------------------------------------------------------------
  if (!profile) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-center">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Profile not found</h2>
            <p className="text-muted mt-2">This user may have been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Derived values --------------------------------------------------------
  const availBadgeClass =
    profile.availability_status === 'open_to_collab'
      ? styles.green
      : profile.availability_status === 'busy'
      ? styles.red
      : styles.amber;

  const isPulsing = profile.availability_status === 'open_to_collab';
  const isOwner = currentUser?.id === profile.user_id;

  return (
    <div className="page">
      <Navbar />
      <main className={styles.main}>
        {/* ---- Hero Banner ---- */}
        <motion.div
          className={styles.heroBanner}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className={styles.heroBannerGlow} />
          <div className={styles.heroBannerGrid} />
        </motion.div>

        {/* ---- Card Body ---- */}
        <motion.div
          className={styles.profileCard}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Avatar + Badge row (overlaps banner) */}
          <div className={styles.avatarRow}>
            <div className={styles.avatarRing}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url || '/default-avatar.svg'}
                alt={profile.name}
                className={styles.avatar}
              />
            </div>

            <div className={`${styles.availabilityBadge} ${availBadgeClass}`}>
              <span className={`${styles.availabilityDot} ${isPulsing ? styles.pulsing : ''}`} />
              {AVAILABILITY_LABELS[profile.availability_status]}
            </div>
          </div>

          {/* Name + meta */}
          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{profile.name}</h1>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <Building2 size={15} className="text-muted" />
                <span>{profile.college}</span>
              </div>
              <div className={styles.metaItem}>
                <Calendar size={15} className="text-muted" />
                <span>Year {profile.year}</span>
              </div>
              {profile.distance_km !== undefined && (
                <div className={styles.metaItem}>
                  <MapPin size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {profile.distance_km} km away
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Bio */}
          {profile.bio && (
            <div className={styles.bioSection}>
              <span className={styles.bioQuoteMark}>&ldquo;</span>
              <p className={styles.bio}>{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p className={styles.sectionLabel}>Tech Stack</p>
              <motion.div
                className={styles.skillGrid}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {profile.skills.map((skill) => (
                  <motion.span
                    key={skill}
                    className={styles.skillTag}
                    variants={{
                      hidden: { opacity: 0, scale: 0.85 },
                      visible: { opacity: 1, scale: 1 },
                    }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          )}

          {/* Footer Actions */}
          <div className={styles.footerActions}>
            {isOwner ? (
              <a href="/profile/edit" className={styles.connectBtn} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <Edit3 size={16} />
                Edit Profile
              </a>
            ) : (
              <button className={styles.connectBtn} onClick={() => setShowConnectModal(true)}>
                <MessageCircle size={16} />
                Connect
              </button>
            )}

            {profile.latitude && profile.longitude && (
              <a
                href={`/map?lat=${profile.latitude}&lng=${profile.longitude}`}
                className={styles.mapBtn}
              >
                <Map size={16} />
                View on Map
              </a>
            )}

            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubBtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
                <ExternalLink size={14} style={{ opacity: 0.6 }} />
              </a>
            )}
          </div>
        </motion.div>
      </main>

      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        recipientName={profile.name}
      />
    </div>
  );
}
