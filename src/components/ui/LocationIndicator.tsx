'use client';

import { useState, useEffect } from 'react';
import styles from './LocationIndicator.module.css';

interface LocationIndicatorProps {
  isWatching: boolean;
  isSyncing: boolean;
  permissionState: PermissionState | null;
  lastSyncedAt: number | null;
}

function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Compact, reusable location sync status indicator.
 * Shows pulsing dot + text based on the current geolocation/sync state.
 */
export default function LocationIndicator({
  isWatching,
  isSyncing,
  permissionState,
  lastSyncedAt,
}: LocationIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string | null>(null);

  useEffect(() => {
    if (!lastSyncedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeAgo(null);
      return;
    }

    const update = () => setTimeAgo(formatTimeAgo(Date.now() - lastSyncedAt));
    update();
    const id = setInterval(update, 30000); // Refresh every 30s
    return () => clearInterval(id);
  }, [lastSyncedAt]);

  if (permissionState === 'denied') {
    return (
      <div className={`${styles.indicator} ${styles.denied}`}>
        <span className={`${styles.dot} ${styles.dotDenied}`} />
        <span>Location unavailable</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={`${styles.indicator} ${styles.syncing}`}>
        <span className={`${styles.dot} ${styles.dotSyncing}`} />
        <span>Syncing...</span>
      </div>
    );
  }

  if (isWatching) {
    return (
      <div className={`${styles.indicator} ${styles.active}`}>
        <span className={`${styles.dot} ${styles.dotActive}`} />
        <span>Location active{timeAgo ? ` · ${timeAgo}` : ''}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.indicator} ${styles.prompt}`}>
      <span className={`${styles.dot} ${styles.dotPrompt}`} />
      <span>Location off</span>
    </div>
  );
}

