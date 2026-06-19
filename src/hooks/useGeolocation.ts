'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeolocationState } from '@/lib/types';

interface UseGeolocationOptions {
  /** If true, uses watchPosition for continuous updates instead of one-shot getCurrentPosition */
  watch?: boolean;
  /** Minimum distance change in meters before emitting a new state (GPS jitter debounce) */
  minDistanceMeters?: number;
  /** Minimum time in ms between emitting new coordinates */
  minIntervalMs?: number;
}

/**
 * Haversine distance between two coordinates in meters.
 * Used for GPS jitter debouncing — skips updates where the user hasn't actually moved.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { watch = false, minDistanceMeters = 50, minIntervalMs = 30000 } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionState: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const handleErrorRef = useRef<((error: GeolocationPositionError) => void) | null>(null);
  const geoOptionsRef = useRef<PositionOptions>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: watch ? 60000 : 300000,
  });

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      // Jitter debounce: skip if we haven't moved enough or enough time hasn't passed
      if (lastEmitRef.current) {
        const dist = haversineDistance(
          lastEmitRef.current.lat, lastEmitRef.current.lng,
          latitude, longitude
        );
        const elapsed = Date.now() - lastEmitRef.current.time;

        if (dist < minDistanceMeters && elapsed < minIntervalMs) {
          return; // Skip noisy update
        }
      }

      lastEmitRef.current = { lat: latitude, lng: longitude, time: Date.now() };

      setState({
        latitude,
        longitude,
        error: null,
        loading: false,
        permissionState: 'granted',
      });
    },
    [minDistanceMeters, minIntervalMs]
  );

  const handleError = useCallback((error: GeolocationPositionError) => {
    // If high accuracy failed/timed out, try falling back to low accuracy
    if (geoOptionsRef.current.enableHighAccuracy) {
      console.warn('[useGeolocation] High accuracy failed, retrying with low accuracy...');
      geoOptionsRef.current = {
        ...geoOptionsRef.current,
        enableHighAccuracy: false,
        timeout: 15000,
      };

      const fallbackHandler = (err: GeolocationPositionError) => {
        if (handleErrorRef.current) {
          handleErrorRef.current(err);
        }
      };

      if (watch) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          fallbackHandler,
          geoOptionsRef.current
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          fallbackHandler,
          geoOptionsRef.current
        );
      }
      return;
    }

    let errorMessage = 'Unable to get your location';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable it in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }
    setState({
      latitude: null,
      longitude: null,
      error: errorMessage,
      loading: false,
      permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt',
    });
  }, [handleSuccess, watch]);

  // Update the ref inside an effect to comply with rules of React refs
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Defer state update to avoid cascading render warning in React effects
      Promise.resolve().then(() => {
        setState((prev) => ({
          ...prev,
          error: 'Geolocation is not supported by your browser',
          loading: false,
        }));
      });
      return;
    }

    // Defer state update to avoid cascading render warning in React effects
    Promise.resolve().then(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    });

    const handler = (err: GeolocationPositionError) => {
      if (handleErrorRef.current) {
        handleErrorRef.current(err);
      }
    };

    if (watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handler,
        geoOptionsRef.current
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handler,
        geoOptionsRef.current
      );
    }
  }, [handleSuccess, watch]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let active = true;

    const handler = (err: GeolocationPositionError) => {
      if (handleErrorRef.current) {
        handleErrorRef.current(err);
      }
    };

    const handlePermissionChange = () => {
      if (!active || !permissionStatus) return;
      const state = permissionStatus.state;
      setState((prev) => ({ ...prev, permissionState: state }));
      if (state === 'granted') {
        if (watch && watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handler,
            geoOptionsRef.current
          );
        }
      } else {
        stopWatching();
        setState((prev) => ({
          ...prev,
          latitude: null,
          longitude: null,
          permissionState: state,
        }));
      }
    };

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (!active) return;
        permissionStatus = result;
        setState((prev) => ({ ...prev, permissionState: result.state }));
        result.addEventListener('change', handlePermissionChange);

        if (result.state === 'granted') {
          if (watch && watchIdRef.current === null) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              handleSuccess,
              handler,
              geoOptionsRef.current
            );
          } else if (!watch) {
            requestLocation();
          }
        } else {
          // Defer state update to avoid cascading render warning in React effects
          Promise.resolve().then(() => {
            setState((prev) => ({ ...prev, loading: false }));
          });
        }
      });
    } else {
      if (watch) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handler,
          geoOptionsRef.current
        );
      } else {
        requestLocation();
      }
    }

    return () => {
      active = false;
      stopWatching();
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [watch, handleSuccess, requestLocation, stopWatching]);

  return { ...state, requestLocation, stopWatching };
}
