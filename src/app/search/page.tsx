'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search as SearchIcon, MapPin, Building2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useSkills } from '@/hooks/useSkills';
import { AVAILABILITY_LABELS } from '@/lib/types';
import styles from './page.module.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function badgeClass(status: string) {
  if (status === 'open_to_collab') return 'badge badge-green';
  if (status === 'busy') return 'badge badge-red';
  return 'badge badge-amber';
}

// ---- Skeleton ---------------------------------------------------------------
function SkeletonCards() {
  return (
    <div className={styles.skeletonGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonCard} style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

// ---- Main Page --------------------------------------------------------------
export default function SearchPage() {
  const { latitude, longitude } = useGeolocation();
  const { skills: allSkills } = useSkills();
  const [nameSearch, setNameSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [collegeFilter, setCollegeFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [skillInput, setSkillInput] = useState('');

  const params = useMemo(() => {
    if (!latitude || !longitude) return null;
    return {
      lat: latitude,
      lng: longitude,
      radiusKm,
      skillFilter: selectedSkills.length > 0 ? selectedSkills : undefined,
      collegeFilter: collegeFilter || undefined,
      nameSearch: nameSearch || undefined,
    };
  }, [latitude, longitude, radiusKm, selectedSkills, collegeFilter, nameSearch]);

  const { users, loading } = useNearbyUsers(params);

  const toggleSkill = (name: string) =>
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );

  const filteredSkillOptions = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
      !selectedSkills.includes(s.name)
  );

  return (
    <div className="page">
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>

          {/* Page Header */}
          <motion.div
            className={styles.pageHeader}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className={styles.pageTitle}>Discover Builders</h1>
            <p className={styles.pageSubtitle}>
              Find developers by name, skill, or college within your radius.
            </p>
          </motion.div>

          {/* Filter Panel */}
          <motion.div
            className={styles.filterPanel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.filterRow}>
              {/* Name search */}
              <div className={styles.inputGroup}>
                <label className={styles.filterLabel}>Name</label>
                <div className={styles.inputWrapper}>
                  <SearchIcon size={16} className={styles.inputIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Search by name..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* College filter */}
              <div className={styles.inputGroup}>
                <label className={styles.filterLabel}>College</label>
                <div className={styles.inputWrapper}>
                  <Building2 size={16} className={styles.inputIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Filter by college..."
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Radius */}
              <div className={styles.radiusGroup}>
                <div className={styles.radiusValue}>
                  <span className={styles.filterLabel}>Radius</span>
                  <strong>{radiusKm} km</strong>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>

            {/* Skills filter */}
            <div className={styles.skillsRow}>
              <span className={styles.skillsLabel}>Skills:</span>
              <AnimatePresence>
                {selectedSkills.map((s) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="tag tag-removable"
                    onClick={() => toggleSkill(s)}
                  >
                    {s} ✕
                  </motion.span>
                ))}
              </AnimatePresence>

              <div className={styles.skillDropdownWrap}>
                <input
                  className={styles.skillInput}
                  placeholder="+ Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                />
                {skillInput && filteredSkillOptions.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredSkillOptions.slice(0, 8).map((s) => (
                      <button
                        key={s.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          toggleSkill(s.name);
                          setSkillInput('');
                        }}
                      >
                        {s.name}
                        <span className={styles.dropdownCat}>{s.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {loading ? 'Searching…' : `${users.length} builder${users.length !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {/* No location */}
          {!latitude && (
            <div className={styles.stateBox}>
              <MapPin size={44} style={{ opacity: 0.25 }} />
              <h3>Location required</h3>
              <p>Enable location access to search builders by proximity.</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <SkeletonCards />}

          {/* Empty */}
          {!loading && users.length === 0 && latitude && (
            <div className={styles.stateBox}>
              <SearchIcon size={44} style={{ opacity: 0.25 }} />
              <h3>No builders found</h3>
              <p>Try expanding your radius or adjusting your filters.</p>
            </div>
          )}

          {/* Result cards */}
          {!loading && users.length > 0 && (
            <motion.div
              className={styles.grid}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {users.map((user) => (
                <motion.a
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className={styles.resultCard}
                  variants={itemVariants}
                >
                  <div className={styles.cardTop}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar_url || '/default-avatar.svg'}
                      alt={user.name}
                      className={styles.avatar}
                    />

                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{user.name}</div>
                      <div className={styles.cardMeta}>
                        <Building2 size={12} style={{ opacity: 0.5 }} />
                        <span>Year {user.year} · {user.college}</span>
                      </div>
                    </div>

                    <div className={styles.cardRight}>
                      <span className={styles.distanceTag}>{user.distance_km} km</span>
                      <span className={badgeClass(user.availability_status)}>
                        {AVAILABILITY_LABELS[user.availability_status]}
                      </span>
                    </div>
                  </div>

                  {user.bio && (
                    <p className={styles.cardBio}>{user.bio}</p>
                  )}

                  {user.skills && user.skills.length > 0 && (
                    <div className={styles.cardSkills}>
                      {user.skills.slice(0, 6).map((s) => (
                        <span key={s} className={styles.cardSkillTag}>{s}</span>
                      ))}
                    </div>
                  )}

                  {user.github_url && (
                    <div className={styles.cardGithub}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span>{user.github_url.replace('https://github.com/', '')}</span>
                    </div>
                  )}
                </motion.a>
              ))}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
