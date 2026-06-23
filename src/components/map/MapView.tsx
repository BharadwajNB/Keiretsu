'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Profile } from '@/lib/types';
import { AVAILABILITY_LABELS, AVAILABILITY_COLORS } from '@/lib/types';

export interface CommunityCircle {
  center: [number, number];
  radiusKm: number;
  name: string;
  shortName: string;
  builderCount: number;
}

interface MapViewProps {
  center: [number, number];
  radiusKm: number;
  users: Profile[];
  selectedUserId?: string | null;
  communityCircle?: CommunityCircle | null;
}

// Returns initials (up to 2 chars) from a display name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Creates a circular avatar marker with availability ring + optional pulse halo
function createAvatarMarkerIcon(user: Profile, isCommunityActive: boolean): L.DivIcon {
  let ringColor = AVAILABILITY_COLORS[user.availability_status] || '#818cf8';
  const badgeColor = ringColor;
  const isPulsing = user.availability_status === 'open_to_collab';

  // Overwrite ring color with concentric zone color if college community is searched
  if (isCommunityActive && user.distance_km != null) {
    if (user.distance_km <= 1.2) {
      ringColor = '#1a1a24'; // Primary: Dark Charcoal Slate
    } else if (user.distance_km <= 3.0) {
      ringColor = '#ffd54f'; // Secondary: Yellow
    } else {
      ringColor = '#9b92ff'; // Tertiary: Lightish Periwinkle
    }
  }

  const initials = getInitials(user.name || '?');
  let avatarSrc = user.avatar_url || '';
  if (!avatarSrc && user.github_url) {
    const match = user.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
    if (match) avatarSrc = `https://avatars.githubusercontent.com/${match[1]}`;
  }

  // Unique id so each marker's onerror handler targets the right element
  const uid = user.id.replace(/-/g, '').slice(0, 8);

  const pulseHalo = isPulsing
    ? `<div class="avatar-pulse-halo" style="border-color:${ringColor};"></div>`
    : '';

  // We use an <img> with fallback to an initials <div>
  const imgHtml = avatarSrc
    ? `<img
        id="av-${uid}"
        src="${avatarSrc}"
        alt="${initials}"
        class="avatar-marker-img"
      />`
    : '';

  // Initials fallback — hidden by default when avatar loads
  const fallbackHtml = `
    <div
      id="fb-${uid}"
      class="avatar-marker-fallback"
      style="display:${avatarSrc ? 'none' : 'flex'};background:${ringColor}22;"
    >${initials}</div>`;

  // Small indicator badge displaying their live collaboration availability status
  const availabilityBadge = `<div class="avatar-availability-badge" style="background-color:${badgeColor}; border: 1.5px solid ${ringColor};"></div>`;

  const html = `
    <div class="avatar-marker-root${isPulsing ? ' pulsing' : ''}" style="--ring:${ringColor};">
      ${pulseHalo}
      <div class="avatar-marker-frame" style="border-color:${ringColor};">
        ${imgHtml}
        ${fallbackHtml}
      </div>
      ${availabilityBadge}
    </div>`;

  return L.divIcon({
    html,
    className: 'avatar-marker-host',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -32],
  });
}

