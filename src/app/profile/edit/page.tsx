'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkills } from '@/hooks/useSkills';
import { AVAILABILITY_LABELS } from '@/lib/types';
import type { AvailabilityStatus } from '@/lib/types';
import { ArrowLeft, Globe, Save, Briefcase, Code, MapPin, X, User, Activity, Zap, Upload, Trash2, Plus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

const GithubIcon = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const { size = 18, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
};

const TABS = [
  { id: 'basic', label: 'Basic Information', icon: User, desc: 'Manage your personal details.' },
  { id: 'skills', label: 'Skills & Technologies', icon: Code, desc: 'Show what you are good at.' },
  { id: 'availability', label: 'Ready To Collaborate', icon: Briefcase, desc: 'Let others know your availability.' },
  { id: 'location', label: 'Location', icon: MapPin, desc: 'Help collaborators find you.' },
  { id: 'social', label: 'Social Links', icon: GithubIcon, desc: 'Connect your developer profiles.' },
] as const;


type TabId = typeof TABS[number]['id'];

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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('basic');

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
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Auto-update location when available
  useEffect(() => {
    if (latitude && longitude && profile) {
      updateLocation(latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      name,
      college,
      year,
      bio,
      github_url: githubUrl,
      availability_status: availability,
      avatar_url: avatarUrl,
    });

    await updateSkills(selectedSkills);

    if (!error) {
      setSaved(true);
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
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
      <div className="page" style={{ backgroundColor: '#0b0b12' }}>
        <Navbar />
        <div className="page-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ backgroundColor: '#0b0b12' }}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />

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

          <div className={styles.layoutGrid}>
            {/* LEFT PANEL */}
            <div className={styles.leftPanel}>
              {/* Top Card: Progress Circle & Save Changes */}
              <div className={styles.dashboardCard}>
                <div className={styles.progressRingContainer}>
                  <svg width="120" height="120" viewBox="0 0 120 120" className={styles.progressRing}>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={styles.progressRingBg}
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={styles.progressRingIndicator}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - progress / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={styles.progressRingText}>{progress}%</div>
                </div>

                <div className={styles.progressInfo}>
                  <h3>Complete your profile</h3>
                  <p>Unlock better collaboration opportunities.</p>
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

              {/* Navigation Tabs Menu */}
              <div className={styles.menuList}>
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.div
                      key={tab.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${styles.menuCard} ${isActive ? styles.menuCardActive : ''}`}
                    >
                      <div className={styles.menuCardIconWrapper}>
                        <TabIcon size={18} className={isActive ? styles.activeIcon : styles.inactiveIcon} />
                      </div>
                      <div className={styles.menuCardContent}>
                        <h4>{tab.label}</h4>
                        <p>{tab.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className={styles.rightPanel}>
              {/* Header */}
              <div className={styles.panelHeader}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
                  <div>
                    <h1 className={styles.panelTitle}>Edit Profile</h1>
                    <p className={styles.panelSubtitle}>Keep your profile updated to attract the right collaborators.</p>
                  </div>
                  <button
                    onClick={() => router.push(profile ? `/profile/${profile.id}` : '/map')}
                    className={styles.backBtn}
                    title="Back"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                </div>
              </div>

              {/* Profile Avatar Selection Row */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarGlowWrapper}>
                  <div className={styles.avatarRing} />
                  <div className={styles.avatarInner}>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
                    ) : (
                      name ? name.charAt(0) : <User size={40} />
                    )}
                  </div>
                </div>
                <div className={styles.avatarInfo}>
                  <h3>{name || 'New Developer'}</h3>
                  <div className={styles.avatarActions}>
                    <label htmlFor="avatar-upload" className={styles.uploadBtn}>
                      <Upload size={14} /> Upload Avatar
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                    {avatarUrl && (
                      <button onClick={handleRemoveAvatar} className={styles.removeBtn}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Panels with Swapping Animations */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className={styles.formContainer}
                >
                  {activeTab === 'basic' && (
                    <div className={styles.formCard}>
                      <h2 className={styles.formCardTitle}><User size={16} /> Basic Information</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Name *</label>
                          <input
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                          />
                        </div>

                        <div className={styles.inputRow}>
                          <div className={styles.inputGroup} style={{ flex: 2 }}>
                            <label className={styles.label}>College / Institution *</label>
                            <input
                              className={styles.input}
                              value={college}
                              onChange={(e) => setCollege(e.target.value)}
                              placeholder="e.g. JNTU Hyderabad"
                            />
                          </div>

                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Year *</label>
                            <select
                              className={styles.selectInput}
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

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Bio</label>
                          <textarea
                            className={styles.textarea}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="What are you building? What do you want to learn?"
                            rows={5}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className={styles.formCard}>
                      <h2 className={styles.formCardTitle}><Code size={16} /> Skills & Technologies</h2>
                      
                      <p className={styles.fieldDescription}>
                        Display skills as glowing tags. Add skills with the input or choose from common suggestions below.
                      </p>

                      <div className={styles.skillsWrapper}>
                        <AnimatePresence>
                          {selectedSkills.map((skill) => (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              key={skill}
                              className={styles.skillChip}
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={styles.removeSkillBtn}
                              >
                                <X size={12} />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>

                      <div className={styles.skillInputWrapper}>
                        <input
                          className={styles.input}
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
                          placeholder="Search or type a custom skill..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const query = skillSearch.trim();
                            if (query && !selectedSkills.some(s => s.toLowerCase() === query.toLowerCase())) {
                              toggleSkill(query);
                              setSkillSearch('');
                            }
                          }}
                          className={styles.addSkillBtn}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className={styles.suggestedSkillsGrid}>
                        {skillSearch.trim() && !allSkills.some(s => s.name.toLowerCase() === skillSearch.trim().toLowerCase()) && !selectedSkills.some(s => s.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            className={styles.customSkillBtn}
                            onClick={() => {
                              toggleSkill(skillSearch.trim());
                              setSkillSearch('');
                            }}
                          >
                            + Add "{skillSearch.trim()}" (Custom)
                          </motion.button>
                        )}

                        {filteredSkills.slice(0, 12).map((skill) => (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={skill.id}
                            type="button"
                            className={styles.suggestedSkillBtn}
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
                  )}

                  {activeTab === 'availability' && (
                    <div className={styles.formCard}>
                      <h2 className={styles.formCardTitle}><Briefcase size={16} /> Ready To Collaborate</h2>
                      <p className={styles.fieldDescription}>Choose your availability status. This sets your color key on the map.</p>
                      
                      <div className={styles.availabilitySelectGrid}>
                        {[
                          {
                            value: 'open_to_collab',
                            color: '🟢',
                            label: 'Ready to Collaborate',
                            desc: 'Open to new projects and teammates.'
                          },
                          {
                            value: 'looking_for_cofounder',
                            color: '🟡',
                            label: 'Building Solo',
                            desc: 'Working independently but open to discussions.'
                          },
                          {
                            value: 'busy',
                            color: '🔴',
                            label: 'Busy',
                            desc: 'Currently occupied but available later.'
                          }
                        ].map((item) => {
                          const isActive = availability === item.value;
                          return (
                            <motion.div
                              key={item.value}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setAvailability(item.value as AvailabilityStatus)}
                              className={`${styles.availabilityOptionCard} ${isActive ? styles.availabilityOptionActive : ''}`}
                            >
                              <div className={styles.availabilityOptionHeader}>
                                <span style={{ marginRight: 8, fontSize: 16 }}>{item.color}</span>
                                <h4>{item.label}</h4>
                                <div className={styles.checkboxOuter}>
                                  {isActive && <div className={styles.checkboxInner} />}
                                </div>
                              </div>
                              <p>{item.desc}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'location' && (
                    <div className={styles.formCard}>
                      <h2 className={styles.formCardTitle}><MapPin size={16} /> Location</h2>
                      <p className={styles.fieldDescription}>Enable browser location to be matched with developers in your area.</p>

                      <div className={styles.locationContainerCard}>
                        {permissionState === 'granted' && latitude !== null && longitude !== null ? (
                          <div className={styles.locationActiveContent}>
                            <div className={styles.activeDotContainer}>
                              <span className={styles.pulsingDot} />
                              <span className={styles.activeLabel}>Location active</span>
                            </div>
                            <div className={styles.coordinatesText}>
                              Lat: {latitude.toFixed(6)} • Lng: {longitude.toFixed(6)}
                            </div>
                            <p className={styles.locationNote}>
                              Your coordinates are plotted on the collaborative metaverse map. Neighbors can locate your skill node.
                            </p>
                          </div>
                        ) : permissionState === 'denied' ? (
                          <div className={styles.locationDeniedContent}>
                            <h4 style={{ color: '#f87171' }}>Location access denied</h4>
                            <p>
                              Please clear your browser permissions settings to allow coordinate sharing.
                            </p>
                          </div>
                        ) : (
                          <div className={styles.locationPromptContent}>
                            <h4>Help collaborators find you</h4>
                            <p>
                              Share your location to pinpoint your spot on the developer metaverse maps.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={requestLocation}
                              className={styles.shareLocationBtn}
                            >
                              <MapPin size={16} /> Share My Location
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'social' && (
                    <div className={styles.formCard}>
                      <h2 className={styles.formCardTitle}><Globe size={16} /> Social Links</h2>
                      <p className={styles.fieldDescription}>Connect your public developer logs and code platforms.</p>

                      <div className={styles.socialInputCard}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <GithubIcon size={16} />
                              GitHub Profile URL *
                            </span>
                          </label>
                          <input
                            className={styles.input}
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            placeholder="https://github.com/yourusername"
                          />
                        </div>
                      </div>

                      {githubUrl && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={styles.githubPreviewCard}
                        >
                          <div className={styles.githubPreviewHeader}>
                            <GithubIcon size={20} className={styles.glowGithubIcon} />
                            <div>
                              <h4>GitHub Profile Bound</h4>
                              <p>Connect your developer logs dynamically.</p>
                            </div>
                          </div>
                          <a
                            href={githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.viewGithubLink}
                          >
                            <span>Open GitHub Profile</span>
                            <ExternalLink size={12} />
                          </a>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
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

