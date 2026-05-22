'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState, Suspense, useMemo } from 'react';

import { LogOut, Loader2, User, Inbox } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  const pendingCount = requests.length;

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
                  {(() => {
                    const avatarUrl = (() => {
                      if (profile.avatar_url) return profile.avatar_url;
                      if (profile.github_url) {
                        const match = profile.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
                        if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
                      }
                      return null;
                    })();

                    if (avatarUrl) {
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img src={avatarUrl} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />;
                    }
                    return <User size={18} />;
                  })()}
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
