'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Profile } from '@/lib/types';
import { AVAILABILITY_LABELS, AVAILABILITY_COLORS } from '@/lib/types';

interface MapViewProps {
  center: [number, number];
  radiusKm: number;
  users: Profile[];
  selectedUserId?: string | null;
}

// Returns initials (up to 2 chars) from a display name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Creates a circular avatar marker with availability ring + optional pulse halo
function createAvatarMarkerIcon(user: Profile): L.DivIcon {
  const ringColor = AVAILABILITY_COLORS[user.availability_status] || '#818cf8';
  const isPulsing = user.availability_status === 'open_to_collab';
  const initials = getInitials(user.name || '?');
  const avatarSrc = user.avatar_url || '';

  // Unique id so each marker's onerror handler targets the right element
  const uid = user.id.replace(/-/g, '').slice(0, 8);

  const pulseHalo = isPulsing
    ? `<div class="avatar-pulse-halo" style="border-color:${ringColor};"></div>`
    : '';

  // We use an <img> with onerror fallback to an initials <div>
  const imgHtml = avatarSrc
    ? `<img
        id="av-${uid}"
        src="${avatarSrc}"
        alt="${initials}"
        class="avatar-marker-img"
        onerror="
          var el=document.getElementById('av-${uid}');
          if(el){
            el.style.display='none';
            var fb=document.getElementById('fb-${uid}');
            if(fb) fb.style.display='flex';
          }
        "
      />`
    : '';

  // Initials fallback — hidden by default when avatar loads, shown on error
  const fallbackHtml = `
    <div
      id="fb-${uid}"
      class="avatar-marker-fallback"
      style="display:${avatarSrc ? 'none' : 'flex'};background:${ringColor}22;"
    >${initials}</div>`;

  const html = `
    <div class="avatar-marker-root${isPulsing ? ' pulsing' : ''}" style="--ring:${ringColor};">
      ${pulseHalo}
      <div class="avatar-marker-frame" style="border-color:${ringColor};">
        ${imgHtml}
        ${fallbackHtml}
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: 'avatar-marker-host',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -32],
  });
}

export default function MapView({ center, radiusKm, users, selectedUserId }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});
  const circleRef = useRef<L.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: false,
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

      const icon = createAvatarMarkerIcon(user);

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

      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:220px;padding:4px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <img src="${user.avatar_url || '/default-avatar.svg'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" alt="" />
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
  }, [users]);

  // Handle selected user
  useEffect(() => {
    if (selectedUserId && mapRef.current && markerMapRef.current[selectedUserId]) {
      const marker = markerMapRef.current[selectedUserId];
      const latLng = marker.getLatLng();
      
      // Fly to location
      mapRef.current.flyTo(latLng, 16, { duration: 1.5 });
      
      // Wait for fly animation to finish, then open popup
      setTimeout(() => {
        if (mapRef.current) {
          marker.openPopup();
        }
      }, 1500);
    }
  }, [selectedUserId]);

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

        /* Circular photo frame with colored availability ring */
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
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
