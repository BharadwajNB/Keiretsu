'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Check, Sparkles, User, GraduationCap, Code2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkills } from '@/hooks/useSkills';
import { useGitHubProfile, getSkillSuggestionsFromGitHub } from '@/hooks/useGitHubProfile';
import styles from './page.module.css';

const STEPS = ['Identity', 'College', 'Skills', 'Location'];

const STEP_META = [
  { icon: User, heading: "Let\u2019s get you discovered", sub: 'Start with the basics so builders can find you.' },
  { icon: GraduationCap, heading: 'Where do you build?', sub: 'Your college helps match you with nearby collaborators.' },
  { icon: Code2, heading: 'What do you build?', sub: 'Select your tech stack \u2014 this powers skill-based search.' },
  { icon: MapPin, heading: 'Show up on the map', sub: 'Share your location so others nearby can discover you.' },
];

const FOOT_HINTS = [
  'Your profile becomes a node the moment you publish it.',
  'This connects you to builders at your institution.',
  'Skills power the map\u2019s search engine.',
  'Location makes you discoverable to nearby builders.',
];

// ---- Slide animation variants -----------------------------------------------
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, scale: 0.98 }),
};

// ---- Ambient Network SVG (deterministic, no randomness) ---------------------
function AmbientNetwork() {
  const svgContent = useMemo(() => {
    let seed = 7;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    const W = 1920;
    const H = 1080;
    const pts: { x: number; y: number }[] = [];
    const count = Math.min(22, Math.floor(W / 70));

    for (let i = 0; i < count; i++) {
      pts.push({ x: rand() * W, y: rand() * H });
    }

    let edges = '';
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 180 && rand() > 0.6) {
          edges += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke="#2A3340" stroke-width="1"/>`;
        }
      }
    }

    let nodes = '';
    pts.forEach(p => {
      nodes += `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#3A4250"/>`;
    });

    return edges + nodes;
  }, []);

  return (
    <svg
      className={styles.ambient}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// ---- Ring Progress SVG ------------------------------------------------------
function RingProgress({ filled, total, Icon }: { filled: number; total: number; Icon: React.ElementType }) {
  const CIRC = 2 * Math.PI * 14; // ~87.96
  const pct = total > 0 ? filled / total : 0;
  const offset = CIRC * (1 - pct);

  return (
    <div className={styles.ringWrap}>
      <svg className={styles.ringSvg} viewBox="0 0 32 32">
        <circle className={styles.ringBg} cx="16" cy="16" r="14" />
        <circle
          className={styles.ringFg}
          cx="16"
          cy="16"
          r="14"
          style={{ strokeDasharray: CIRC, strokeDashoffset: offset }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <Icon className={styles.ringCenterIcon} size={22} />
      </div>
    </div>
  );
}

// ---- Node Chain Progress ----------------------------------------------------
function NodeChain({ currentStep }: { currentStep: number }) {
  return (
    <div className={styles.nodes}>
      {STEPS.map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={styles.nodeWrap}>
            <div
              className={`${styles.node} ${i === currentStep ? styles.nodeActive : ''} ${i < currentStep ? styles.nodeDone : ''}`}
            />
          </div>
          {i < STEPS.length - 1 && (
            <div className={styles.link}>
              <div
                className={styles.linkFill}
                style={{
                  width: i < currentStep ? '100%' : i === currentStep ? '35%' : '0%',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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

  // Redirect to map if already onboarded (fully populated name, college, and location)
  useEffect(() => {
    if (step === 0 && profile && profile.name?.trim() && profile.college?.trim() && profile.latitude) {
      router.push('/map');
    }
  }, [profile, step, router]);

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

  // Sync GitHub bio on onboarding page if currently empty
  const hasSyncedGitHub = useRef(false);
  useEffect(() => {
    hasSyncedGitHub.current = false;
  }, [githubUrl]);

  useEffect(() => {
    if (githubUrl && !gh.loading && !gh.error && !hasSyncedGitHub.current) {
      if (gh.bio && !bio) {
        setBio(gh.bio);
      }
      hasSyncedGitHub.current = true;
    }
  }, [gh.bio, gh.loading, gh.error, githubUrl, bio]);

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
    if (step === 3) return permissionState === 'granted' && !!latitude;
    return true; // Skills are optional
  };

  // Ring fill calculation for step 0
  const ringFilled = (() => {
    if (step === 0) {
      return [name, githubUrl, bio].filter(v => v && v.trim().length > 0).length;
    }
    if (step === 1) {
      return [college].filter(v => v && v.trim().length > 0).length;
    }
    if (step === 2) {
      return selectedSkills.length > 0 ? 1 : 0;
    }
    // step 3
    return (permissionState === 'granted' && !!latitude) ? 1 : 0;
  })();

  const ringTotal = step === 0 ? 3 : 1;

  if (loading) {
    return (
      <div style={{ background: 'var(--ob-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const meta = STEP_META[step];
  const StepIcon = meta.icon;
  const isLastStep = step === 3;
  const locationGranted = permissionState === 'granted' && !!latitude;

  return (
    <div style={{ background: 'var(--ob-bg)', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Navbar />
      <AmbientNetwork />

      <main className={styles.main}>
        {/* ---- Progress: Eyebrow + Skip ---- */}
        <div className={styles.progressRow}>
          <div className={styles.eyebrow}>
            Step {step + 1} / {STEPS.length} · <span className={styles.eyebrowAccent}>{STEPS[step]}</span>
          </div>
          <button onClick={skip} className={styles.skip}>
            Skip for now
            <svg className={styles.skipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 4l8 8-8 8M14 4l8 8-8 8" />
            </svg>
          </button>
        </div>
        <NodeChain currentStep={step} />

        {/* ---- Card ---- */}
        <div className={styles.stage}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              className={styles.card}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step Icon Ring + Heading */}
              <div className={styles.idNode}>
                <RingProgress filled={ringFilled} total={ringTotal} Icon={StepIcon} />
                <h1 className={styles.heading}>{meta.heading}</h1>
                <p className={styles.sub}>{meta.sub}</p>
              </div>

              {/* ---- Step 0: Identity ---- */}
              {step === 0 && (
                <div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Full name <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={styles.fieldInput}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="What should we call you?"
                      autoFocus
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>GitHub URL</label>
                    <input
                      className={`${styles.fieldInput} ${styles.fieldMono}`}
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourhandle"
                    />
                    {gh.loading && githubUrl && (
                      <div className={`${styles.detect} ${styles.detectShow}`}>
                        <span className={styles.detectLoading}>Detecting skills from GitHub...</span>
                      </div>
                    )}
                    {suggestedSkills.length > 0 && (
                      <div className={`${styles.detect} ${styles.detectShow}`}>
                        <span className={styles.detectLabel}>
                          <svg className={styles.detectLabelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Detected
                        </span>
                        {suggestedSkills.slice(0, 4).map((skill) => (
                          <span key={skill} className={styles.chip}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Short bio</label>
                    <textarea
                      className={styles.fieldTextarea}
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
                <div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      College / Institution <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={styles.fieldInput}
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. JNTU Hyderabad"
                      autoFocus
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Year</label>
                    <select
                      className={styles.fieldSelect}
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
                <div>
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
                            className={`${styles.skillChip} ${selectedSkills.includes(skill) ? styles.skillChipActive : ''}`}
                            onClick={() => toggleSkill(skill)}
                          >
                            {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Tags */}
                  {selectedSkills.length > 0 && (
                    <div className={styles.selectedRow}>
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className={styles.selectedTag}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill} ✕
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search + Add */}
                  <div className={styles.field}>
                    <input
                      className={styles.fieldInput}
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
                        className={styles.skillChip}
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
                <div>
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
                        <button onClick={requestLocation} className={styles.locationBtn}>
                          <MapPin size={16} /> Enable Location
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Actions ---- */}
              <div className={styles.actions}>
                {step > 0 ? (
                  <button onClick={goBack} className={styles.backBtn}>
                    <ArrowLeft className={styles.backBtnIcon} size={15} /> Back
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
                  {!isLastStep && <ArrowRight className={styles.continueBtnIcon} size={15} />}
                </button>
              </div>

              <p className={styles.footHint}>{FOOT_HINTS[step]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ---- Page Export (with Suspense for useSearchParams) -------------------------
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--ob-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
