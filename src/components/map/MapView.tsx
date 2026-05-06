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
}

// Custom marker icon factory
function createMarkerIcon(color: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="${color}" opacity="0.9"/>
      <circle cx="18" cy="16" r="10" fill="white" opacity="0.9"/>
      <text x="18" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="${color}" font-family="Inter, sans-serif">${label}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

function getSkillAbbrev(skills: string[] | undefined): string {
  if (!skills || skills.length === 0) return '?';
  const first = skills[0];
  if (first.length <= 3) return first;
  return first.slice(0, 2).toUpperCase();
}

function getSkillColor(skills: string[] | undefined): string {
  if (!skills || skills.length === 0) return '#818cf8';
  const categories: Record<string, string> = {
    'React': '#61DAFB',
    'Next.js': '#f0f0f5',
    'Vue.js': '#42b883',
    'Angular': '#dd1b16',
    'Node.js': '#68A063',
    'Python': '#3776AB',
    'Java': '#ED8B00',
    'TypeScript': '#3178C6',
    'Machine Learning': '#FF6F00',
    'Deep Learning': '#FF6F00',
    'Flutter': '#02569B',
    'Docker': '#2496ED',
    'Figma': '#F24E1E',
  };
  return categories[skills[0]] || '#818cf8';
}

export default function MapView({ center, radiusKm, users }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
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

    users.forEach((user) => {
      if (!user.latitude || !user.longitude) return;

      const color = getSkillColor(user.skills);
      const abbrev = getSkillAbbrev(user.skills);
      const icon = createMarkerIcon(color, abbrev);

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
    });
  }, [users]);

  return (
    <>
      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .custom-marker svg { 
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
          transition: transform 0.2s ease;
        }
        .custom-marker:hover svg {
          transform: scale(1.1) translateY(-4px);
        }
        .user-location-marker { background: none !important; border: none !important; }
        .user-location-marker div {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0; }
          80%, 100% { opacity: 0; }
        }
        .keiretsu-popup .leaflet-popup-content-wrapper {
          background: #111111;
          border: 1px solid #333333;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          backdrop-filter: blur(12px);
        }
        .keiretsu-popup .leaflet-popup-tip { background: #1a1a2e; }
        .keiretsu-popup .leaflet-popup-content { margin: 12px 14px; }
        .leaflet-control-zoom a {
          background: #1a1a2e !important;
          color: #f0f0f5 !important;
          border-color: rgba(255,255,255,0.06) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #252540 !important;
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
