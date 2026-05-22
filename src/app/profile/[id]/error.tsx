'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile page error:', error);
  }, [error]);

  return (
    <div className="page">
      <div className="page-center" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <span style={{ fontSize: 28 }}>⚠️</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary, #f0f0f5)' }}>
          Something went wrong
        </h2>
        <p style={{ color: 'var(--text-muted, #a0a0b8)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          We couldn&apos;t load this profile. This might be a temporary issue.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #818cf8, #6366f1)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <Link
            href="/search"
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary, #f0f0f5)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Back to Search
          </Link>
        </div>
      </div>
    </div>
  );
}
