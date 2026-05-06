'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search as SearchIcon, MapPin, Building2, Link, ChevronDown, User as UserIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useSkills } from '@/hooks/useSkills';
import { AVAILABILITY_LABELS } from '@/lib/types';
import styles from './page.module.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function SearchPage() {
  const { latitude, longitude } = useGeolocation();
  const { skills: allSkills } = useSkills();
  const [nameSearch, setNameSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [collegeFilter, setCollegeFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [searchInput, setSearchInput] = useState('');

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

  const toggleSkill = (name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const filteredSkillOptions = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchInput.toLowerCase()) &&
      !selectedSkills.includes(s.name)
  );

  const badgeClass = (status: string) =>
    status === 'open_to_collab' ? 'badge-green' : status === 'busy' ? 'badge-red' : 'badge-amber';

  return (
    <div className="page">
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
            <h1>Search Builders</h1>
            <p className="text-muted">Find specific people or skills in your radius.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={styles.controls}>
            <div className={styles.searchRow}>
              <div className={styles.inputWrapper} style={{ flex: 2 }}>
                <SearchIcon size={18} className={styles.inputIcon} />
                <input
                  className={styles.searchBar}
                  placeholder="Search by name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                />
              </div>
              <div className={styles.inputWrapper} style={{ flex: 1 }}>
                <Building2 size={18} className={styles.inputIcon} />
                <input
                  className={styles.searchBar}
                  placeholder="Filter by college..."
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                />
              </div>
              <div className={styles.radiusControl}>
                <label className={styles.radiusLabel}>
                  Radius: <strong>{radiusKm} km</strong>
                </label>
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

            <div className={styles.skillRow}>
              <span className={styles.skillLabel}>Skills:</span>
              <AnimatePresence>
                {selectedSkills.map((s) => (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={s} 
                    className="tag tag-removable" 
                    onClick={() => toggleSkill(s)}
                  >
                    {s} ✕
                  </motion.span>
                ))}
              </AnimatePresence>
              <div className={styles.skillDropdown}>
                <input
                  className={styles.skillInput}
                  placeholder="+ Add skill..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && filteredSkillOptions.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredSkillOptions.slice(0, 8).map((s) => (
                      <button
                        key={s.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          toggleSkill(s.name);
                          setSearchInput('');
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

          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <span>{loading ? 'Searching...' : `${users.length} result${users.length !== 1 ? 's' : ''}`}</span>
            </div>

            {!latitude && (
              <div className={styles.noLocation}>
                <MapPin size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Enable location to search by proximity.</p>
              </div>
            )}

            {loading && (
              <div className={styles.loading}>
                <div className="spinner" />
              </div>
            )}

            {!loading && users.length === 0 && latitude && (
              <div className={styles.empty}>
                <UserIcon size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <h3>No builders found</h3>
                <p>Try expanding your radius or adjusting filters.</p>
              </div>
            )}

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
                    <img src={user.avatar_url || '/default-avatar.svg'} alt={user.name} className={styles.avatar} />
                    <div className={styles.cardInfo}>
                      <h3>{user.name}</h3>
                      <div className={styles.metaRow}>
                        <Building2 size={12} />
                        <span>Year {user.year} · {user.college}</span>
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={styles.distance}>{user.distance_km} km</span>
                      <span className={`badge ${badgeClass(user.availability_status)}`}>
                        {AVAILABILITY_LABELS[user.availability_status]}
                      </span>
                    </div>
                  </div>
                  {user.bio && (
                    <p className={styles.cardBio}>&ldquo;{user.bio}&rdquo;</p>
                  )}
                  {user.skills && user.skills.length > 0 && (
                    <div className={styles.cardSkills}>
                      {user.skills.slice(0, 6).map((s) => (
                        <span key={s} className="tag">{s}</span>
                      ))}
                    </div>
                  )}
                  {user.github_url && (
                    <div className={styles.cardGithub}>
                      <Link size={14} />
                      <span>{user.github_url.replace('https://github.com/', '')}</span>
                    </div>
                  )}
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
