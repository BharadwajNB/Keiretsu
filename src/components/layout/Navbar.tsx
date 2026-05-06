'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Search, User, LogOut, Loader2, Sparkles } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { session, loading, signOut } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/auth/callback';

  if (isAuthPage) return null;

  return (
    <nav className={`glass-nav ${styles.navbar}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles size={16} className={styles.sparkle} />
          </div>
          <span className={styles.logoText}>Keiretsu</span>
        </Link>

        <div className={styles.links}>
          {session && (
            <>
              <Link href="/map" className={`${styles.link} ${pathname === '/map' ? styles.active : ''}`}>
                <Map size={18} />
                <span>Map</span>
              </Link>
              <Link href="/search" className={`${styles.link} ${pathname === '/search' ? styles.active : ''}`}>
                <Search size={18} />
                <span>Search</span>
              </Link>
            </>
          )}
        </div>

        <div className={styles.actions}>
          {loading ? (
            <Loader2 className="spinner" size={20} />
          ) : session ? (
            <div className={styles.userMenu}>
              <Link href={`/profile/${session.user.id}`} className={styles.profileBtn}>
                <User size={18} />
                <span className={styles.desktopOnly}>Profile</span>
              </Link>
              <Link href="/profile/edit" className={styles.editBtn}>
                Edit
              </Link>
              <button onClick={signOut} className={styles.logoutBtn} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
