'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

import { Search, LogOut, Loader2, User } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.hidden : ''}`}>
      <div className={styles.glassBackground} />
      
      <div className={styles.container}>
        {/* Left: Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandPrimary}>Keiretsu</span>
          <span className={styles.brandSecondary}>Multiverse</span>
        </Link>

        {/* Center: Global Search (Only if logged in or on landing) */}
        <div className={styles.centerSection}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search universities..." 
              className={styles.searchInput}
              // Add onChange or onKeyDown later to hook up to actual search route
            />
            <div className={styles.searchShortcut}>⌘K</div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className={styles.actions}>
          {loading ? (
            <Loader2 className="spinner" size={20} />
          ) : user ? (
            <div className={styles.userControls}>
              <Link href={`/profile/${user.id}`} className={styles.avatarBtn} title="Profile">
                <User size={18} />
              </Link>
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