export default function MapView({ center, radiusKm, users, selectedUserId, communityCircle }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});
  const circleRef = useRef<L.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlownUserIdRef = useRef<string | null>(null);
  const communityCircleLayerRef = useRef<L.LayerGroup | null>(null);
  const activeMoveEndListenerRef = useRef<(() => void) | null>(null);
  const selectedHighlightLayerRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: false,
      preferCanvas: true,
    });

    // Dark tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom control on the right
    L.control.zoom({ position: 'topright' }).addTo(map);



    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="width: 16px; height: 16px; background: #818cf8; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(129,140,248,0.6);"></div>`,
      className: 'user-location-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker(center, { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>You are here</strong>');

    // Radius circle
    const circle = L.circle(center, {
      radius: radiusKm * 1000,
      color: '#818cf8',
      fillColor: '#818cf8',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5',
    }).addTo(map);

    circleRef.current = circle;
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update radius circle
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
    }
    if (mapRef.current) {
      // Adjust zoom based on radius
      const zoom =
        radiusKm <= 1 ? 15 :
        radiusKm <= 3 ? 14 :
        radiusKm <= 5 ? 13 :
        radiusKm <= 10 ? 12 : 11;
      mapRef.current.setZoom(zoom);
    }
  }, [radiusKm]);

  // Update user markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();
    markerMapRef.current = {};

    users.forEach((user) => {
      if (!user.latitude || !user.longitude) return;

      const icon = createAvatarMarkerIcon(user, !!communityCircle);

      const availColor = AVAILABILITY_COLORS[user.availability_status] || '#818cf8';
      const availLabel = AVAILABILITY_LABELS[user.availability_status] || '';

      const skillsHtml = user.skills
        ? user.skills
            .slice(0, 5)
            .map(
              (s) =>
                `<span style="display:inline-block;padding:2px 8px;background:rgba(129,140,248,0.15);color:#818cf8;border-radius:12px;font-size:11px;margin:2px;">${s}</span>`
            )
            .join('')
        : '';

      const popupAvatarUrl = (() => {
        if (user.avatar_url) return user.avatar_url;
        if (user.github_url) {
          const match = user.github_url.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
          if (match) return `https://avatars.githubusercontent.com/${match[1]}`;
        }
        return '/default-avatar.svg';
      })();

      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:220px;padding:4px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <img src="${popupAvatarUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" alt="" />
            <div>
              <div style="font-weight:700;font-size:14px;color:#f0f0f5;">${user.name}</div>
              <div style="font-size:12px;color:#a0a0b8;">Year ${user.year} · ${user.college}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${availColor};"></span>
            <span style="font-size:12px;color:${availColor};">${availLabel}</span>
            <span style="margin-left:auto;font-size:12px;color:#818cf8;font-weight:600;">${user.distance_km} km</span>
          </div>
          <div style="margin-bottom:8px;">${skillsHtml}</div>
          ${user.bio ? `<div style="font-size:12px;color:#a0a0b8;font-style:italic;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;margin-top:4px;">"${user.bio}"</div>` : ''}
          <a href="/profile/${user.id}" style="display:block;text-align:center;padding:8px;background:linear-gradient(135deg,#818cf8,#6366f1);color:white;border-radius:8px;font-size:13px;font-weight:600;margin-top:8px;text-decoration:none;">View Profile</a>
        </div>
      `;

      const marker = L.marker([user.latitude, user.longitude], { icon });
      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'keiretsu-popup',
      });
      markersRef.current!.addLayer(marker);
      markerMapRef.current[user.id] = marker;
    });
  }, [users, communityCircle]);

  // Handle selected user
  useEffect(() => {
    // Clean up any existing highlight circle
    if (selectedHighlightLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(selectedHighlightLayerRef.current);
      selectedHighlightLayerRef.current = null;
    }

    // Clean up any pending listeners and timers
    if (activeMoveEndListenerRef.current && mapRef.current) {
      mapRef.current.off('moveend', activeMoveEndListenerRef.current);
      activeMoveEndListenerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (!selectedUserId || !mapRef.current) {
      lastFlownUserIdRef.current = null;
      return;
    }

    const marker = markerMapRef.current[selectedUserId];
    if (!marker) return;

    if (typeof marker.getLatLng !== 'function' || typeof mapRef.current.setView !== 'function') {
      return;
    }

    const latLng = marker.getLatLng();

    // Create highlight circle around selected user
    const highlightCircle = L.circle(latLng, {
      radius: 350, // 350 meters
      color: '#9b92ff',
      fillColor: '#9b92ff',
      fillOpacity: 0.15,
      weight: 2,
      className: 'selected-user-highlight-circle',
    }).addTo(mapRef.current);
    selectedHighlightLayerRef.current = highlightCircle;

    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();

    // Prevent redundant setView if already centered at zoom 16
    const isAlreadyCentered = currentZoom === 16 && currentCenter.distanceTo(latLng) < 10;

    if (isAlreadyCentered) {
      lastFlownUserIdRef.current = selectedUserId;
      if (typeof marker.openPopup === 'function') {
        marker.openPopup();
      }
      return;
    }

    lastFlownUserIdRef.current = selectedUserId;

    // Define the moveend listener callback
    const handleMoveEnd = () => {
      const activeMarker = markerMapRef.current[selectedUserId];
      if (activeMarker && mapRef.current && typeof activeMarker.openPopup === 'function') {
        activeMarker.openPopup();
      }
      activeMoveEndListenerRef.current = null;
    };

    activeMoveEndListenerRef.current = handleMoveEnd;
    mapRef.current.once('moveend', handleMoveEnd);

    // Smoothly pan to location (zoom level 16)
    mapRef.current.setView(latLng, 16, { animate: true, duration: 0.25 });

    // Fallback timer to ensure the popup opens even if Leaflet suppresses the moveend event
    timeoutIdRef.current = setTimeout(() => {
      if (activeMoveEndListenerRef.current) {
        if (mapRef.current) {
          mapRef.current.off('moveend', activeMoveEndListenerRef.current);
        }
        handleMoveEnd();
      }
      timeoutIdRef.current = null;
    }, 400);

    return () => {
      if (activeMoveEndListenerRef.current && mapRef.current) {
        mapRef.current.off('moveend', activeMoveEndListenerRef.current);
        activeMoveEndListenerRef.current = null;
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (selectedHighlightLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(selectedHighlightLayerRef.current);
        selectedHighlightLayerRef.current = null;
      }
    };
  }, [selectedUserId, users]);

  // Community circle rendering
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous community circle layers
    if (communityCircleLayerRef.current) {
      communityCircleLayerRef.current.clearLayers();
      mapRef.current.removeLayer(communityCircleLayerRef.current);
      communityCircleLayerRef.current = null;
    }

    if (!communityCircle) return;

    const group = L.layerGroup().addTo(mapRef.current);
    communityCircleLayerRef.current = group;

    // 1. Tertiary Circle (Outer): 5.0 km radius, Styled in Lightish Periwinkle
    const tertiaryCircle = L.circle(communityCircle.center, {
      radius: 5000,
      color: '#9b92ff',
      fillColor: '#9b92ff',
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.6,
      dashArray: '6, 6',
      className: 'community-circle-tertiary',
    });
    group.addLayer(tertiaryCircle);

    // 2. Secondary Circle (Middle): 3.0 km radius, Styled in Yellow
    const secondaryCircle = L.circle(communityCircle.center, {
      radius: 3000,
      color: '#ffd54f',
      fillColor: '#ffd54f',
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.7,
      dashArray: '4, 4',
      className: 'community-circle-secondary',
    });
    group.addLayer(secondaryCircle);

    // 3. Primary Circle (Inner): 1.2 km radius, Styled in Dark Charcoal Slate
    const primaryCircle = L.circle(communityCircle.center, {
      radius: 1200,
      color: '#1a1a24',
      fillColor: '#1a1a24',
      fillOpacity: 0.35,
      weight: 2,
      opacity: 0.8,
      className: 'community-circle-primary',
    });
    group.addLayer(primaryCircle);

    // Center label
    const labelIcon = L.divIcon({
      html: `
        <div class="community-circle-label">
          <span class="community-circle-label-name">${communityCircle.name}</span>
          <span class="community-circle-label-count">${communityCircle.builderCount} builder${communityCircle.builderCount !== 1 ? 's' : ''}</span>
        </div>
      `,
      className: 'community-circle-label-host',
    });
    const labelMarker = L.marker(communityCircle.center, { icon: labelIcon, interactive: false });
    group.addLayer(labelMarker);

    // Fly to the college location with a bounds view fitting all zones nicely
    mapRef.current.flyTo(communityCircle.center, 13, { animate: true, duration: 1.2 });

  }, [communityCircle]);

  return (
    <>
      <style>{`
        /* ---- Avatar marker host (Leaflet clears className if empty) ---- */
        .avatar-marker-host { background: none !important; border: none !important; }

        /* Root wrapper — centers the frame + optional halo */
        .avatar-marker-root {
          position: relative;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease;
          cursor: pointer;
        }
        .avatar-marker-root:hover { transform: scale(1.15) translateY(-4px); }

        /* Circular photo frame with colored availability or zone ring */
        .avatar-marker-frame {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid;
          overflow: hidden;
          position: relative;
          z-index: 2;
          box-shadow: 0 4px 14px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.06);
          background: #1a1a2e;
          flex-shrink: 0;
        }

        /* Avatar image */
        .avatar-marker-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Initials fallback */
        .avatar-marker-fallback {
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--ring, #818cf8);
          font-family: Inter, sans-serif;
          letter-spacing: 0.04em;
        }

        /* Pulsing halo for open_to_collab users */
        .avatar-pulse-halo {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid;
          opacity: 0;
          animation: avatarHalo 2s ease-out infinite;
          z-index: 1;
        }
        @keyframes avatarHalo {
          0%   { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.6); }
        }

        /* Small badge in top right corner of the avatar marker displaying availability */
        .avatar-availability-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 10;
          box-shadow: 0 2px 5px rgba(0,0,0,0.6);
        }

        /* User's own "You are here" dot */
        .user-location-marker { background: none !important; border: none !important; }

        /* Leaflet popup dark theme */
        .keiretsu-popup .leaflet-popup-content-wrapper {
          background: #111111;
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.7);
          backdrop-filter: blur(12px);
        }
        .keiretsu-popup .leaflet-popup-tip { background: #111111; }
        .keiretsu-popup .leaflet-popup-content { margin: 12px 14px; }
        .leaflet-control-zoom a {
          background: #1a1a2e !important;
          color: #f0f0f5 !important;
          border-color: rgba(255,255,255,0.06) !important;
        }
        .leaflet-control-zoom a:hover { background: #252540 !important; }

        /* ---- Concentric Community Circles ---- */
        .community-circle-tertiary {
          animation: pulseTertiary 4s ease-in-out infinite;
        }
        @keyframes pulseTertiary {
          0%, 100% { stroke-opacity: 0.4; stroke-width: 1.5; }
          50% { stroke-opacity: 0.7; stroke-width: 2; }
        }

        .community-circle-secondary {
          animation: pulseSecondary 3.5s ease-in-out infinite;
        }
        @keyframes pulseSecondary {
          0%, 100% { stroke-opacity: 0.5; stroke-width: 1.5; }
          50% { stroke-opacity: 0.85; stroke-width: 2.2; }
        }

        .community-circle-primary {
          animation: pulsePrimary 3s ease-in-out infinite;
        }
        @keyframes pulsePrimary {
          0%, 100% { stroke-opacity: 0.7; stroke-width: 2; }
          50% { stroke-opacity: 0.95; stroke-width: 2.8; }
        }

        .community-circle-label-host {
          background: none !important;
          border: none !important;
          width: auto !important;
          height: auto !important;
          z-index: 9999 !important;
          overflow: visible !important;
        }

        .community-circle-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: rgba(10, 10, 16, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 8px 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          transform: translate(-50%, 42px); /* Centered horizontally and shifted below the marker */
          white-space: nowrap;
          width: max-content;
          overflow: visible !important;
        }

        .community-circle-label-name {
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f5;
          letter-spacing: 0.02em;
        }

        .community-circle-label-count {
          font-family: Inter, sans-serif;
          font-size: 11px;
          color: #b39ddb;
          font-weight: 600;
        }

        /* Pulsing animation for selected user's highlight circle */
        .selected-user-highlight-circle {
          animation: pulseHighlight 2s ease-in-out infinite;
        }
        @keyframes pulseHighlight {
          0%, 100% {
            stroke-opacity: 0.4;
            fill-opacity: 0.1;
            stroke-width: 1.5;
          }
          50% {
            stroke-opacity: 0.85;
            fill-opacity: 0.25;
            stroke-width: 2.5;
          }
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
