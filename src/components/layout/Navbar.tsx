'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';

import { Search, LogOut, Loader2, User } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initial search query from URL if present
  useEffect(() => {
    const q = searchParams.get('q');
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

  const isAuthPage = pathname === '/login' || pathname === '/auth/callback';

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

        {/* Center: Global Search (Only if logged in or on landing) */}
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

        {/* Right: Actions */}
        <div className={styles.actions}>
          {loading ? (
            <Loader2 className="spinner" size={20} />
          ) : user ? (
            <div className={styles.userControls}>
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
                <Link href="/profile/edit" className={styles.avatarBtn} title="Setup Profile">
                  <User size={18} />
                </Link>
              )}
              <button onClick={signOut} className={styles.iconBtn} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
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
