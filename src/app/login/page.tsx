'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import styles from './page.module.css';

export function LoginContent({ isModal = false, onCancel }: { isModal?: boolean; onCancel?: () => void }) {
  const router = useRouter();
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authError ? 'OAuth authentication failed. Please try again.' : null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        if (!fullName) {
          setError('Full name is required for signup.');
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await signUpWithEmail(email, password, fullName);
        if (signUpError) throw signUpError;
        
        if (data?.session) {
          // Push to edit profile page
          router.push('/profile/edit?welcome=true');
        } else {
          // Email confirmation required
          setSuccessMsg('Account created! Please check your email to verify your account before signing in.');
          setIsSignUp(false); // Switch back to sign in
          setPassword(''); // Clear password for security
        }
      } else {
        const { error: signInError } = await signInWithEmail(email, password);
        if (signInError) throw signInError;

        // Push to home page
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className={styles.loginCard}>
      {isModal && onCancel && (
        <button type="button" className={styles.modalClose} onClick={onCancel} aria-label="Close">
          <X size={20} />
        </button>
      )}
      <div className={styles.loginGlow} />
          <div className={styles.loginHeader}>
            <div className={styles.brandHeader}>
              <Image 
                src="/custom-globe-transparent.png" 
                alt="Keiretsu Logo" 
                width={48} 
                height={48} 
                className={styles.brandLogo}
                priority
              />
              <span className={styles.brandName}>Keiretsu</span>
            </div>
            <h1>{isSignUp ? 'Join Keiretsu' : 'Log in'}</h1>
            <p className={styles.registerPrompt}>
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setIsSignUp(false); setError(null); }} 
                    className={styles.registerLink}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New user?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setIsSignUp(true); setError(null); }} 
                    className={styles.registerLink}
                  >
                    Register Now
                  </button>
                </>
              )}
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className={styles.success}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            {isSignUp && (
              <div className="input-group">
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Satoshi Nakamoto"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}

            <div className="input-group">
              <label className="label">Email</label>
              <input 
                type="email" 
                className="input" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="label">Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {!isSignUp && (
              <div className={styles.rememberMeRow}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    className={styles.checkbox}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>

          <div className={styles.loginButtons}>
            <button type="button" onClick={signInWithGoogle} className={styles.oauthBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button type="button" onClick={signInWithGithub} className={styles.oauthBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p className={styles.loginFooter}>
            By signing in, you agree to share your profile publicly on the map.
          </p>
        </div>
  );

  if (isModal) {
    return cardContent;
  }

  return (
    <div className="page">
      <div className="page-center">
        {cardContent}
      </div>
    </div>
  );
}

import Home from '../page';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-center"><div className="spinner" /></div>}>
      <Home defaultShowLogin={true} />
    </Suspense>
  );
}
