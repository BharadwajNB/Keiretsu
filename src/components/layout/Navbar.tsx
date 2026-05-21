'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState, Suspense, useMemo } from 'react';

import { Search, LogOut, Loader2, User, Inbox } from 'lucide-react';
import { getProfileCompletion } from '@/lib/profileCompletion';
import type { Profile } from '@/lib/types';
import { useConnectionRequests } from '@/hooks/useConnectionRequests';
import styles from './Navbar.module.css';

interface NavbarProps {
  onSignInClick?: () => void;
}

function NavbarContent({ onSignInClick }: NavbarProps) {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const { requests } = useConnectionRequests();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = requests.length;

  useEffect(() => {
    const q = searchParams.get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = (pathname === '/login' && !onSignInClick) || pathname === '/auth/callback';
  const isOnboardingPage = pathname === '/onboarding';

  if (isAuthPage) return null;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        router.push(`/map?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/map`);
      }
    }
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.hidden : ''}`}>
      <div className={styles.glassBackground} />
      
      <div className={styles.container}>
        {/* Left: Brand */}
        <Link href="/" className={styles.brand}>
          <Image 
            src="/custom-globe-transparent.png" 
            alt="Keiretsu Globe" 
            width={28} 
            height={28} 
            className={styles.brandIcon} 
          />
          <span className={styles.brandPrimary}>Keiretsu</span>
        </Link>

        {/* Center: Global Search (Only if logged in or on landing, hidden during onboarding) */}
        {!isOnboardingPage && (
          <div className={styles.centerSection}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search builders or skills..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div className={styles.searchShortcut}>↵</div>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className={styles.actions}>
          {loading ? (
            <Loader2 className="spinner" size={20} />
          ) : user ? (
            <div className={styles.userControls}>
              {!isOnboardingPage && (
                <Link href="/requests" className={styles.iconBtn} title="Collaboration Requests" style={{ position: 'relative' }}>
                  <Inbox size={18} />
                  {pendingCount > 0 && (
                    <span className={styles.badge}>{pendingCount}</span>
                  )}
                </Link>
              )}
              {profile ? (
                <Link href={`/profile/${profile.id}`} className={styles.avatarBtn} title="Profile">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  ) : (
                    <User size={18} />
                  )}
                </Link>
              ) : (
                <Link href="/onboarding" className={styles.avatarBtn} title="Setup Profile">
                  <User size={18} />
                </Link>
              )}
              {!isOnboardingPage && <CompletionBadge profile={profile} />}
              <button onClick={signOut} className={styles.iconBtn} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : onSignInClick ? (
            <button onClick={onSignInClick} className={styles.loginBtn}>
              Sign In
            </button>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function CompletionBadge({ profile }: { profile: Profile | null }) {
  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  if (!profile || completion.percentage >= 100) return null;

  const radius = 10;
  const stroke = 2.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion.percentage / 100) * circumference;

  return (
    <Link
      href="/onboarding"
      className={styles.completionBadge}
      title={`Profile ${completion.percentage}% complete. Click to finish setup!`}
    >
      <div className={styles.progressRingWrapper}>
        <svg height={radius * 2} width={radius * 2} className={styles.progressRing}>
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="var(--accent-primary)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className={styles.completionText}>{completion.percentage}%</span>
      </div>
    </Link>
  );
}

export default function Navbar(props: NavbarProps) {
  return (
    <Suspense fallback={<nav className={`${styles.navbar}`}><div className={styles.glassBackground} /></nav>}>
      <NavbarContent {...props} />
    </Suspense>
  );
}
