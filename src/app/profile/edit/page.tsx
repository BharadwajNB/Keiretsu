'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkills } from '@/hooks/useSkills';
import { AVAILABILITY_LABELS } from '@/lib/types';
import type { AvailabilityStatus } from '@/lib/types';
import { Globe, Save, Briefcase, Code, MapPin, X, User, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

function ProfileEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const { profile, loading, updateProfile, updateLocation, updateSkills } = useProfile();
  const { latitude, longitude, requestLocation, permissionState } = useGeolocation();
  const { skills: allSkills } = useSkills();

  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState(1);
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>('open_to_collab');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(profile.name || '');
      setCollege(profile.college || '');
      setYear(profile.year || 1);
      setBio(profile.bio || '');
      setGithubUrl(profile.github_url || '');
      setAvailability(profile.availability_status || 'open_to_collab');
      setSelectedSkills(profile.skills || []);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      name,
      college,
      year,
      bio,
      github_url: githubUrl,
      availability_status: availability,
    });

    await updateSkills(selectedSkills);

    if (latitude && longitude) {
      await updateLocation(latitude, longitude);
    }

    if (!error) {
      setSaved(true);
      if (typeof window !== 'undefined') {
        const channel = new BroadcastChannel('profile-updates');
        channel.postMessage({ type: 'profile-updated' });
        channel.close();
      }
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  const filteredSkills = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(s.name)
  );

  const progress = (() => {
    let score = 0;
    if (name) score += 15;
    if (college) score += 15;
    if (year) score += 10;
    if (githubUrl) score += 15;
    if (bio) score += 15;
    if (selectedSkills.length > 0) score += 15;
    if (availability) score += 15;
    return Math.min(100, score);
  })();

  if (loading) {
    return (
      <div className="page">
        <div className="page-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <main className={styles.main}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />

        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h1 style={{ margin: 0 }}>Edit Profile</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !name || !college || !githubUrl}
              className={styles.saveBtn}
            >
              <Save size={16} />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </motion.button>
          </div>
        </div>

        <div className={styles.container}>
          {isWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.welcomeBanner}
            >
              <h2>🎉 Welcome to Keiretsu!</h2>
              <p>Complete your profile to appear on the skill map.</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.heroProfile}
          >
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarRing} />
              {(() => {
                const avatarUrl = (() => {
                  if (profile?.avatar_url) return profile.avatar_url;
                  if (githubUrl) {
                    const match = githubUrl.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                    if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
                  }
                  return null;
                })();

                if (avatarUrl) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={name || 'Avatar'}
                      className={styles.avatarInner}
                      style={{ objectFit: 'cover' }}
                    />
                  );
                }
                return (
                  <div className={styles.avatarInner}>
                    {name ? name.charAt(0) : <User size={48} />}
                  </div>
                );
              })()}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              {name || 'New User'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0 }}>
              {college || 'Add your college'} • Class of {new Date().getFullYear() + (4 - year)}
            </p>
          </motion.div>

          <div className={styles.grid}>
            {/* Left Column - Profile Info & Insights */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 32, height: '100%' }}
            >
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <User size={16} /> Profile Info
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className={styles.inputRow}>
                    <div className={styles.cyberInputGroup} style={{ marginBottom: 0 }}>
                      <label className={styles.cyberLabel}>Name *</label>
                      <input
                        className={styles.cyberInput}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className={styles.cyberInputGroup} style={{ marginBottom: 0 }}>
                      <label className={styles.cyberLabel}>Year *</label>
                      <select
                        className={styles.cyberInput}
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>5th Year</option>
                        <option value={6}>Graduate</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.cyberInputGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.cyberLabel}>College / Institution *</label>
                    <input
                      className={styles.cyberInput}
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. JNTU Hyderabad"
                    />
                  </div>

                  <div className={styles.cyberInputGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.cyberLabel}><Globe size={14} /> GitHub Profile *</label>
                    <input
                      className={styles.cyberInput}
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div className={styles.cyberInputGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.cyberLabel}>Bio</label>
                    <textarea
                      className={styles.cyberInput}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="What are you building? What do you want to learn?"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.section} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.sectionTitle}>
                  <Activity size={16} /> Profile Insights
                </h2>
                
                <div className={styles.insightsGrid}>
                  <div className={`${styles.insightCard} ${styles.fullWidth}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                      <div>
                        <div className={styles.insightValue}>{progress}%</div>
                        <div className={styles.insightLabel}>Profile Completion</div>
                      </div>
                      {progress === 100 && (
                        <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={14} fill="currentColor" /> Max Level
                        </span>
                      )}
                    </div>
                    <div className={styles.profileProgress} style={{ marginTop: 0, maxWidth: '100%', height: 8 }}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className={styles.insightCard}>
                    <div className={styles.insightValue}>{selectedSkills.length}</div>
                    <div className={styles.insightLabel}>Skills Added</div>
                  </div>

                  <div className={styles.insightCard}>
                    <div className={styles.insightValue} style={{ fontSize: 20 }}>
                      {availability === 'open_to_collab' ? 'Open' : availability === 'looking_for_cofounder' ? 'Co-founder' : 'Busy'}
                    </div>
                    <div className={styles.insightLabel}>Status</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Status, Skills & Location */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
            >
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Briefcase size={16} /> Availability
                </h2>
                <div className={styles.availabilityGrid}>
                  {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                    <motion.div
                      key={value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`${styles.availabilityCard} ${availability === value ? styles.active : ''}`}
                      onClick={() => setAvailability(value as AvailabilityStatus)}
                    >
                      <div>
                        <div className={styles.availabilityTitle}>{label}</div>
                        <div className={styles.availabilityDesc}>
                          {value === 'open_to_collab' ? 'Looking for projects and teams to join.'
                            : value === 'looking_for_cofounder' ? 'Looking for co-founders to start a new venture.'
                              : 'Currently unavailable for new side quests.'}
                        </div>
                      </div>
                      <div className={styles.availabilityIcon} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Code size={16} /> Skills
                </h2>

                <AnimatePresence>
                  {selectedSkills.length > 0 && (
                    <motion.div className={styles.selectedSkills}>
                      {selectedSkills.map((skill) => (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          key={skill}
                          className={styles.skillChip}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill} <X size={14} />
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.cyberInputGroup}>
                  <input
                    className={styles.cyberInput}
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const query = skillSearch.trim();
                        if (query && !selectedSkills.some(s => s.toLowerCase() === query.toLowerCase())) {
                          toggleSkill(query);
                          setSkillSearch('');
                        }
                      }
                    }}
                    placeholder="Search or type a custom skill and press Enter..."
                  />
                </div>

                <div className={styles.skillGrid}>
                  {skillSearch.trim() && !allSkills.some(s => s.name.toLowerCase() === skillSearch.trim().toLowerCase()) && !selectedSkills.some(s => s.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={styles.suggestedSkill}
                      style={{ background: 'rgba(129, 140, 248, 0.15)', borderColor: '#818cf8', color: '#818cf8' }}
                      onClick={() => {
                        toggleSkill(skillSearch.trim());
                        setSkillSearch('');
                      }}
                    >
                      + Add &quot;{skillSearch.trim()}&quot; (Custom)
                    </motion.button>
                  )}

                  {filteredSkills.slice(0, 15).map((skill) => (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={skill.id}
                      className={styles.suggestedSkill}
                      onClick={() => {
                        toggleSkill(skill.name);
                        setSkillSearch('');
                      }}
                    >
                      + {skill.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <MapPin size={16} /> Location
                </h2>

                <div className={styles.locationCard}>
                  {permissionState === 'granted' && latitude ? (
                    <div>
                      <p className={styles.locationStatus}>
                        <span className={styles.locationDot} /> Location active
                      </p>
                      <p className="text-muted" style={{ fontSize: 13 }}>
                        Your position is shared on the map. Others nearby can discover you.
                      </p>
                    </div>
                  ) : permissionState === 'denied' ? (
                    <div>
                      <p style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                        Location permission denied
                      </p>
                      <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        Enable location in your browser settings to appear on the map.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 8, color: 'white' }}>
                        Enable location to appear on the map
                      </p>
                      <button onClick={requestLocation} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} /> Share My Location
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<div className="page-center"><div className="spinner" /></div>}>
      <ProfileEditContent />
    </Suspense>
  );
}
