'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import { AVAILABILITY_LABELS } from '@/lib/types';
import type { Profile } from '@/lib/types';
import { MapPin, ExternalLink, Building2, Calendar, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-center"><Loader2 className="spinner text-muted" size={32} /></div>
      </div>
    );
  }

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

  const badgeClass = profile.availability_status === 'open_to_collab'
    ? 'badge-green'
    : profile.availability_status === 'busy'
    ? 'badge-red'
    : 'badge-amber';

  return (
    <div className="page">
      <Navbar />
      <main className={styles.main}>
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Ambient Background Glow */}
          <div className={styles.glow} />

          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url || '/default-avatar.svg'}
                alt={profile.name}
                className={styles.avatar}
              />
            </div>
            
            <div className={styles.headerInfo}>
              <h1 className={styles.name}>{profile.name}</h1>
              
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <Building2 size={16} className="text-muted" />
                  <span>{profile.college}</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={16} className="text-muted" />
                  <span>Year {profile.year}</span>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <span className={`badge ${badgeClass}`}>
                  {AVAILABILITY_LABELS[profile.availability_status]}
                </span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className={styles.bioSection}>
              <p className={styles.bio}>&ldquo;{profile.bio}&rdquo;</p>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className={styles.skillsSection}>
              <h3 className={styles.sectionTitle}>Tech Stack</h3>
              <div className={styles.skillTags}>
                {profile.skills.map((skill, i) => (
                  <motion.span 
                    key={skill} 
                    className="tag"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.footerActions}>
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ExternalLink size={18} />
                View GitHub
              </a>
            )}
            
            {profile.distance_km !== undefined && (
              <div className={styles.distanceBadge}>
                <MapPin size={16} className="text-accent" />
                <span>{profile.distance_km} km away</span>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
