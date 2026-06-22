'use client';

import { useState, useMemo, Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Users, MapPin, Search, X, GraduationCap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import LocationIndicator from '@/components/ui/LocationIndicator';
import { useLocationSync } from '@/hooks/useLocationSync';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useSkills } from '@/hooks/useSkills';
import { useCollegeUsers } from '@/hooks/useCollegeUsers';
import { searchUniversities } from '@/lib/universityData';
import { SKILL_CATEGORIES } from '@/lib/types';
import type { CommunityCircle } from '@/components/map/MapView';
import styles from './page.module.css';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MapPageContent() {
  const { latitude, longitude, loading: geoLoading, error: geoError, requestLocation, permissionState, isWatching, isSyncing, lastSyncedAt } = useLocationSync();
  const [sandboxCoords, setSandboxCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { skills: allSkills } = useSkills();
  const [radiusKm, setRadiusKm] = useState(500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const router = useRouter();

  const [communityCircle, setCommunityCircle] = useState<CommunityCircle | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { collegeData, collegeLoading, fetchCollegeUsers, clearCollege } = useCollegeUsers();

  // Autocomplete suggestions
  const collegeSuggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchUniversities(searchQuery);
  }, [searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When college data is fetched, build the community circle
  useEffect(() => {
    if (collegeData) {
      setCommunityCircle({
        center: [collegeData.coord.lat, collegeData.coord.lng],
        radiusKm: 5,
        name: collegeData.coord.name,
        shortName: collegeData.coord.shortName,
        builderCount: collegeData.users.length,
      });
    } else {
      setCommunityCircle(null);
    }
  }, [collegeData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchParamsUrl = useSearchParams();
  const globalQuery = searchParamsUrl.get('q');

  const activeLat = latitude || sandboxCoords?.lat;
  const activeLng = longitude || sandboxCoords?.lng;

  const params = useMemo(() => {
    if (!activeLat || !activeLng) return null;
    
    // Parse global search query
    let nameSearchFilter: string | undefined = undefined;
    const computedSkills = [...selectedSkills];

    if (globalQuery) {
      const qLower = globalQuery.toLowerCase();
      // Check if query matches any known skill exactly or partially
      const matchedSkill = allSkills.find(s => s.name.toLowerCase() === qLower || s.name.toLowerCase().includes(qLower));
      
      if (matchedSkill) {
        if (!computedSkills.includes(matchedSkill.name)) {
          computedSkills.push(matchedSkill.name);
        }
      } else {
        // If not a skill, assume it's a name search
        nameSearchFilter = globalQuery;
      }
    }

    return {
      lat: activeLat,
      lng: activeLng,
      radiusKm: globalQuery ? 20000 : radiusKm, // Expand to global (20000km) if using the global search bar
      skillFilter: computedSkills.length > 0 ? computedSkills : undefined,
      collegeFilter: undefined,
      nameSearch: debouncedSearchQuery || nameSearchFilter || undefined,
    };
  }, [activeLat, activeLng, radiusKm, selectedSkills, debouncedSearchQuery, globalQuery, allSkills]);

  const { users, loading: usersLoading } = useNearbyUsers(params);

  // Determine which users to show in sidebar and on map
  const displayUsers = collegeData ? collegeData.users : users;

  const isSearching = useMemo(() => {
    return !!(searchQuery.trim() || collegeData || selectedSkills.length > 0 || globalQuery);
  }, [searchQuery, collegeData, selectedSkills, globalQuery]);

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

  // Autocomplete suggestions for users (match by name)
  const userSuggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [searchQuery, users]);

  const handleCollegeSelect = (coord: typeof collegeSuggestions[0]) => {
    setSearchQuery(coord.name);
    setShowSuggestions(false);
    setSelectedUserId(null);
    fetchCollegeUsers(coord.name, coord);
  };

  const handleUserSelect = (u: typeof users[0]) => {
    setSearchQuery(u.name);
    setShowSuggestions(false);
    if (u.latitude && u.longitude) {
      setSelectedUserId(u.id);
    } else {
      router.push(`/profile/${u.id}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedUserId(null);
    setCommunityCircle(null);
    clearCollege();
  };

  // Location permission not yet granted
  if (!geoLoading && !activeLat && permissionState !== 'granted') {
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
            <button onClick={requestLocation} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 12 }}>
              Share My Location
            </button>
            <button 
              onClick={() => setSandboxCoords({ lat: 16.4641, lng: 80.5065 })} 
              className="btn btn-secondary"
              style={{ width: '100%', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}
            >
              Use Sandbox Location (Vijayawada)
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
          {activeLat && activeLng && (
            <MapView
              center={[activeLat, activeLng]}
              radiusKm={radiusKm}
              users={displayUsers}
              selectedUserId={selectedUserId}
              communityCircle={communityCircle}
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
                <span>{displayUsers.length} builder{displayUsers.length !== 1 ? 's' : ''}{collegeData ? ` at ${collegeData.coord.shortName}` : ' nearby'}</span>
              </div>
            </div>

            <LocationIndicator
              isWatching={isWatching}
              isSyncing={isSyncing}
              permissionState={permissionState}
              lastSyncedAt={lastSyncedAt}
            />

            {/* Unified Search */}
            <div className={styles.filterSection} ref={suggestionsRef}>
              <div className={styles.searchWrapper}>
                <Search size={16} className="text-muted" />
                <input
                  className={styles.searchInput}
                  placeholder="Search college, builder name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={handleClearSearch}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Unified Autocomplete dropdown */}
              <AnimatePresence>
                {showSuggestions && (collegeSuggestions.length > 0 || userSuggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={styles.suggestionsDropdown}
                  >
                    {collegeSuggestions.length > 0 && (
                      <div className={styles.suggestionGroup}>
                        <div className={styles.suggestionHeader}>Colleges</div>
                        {collegeSuggestions.map((s) => (
                          <button
                            key={s.id}
                            className={styles.suggestionItem}
                            onClick={() => handleCollegeSelect(s)}
                          >
                            <GraduationCap size={14} />
                            <div>
                              <span className={styles.suggestionName}>{s.name}</span>
                              <span className={styles.suggestionSub}>{s.city}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {userSuggestions.length > 0 && (
                      <div className={styles.suggestionGroup}>
                        <div className={styles.suggestionHeader}>Builders</div>
                        {userSuggestions.map((u) => {
                          const initials = getInitials(u.name);
                          const avatarUrl = (() => {
                            if (u.avatar_url) return u.avatar_url;
                            if (u.github_url) {
                              const match = u.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                              if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
                            }
                            return null;
                          })();

                          return (
                            <button
                              key={u.id}
                              className={styles.suggestionItem}
                              onClick={() => handleUserSelect(u)}
                            >
                              <div className={styles.suggestionAvatarWrapper}>
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={initials}
                                    className={styles.suggestionAvatar}
                                  />
                                ) : (
                                  <div className={styles.suggestionAvatarFallback}>
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className={styles.suggestionName}>{u.name}</span>
                                <span className={styles.suggestionSub}>
                                  {u.college} · Year {u.year}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active college info card */}
            <AnimatePresence>
              {collegeData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.collegeInfoCard}
                >
                  <div className={styles.collegeInfoHeader}>
                    <div>
                      <h3 className={styles.collegeInfoName}>{collegeData.coord.name}</h3>
                      <p className={styles.collegeInfoCity}>{collegeData.coord.city}</p>
                    </div>
                    <button className={styles.collegeInfoClose} onClick={handleClearSearch}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.collegeInfoStats}>
                    <div className={styles.collegeInfoStat}>
                      <Users size={14} />
                      <span>{collegeData.users.length} builder{collegeData.users.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {collegeData.topSkills.length > 0 && (
                    <div className={styles.collegeInfoSkills}>
                      {collegeData.topSkills.map((skill) => (
                        <span key={skill} className={styles.collegeInfoSkillTag}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {collegeLoading && (
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <div className="spinner" style={{ margin: '0 auto', width: 16, height: 16 }} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Regular search & filters — hidden when college is active */}
            {!collegeData && (
              <>
                <div className={styles.filterSection}>
                  <label className={styles.filterLabel}>
                    Search Radius: <strong>{radiusKm} km</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className={styles.slider}
                  />
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
                        {Object.entries(groupedSkills).map(([category, skills]) => (
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
              </>
            )}

            <div className={styles.userList}>
              {!isSearching ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--text-secondary)' }} />
                  <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    Search for a college, builder name, or filter by skills to see results here.
                  </p>
                </div>
              ) : (usersLoading || collegeLoading) ? (
                <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
              ) : displayUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>{collegeData ? 'No builders registered from this college yet.' : 'No builders found in this area.'}</p>
                </div>
              ) : (
                displayUsers.map((user, i) => {
                  const hasLocation = user.latitude && user.longitude;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={user.id}
                      onClick={() => {
                        if (hasLocation) {
                          setSelectedUserId(user.id);
                        } else {
                          router.push(`/profile/${user.id}`);
                        }
                      }}
                      className={styles.userCard}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.userCardHeader}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={(() => {
                            if (user.avatar_url) return user.avatar_url;
                            if (user.github_url) {
                              const match = user.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                              if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
                            }
                            return '/default-avatar.svg';
                          })()}
                          alt={user.name}
                          className={styles.userAvatar}
                        />
                        <div>
                          <h4>{user.name}</h4>
                          <p className={styles.userMeta}>Year {user.year} · {user.college}</p>
                        </div>
                        <span className={styles.userDistance}>
                          {user.distance_km != null ? `${user.distance_km}km` : collegeData ? collegeData.coord.shortName : 'Global'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="page"><Navbar /><div className="page-center"><div className="spinner" /></div></div>}>
      <MapPageContent />
    </Suspense>
  );
}
