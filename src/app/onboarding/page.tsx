'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Check, Sparkles, SkipForward } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkills } from '@/hooks/useSkills';
import { useGitHubProfile, getSkillSuggestionsFromGitHub } from '@/hooks/useGitHubProfile';
import styles from './page.module.css';

const STEPS = ['Identity', 'College', 'Skills', 'Location'];

const STEP_META = [
  { emoji: '👋', heading: "Let\u2019s get you discovered", sub: 'Start with the basics so builders can find you.' },
  { emoji: '🏫', heading: 'Where do you build?', sub: 'Your college helps match you with nearby collaborators.' },
  { emoji: '⚡', heading: 'What do you build?', sub: 'Select your tech stack — this powers skill-based search.' },
  { emoji: '📍', heading: 'Show up on the map', sub: 'Share your location so others nearby can discover you.' },
];

// ---- Slide animation variants -----------------------------------------------
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
};

// ---- Main Content (wrapped in Suspense boundary) ----------------------------
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get('step') || '0');

  const { profile, loading, updateProfile, updateLocation, updateSkills } = useProfile();
  const { latitude, longitude, requestLocation, permissionState } = useGeolocation();
  const { skills: allSkills } = useSkills();

  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), 3));
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState(1);
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  // GitHub skill detection
  const gh = useGitHubProfile(githubUrl);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(profile.name || '');
      setGithubUrl(profile.github_url || '');
      setCollege(profile.college || '');
      setYear(profile.year || 1);
      setBio(profile.bio || '');
      setSelectedSkills(profile.skills || []);
    }
  }, [profile]);

  // Auto-detect skills from GitHub
  useEffect(() => {
    if (gh.topLanguages.length > 0) {
      const detected = getSkillSuggestionsFromGitHub(gh.topLanguages);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestedSkills(detected);
    }
  }, [gh.topLanguages]);

  // Auto-sync location when granted
  useEffect(() => {
    if (latitude && longitude && profile) {
      updateLocation(latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const toggleSkill = useCallback((skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  }, []);

  const filteredSkills = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(s.name)
  );

  // ---- Save current step data -----------------------------------------------
  const saveStep = async () => {
    setSaving(true);
    if (step === 0) {
      await updateProfile({ name, github_url: githubUrl, bio });
    } else if (step === 1) {
      await updateProfile({ college, year });
    } else if (step === 2) {
      await updateSkills(selectedSkills);
    }
    // Step 3 (location) is auto-saved via useEffect
    setSaving(false);
  };

  const goNext = async () => {
    await saveStep();
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    } else {
      // Final step — navigate to map
      router.push('/map');
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const skip = () => {
    router.push('/map');
  };

  const canContinue = () => {
    if (step === 0) return !!name.trim();
    if (step === 1) return !!college.trim();
    return true; // Skills and location are optional
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-center"><div className="spinner" /></div>
      </div>
    );
  }

  const meta = STEP_META[step];
  const isLastStep = step === 3;
  const locationGranted = permissionState === 'granted' && !!latitude;

  return (
    <div className="page">
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Skip link */}
          <button onClick={skip} className={styles.skipBtn}>
            Skip for now <SkipForward size={14} />
          </button>

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className={styles.stepIndicator}>
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''} ${i === step ? styles.stepDotCurrent : ''}`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
            ))}
          </div>

          {/* Step Card */}
          <div className={styles.cardWrapper}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                className={styles.stepCard}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.stepHeader}>
                  <span className={styles.stepEmoji}>{meta.emoji}</span>
                  <h1 className={styles.stepHeading}>{meta.heading}</h1>
                  <p className={styles.stepSub}>{meta.sub}</p>
                </div>

                {/* ---- Step 0: Identity ---- */}
                {step === 0 && (
                  <div className={styles.stepBody}>
                    <div className="input-group">
                      <label className="label">Full Name *</label>
                      <input
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What should we call you?"
                        autoFocus
                      />
                    </div>
                    <div className="input-group">
                      <label className="label">GitHub URL</label>
                      <input
                        className="input"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                      />
                      {gh.loading && githubUrl && (
                        <span className={styles.detecting}>Detecting skills from GitHub...</span>
                      )}
                      {suggestedSkills.length > 0 && (
                        <span className={styles.detected}>
                          <Sparkles size={13} />
                          Detected: {suggestedSkills.slice(0, 4).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="input-group">
                      <label className="label">Short Bio</label>
                      <textarea
                        className="input"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="What are you building? What excites you?"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* ---- Step 1: College ---- */}
                {step === 1 && (
                  <div className={styles.stepBody}>
                    <div className="input-group">
                      <label className="label">College / Institution *</label>
                      <input
                        className="input"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. JNTU Hyderabad"
                        autoFocus
                      />
                    </div>
                    <div className="input-group">
                      <label className="label">Year</label>
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
                  </div>
                )}

                {/* ---- Step 2: Skills ---- */}
                {step === 2 && (
                  <div className={styles.stepBody}>
                    {/* Auto-suggested from GitHub */}
                    {suggestedSkills.length > 0 && (
                      <div className={styles.suggestedSection}>
                        <p className={styles.suggestedLabel}>
                          <Sparkles size={13} /> Detected from your GitHub
                        </p>
                        <div className={styles.chipGrid}>
                          {suggestedSkills.map((skill) => (
                            <button
                              key={skill}
                              className={`${styles.chip} ${selectedSkills.includes(skill) ? styles.chipActive : ''}`}
                              onClick={() => toggleSkill(skill)}
                            >
                              {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected */}
                    {selectedSkills.length > 0 && (
                      <div className={styles.selectedRow}>
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

                    {/* Search + Add */}
                    <div className="input-group">
                      <input
                        className="input"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills to add..."
                        autoFocus
                      />
                    </div>
                    <div className={styles.chipGrid}>
                      {filteredSkills.slice(0, 15).map((skill) => (
                        <button
                          key={skill.id}
                          className={styles.chip}
                          onClick={() => toggleSkill(skill.name)}
                        >
                          + {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Step 3: Location ---- */}
                {step === 3 && (
                  <div className={styles.stepBody}>
                    <div className={styles.locationCard}>
                      {locationGranted ? (
                        <div className={styles.locationGranted}>
                          <div className={styles.locationCheck}>
                            <Check size={24} />
                          </div>
                          <p className={styles.locationTitle}>Location active</p>
                          <p className={styles.locationSub}>
                            You&apos;re now visible on the skill map. Nearby builders can discover you.
                          </p>
                        </div>
                      ) : permissionState === 'denied' ? (
                        <div className={styles.locationDenied}>
                          <MapPin size={24} />
                          <p className={styles.locationTitle}>Location blocked</p>
                          <p className={styles.locationSub}>
                            Enable location in your browser settings to appear on the map.
                          </p>
                        </div>
                      ) : (
                        <div className={styles.locationPrompt}>
                          <MapPin size={32} className={styles.locationIcon} />
                          <p className={styles.locationTitle}>Share your location</p>
                          <p className={styles.locationSub}>
                            This lets other builders discover you on the proximity map.
                          </p>
                          <button onClick={requestLocation} className="btn btn-primary">
                            <MapPin size={16} /> Enable Location
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className={styles.navRow}>
            {step > 0 ? (
              <button onClick={goBack} className={styles.backBtn}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={goNext}
              disabled={!canContinue() || saving}
              className={styles.continueBtn}
            >
              {saving ? 'Saving...' : isLastStep ? "Let\u2019s Go!" : 'Continue'}
              {!isLastStep && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Page Export (with Suspense for useSearchParams) -------------------------
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="page-center"><div className="spinner" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
