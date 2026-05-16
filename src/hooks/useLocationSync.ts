'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import { createClient } from '@/lib/supabase/client';

interface LocationSyncState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
  /** Whether the location watcher is currently active */
  isWatching: boolean;
  /** Whether a sync to Supabase is in progress */
  isSyncing: boolean;
  /** Timestamp of the last successful Supabase sync */
  lastSyncedAt: number | null;
  /** Request location permission explicitly */
  requestLocation: () => void;
}

/** Minimum interval between Supabase location updates (5 minutes) */
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Composable hook that combines watchPosition geolocation with
 * throttled Supabase location syncing.
 *
 * Use this as the single entry point for any page that wants
 * to keep the user's location fresh in the database.
 */
export function useLocationSync(): LocationSyncState {
  const geo = useGeolocation({ watch: true, minDistanceMeters: 50, minIntervalMs: 30000 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const supabaseRef = useRef(createClient());

  const syncLocation = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    // Throttle: skip if last sync was less than 5 minutes ago
    if (now - lastSyncTimeRef.current < SYNC_THROTTLE_MS) {
      return;
    }

    setIsSyncing(true);
    lastSyncTimeRef.current = now;

    try {
      await supabaseRef.current.rpc('update_user_location', {
        user_lat: lat,
        user_lng: lng,
      });
      setLastSyncedAt(now);
    } catch {
      // Silently fail — location sync is best-effort
      console.warn('[useLocationSync] Failed to sync location to Supabase');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync whenever coordinates change (throttled internally)
  useEffect(() => {
    if (geo.latitude && geo.longitude) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      syncLocation(geo.latitude, geo.longitude);
    }
  }, [geo.latitude, geo.longitude, syncLocation]);

  return {
    latitude: geo.latitude,
    longitude: geo.longitude,
    error: geo.error,
    loading: geo.loading,
    permissionState: geo.permissionState,
    isWatching: geo.permissionState === 'granted' && !geo.error,
    isSyncing,
    lastSyncedAt,
    requestLocation: geo.requestLocation,
  };
}
