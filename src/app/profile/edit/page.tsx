'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkills } from '@/hooks/useSkills';
import { AVAILABILITY_LABELS } from '@/lib/types';
import type { AvailabilityStatus } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
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

  // Auto-update location when available
  useEffect(() => {
    if (latitude && longitude && profile) {
      updateLocation(latitude, longitude);
    }
  }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const filteredSkills = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(s.name)
  );

  if (loading) {
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
      <main className={styles.main}>
        <div className={styles.container}>
          {isWelcome && (
            <div className={styles.welcomeBanner}>
              <h2>🎉 Welcome to Keiretsu!</h2>
              <p>Complete your profile to appear on the skill map.</p>
            </div>
          )}

          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={() => router.back()} 
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Go Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 style={{ margin: 0 }}>Edit Profile</h1>
            </div>
            <button
              onClick={() => profile && router.push(`/profile/${profile.id}`)}
              className="btn btn-secondary btn-sm"
            >
              View Public Profile
            </button>
          </div>

          <div className={styles.grid}>
            {/* Left Column - Profile Info */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Basic Info</h2>

              <div className="input-group">
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="input-group">
                <label className="label">College / Institution *</label>
                <input
                  className="input"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. JNTU Hyderabad"
                />
              </div>

              <div className="input-group">
                <label className="label">Year *</label>
                <select
                  className="input"
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

              <div className="input-group">
                <label className="label">GitHub URL *</label>
                <input
                  className="input"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="input-group">
                <label className="label">Bio</label>
                <textarea
                  className="input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What are you building? What do you want to learn?"
                  rows={3}
                />
              </div>

              <div className="input-group">
                <label className="label">Availability</label>
                <select
                  className="input"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                >
                  {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Skills & Location */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Skills</h2>

              {selectedSkills.length > 0 && (
                <div className={styles.selectedSkills}>
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="tag tag-removable"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill} ✕
                    </span>
                  ))}
                </div>
              )}

              <div className="input-group">
                <input
                  className="input"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills to add..."
                />
              </div>

              <div className={styles.skillGrid}>
                {filteredSkills.slice(0, 20).map((skill) => (
                  <button
                    key={skill.id}
                    className={styles.skillChip}
                    onClick={() => toggleSkill(skill.name)}
                  >
                    + {skill.name}
                  </button>
                ))}
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>
                📍 Location
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
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>
                      Enable location to appear on the map
                    </p>
                    <button onClick={requestLocation} className="btn btn-primary btn-sm">
                      📍 Share My Location
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.saveBar}>
            <button 
              onClick={() => router.back()} 
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name || !college || !githubUrl}
              className="btn btn-primary btn-lg"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
            </button>
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
