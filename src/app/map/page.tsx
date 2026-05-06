'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Users, MapPin, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useSkills } from '@/hooks/useSkills';
import { SKILL_CATEGORIES } from '@/lib/types';
import styles from './page.module.css';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

export default function MapPage() {
  const { latitude, longitude, loading: geoLoading, error: geoError, requestLocation, permissionState } = useGeolocation();
  const { skills: allSkills } = useSkills();
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [collegeFilter, setCollegeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    if (!latitude || !longitude) return null;
    return {
      lat: latitude,
      lng: longitude,
      radiusKm,
      skillFilter: selectedSkills.length > 0 ? selectedSkills : undefined,
      collegeFilter: collegeFilter || undefined,
    };
  }, [latitude, longitude, radiusKm, selectedSkills, collegeFilter]);

  const { users, loading: usersLoading } = useNearbyUsers(params);

  const toggleSkill = (name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const groupedSkills = useMemo(() => {
    const groups: Record<string, typeof allSkills> = {};
    allSkills.forEach((skill) => {
      const cat = skill.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill);
    });
    return groups;
  }, [allSkills]);

  // Location permission not yet granted
  if (!geoLoading && !latitude && permissionState !== 'granted') {
    return (
      <div className="page">
        <Navbar />
        <div className="page-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel" 
            style={{ textAlign: 'center', padding: 40, borderRadius: 24, maxWidth: 400 }}
          >
            <MapPin size={48} className="text-muted" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Enable Location</h2>
            <p className="text-secondary" style={{ marginBottom: 24 }}>
              Keiretsu needs your location to show builders around you.
            </p>
            {geoError && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 16 }}>{geoError}</p>}
            <button onClick={requestLocation} className="btn btn-primary btn-lg">
              Share My Location
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (geoLoading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className={styles.mapLayout}>
        {/* Map Background */}
        <div className={styles.mapContainer}>
          {latitude && longitude && (
            <MapView
              center={[latitude, longitude]}
              radiusKm={radiusKm}
              users={users}
            />
          )}
        </div>

        {/* Floating Glass Sidebar */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={styles.sidebar}
        >
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarHeader}>
              <h2>Discover</h2>
              <div className={styles.userCount}>
                <Users size={14} />
                <span>{users.length} builder{users.length !== 1 ? 's' : ''} nearby</span>
              </div>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>
                Search Radius: <strong>{radiusKm} km</strong>
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

            <div className={styles.filterSection}>
              <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                <Search size={16} className="text-muted" />
                <input
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: 14 }}
                  placeholder="Filter by college..."
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                />
              </div>
            </div>

            <button
              className={styles.filterToggle}
              onClick={() => setShowFilters(!showFilters)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={16} />
                <span>Filter by Skills</span>
              </div>
              {selectedSkills.length > 0 && (
                <span className="badge badge-amber">{selectedSkills.length}</span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={styles.skillFilters}>
                    {/* Simplified for brevity, similar to old one but nicer tags */}
                    {Object.entries(groupedSkills).slice(0, 3).map(([category, skills]) => (
                      <div key={category} style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                          {SKILL_CATEGORIES[category] || category}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {skills.map((skill) => (
                            <button
                              key={skill.id}
                              onClick={() => toggleSkill(skill.name)}
                              className={`tag ${selectedSkills.includes(skill.name) ? 'badge-amber' : ''}`}
                              style={{ cursor: 'pointer', border: 'none' }}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.userList}>
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No builders found in this area.</p>
                </div>
              ) : (
                users.map((user, i) => (
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className={styles.userCard}
                  >
                    <div className={styles.userCardHeader}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.avatar_url || '/default-avatar.svg'} alt={user.name} className={styles.userAvatar} />
                      <div>
                        <h4>{user.name}</h4>
                        <p className={styles.userMeta}>Year {user.year} · {user.college}</p>
                      </div>
                      <span className={styles.userDistance}>{user.distance_km}km</span>
                    </div>
                  </motion.a>
                ))
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
