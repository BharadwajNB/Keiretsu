'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { UniversityNode } from '@/lib/universityData';
import { UNIVERSITIES } from '@/lib/universityData';

// Dynamically import react-globe.gl to prevent SSR issues with Three.js
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface GlobeViewProps {
  onNodeClick: (node: UniversityNode, position: { x: number; y: number }) => void;
}

const COUNTRY_LABELS = [
  { lat: 20.5937, lng: 78.9629, label: 'INDIA' },
  { lat: 35.8617, lng: 104.1954, label: 'CHINA' },
  { lat: 61.5240, lng: 105.3188, label: 'RUSSIA' },
  { lat: 30.3753, lng: 69.3451, label: 'PAKISTAN' },
  { lat: 23.6850, lng: 90.3563, label: 'BANGLADESH' },
  { lat: 7.8731, lng: 80.7718, label: 'SRI LANKA' },
  { lat: 28.3949, lng: 84.1240, label: 'NEPAL' },
  { lat: 33.9391, lng: 67.7100, label: 'AFGHANISTAN' },
  { lat: 32.4279, lng: 53.6880, label: 'IRAN' },
  { lat: -0.7893, lng: 113.9213, label: 'INDONESIA' },
  { lat: 4.2105, lng: 101.9758, label: 'MALAYSIA' },
  { lat: 12.8797, lng: 121.7740, label: 'PHILIPPINES' },
  { lat: 23.6978, lng: 120.9605, label: 'TAIWAN' },
  { lat: 35.9078, lng: 127.7669, label: 'SOUTH KOREA' },
  { lat: 40.3399, lng: 127.5101, label: 'NORTH KOREA' },
  { lat: 46.8625, lng: 103.8467, label: 'MONGOLIA' },
  { lat: 41.3775, lng: 64.5853, label: 'UZBEKISTAN' },
  { lat: 23.8859, lng: 45.0792, label: 'SAUDI ARABIA' },
  { lat: 26.8206, lng: 30.8025, label: 'EGYPT' },
  { lat: 26.3351, lng: 17.2283, label: 'LIBYA' },
  { lat: 17.6078, lng: 8.0817, label: 'NIGER' },
  { lat: 15.4542, lng: 18.7322, label: 'CHAD' },
  { lat: 12.8628, lng: 30.2176, label: 'SUDAN' },
  { lat: 15.5527, lng: 48.5164, label: 'YEMEN' },
];

export default function GlobeView({ onNodeClick }: GlobeViewProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState({ features: [] });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Fetch GeoJSON for vector map
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(console.error);
  }, []);

  // Initialize camera
  useEffect(() => {
    if (globeRef.current && dimensions.width > 0) {
      globeRef.current.pointOfView({ lat: 20, lng: 80, altitude: 1.2 });
      globeRef.current.controls().autoRotate = false;
      globeRef.current.controls().enableZoom = true;
    }
  }, [dimensions.width]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulseRing {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(2.4); opacity: 0; }
          }
          .globe-marker-wrapper {
            transform: translate(-50%, -50%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            pointer-events: auto;
          }
          .globe-marker-core {
            width: 10px;
            height: 10px;
            background-color: transparent;
            border: 2px solid #34d399; /* Emerald 400 */
            border-radius: 50%;
            box-shadow: 0 0 10px #34d399, inset 0 0 4px #34d399;
            z-index: 2;
          }
          .globe-marker-ring {
            position: absolute;
            width: 10px;
            height: 10px;
            border: 2px solid #34d399;
            border-radius: 50%;
            animation: pulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
            z-index: 1;
          }
        `
      }} />

      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor="#111111"
          atmosphereAltitude={0.1}
          
          // Vector Polygons instead of image
          polygonsData={countries.features.filter((d: any) => d.properties.ISO_A2 !== 'AQ')}
          polygonAltitude={0.005}
          polygonResolution={2} // Improve geometry performance
          polygonCapColor={() => '#111111'}
          polygonSideColor={() => '#000000'}
          polygonStrokeColor={() => '#333333'}
          
          // Country text labels
          labelsData={COUNTRY_LABELS}
          labelLat={d => (d as any).lat}
          labelLng={d => (d as any).lng}
          labelText={d => (d as any).label}
          labelSize={1.2}
          labelDotRadius={0.1}
          labelAltitude={0.015} // Elevate above polygons so they don't clip
          labelColor={() => 'rgba(255, 255, 255, 0.8)'} // Brighter text
          labelResolution={2}

          // HTML Markers for Universities
          htmlElementsData={UNIVERSITIES}
          htmlTransitionDuration={0} // Drastically improves performance by skipping marker CSS transitions during drag
          htmlElement={(d: object) => {
            const uni = d as UniversityNode;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'globe-marker-wrapper';

            const core = document.createElement('div');
            core.className = 'globe-marker-core';

            const ring = document.createElement('div');
            ring.className = 'globe-marker-ring';

            wrapper.appendChild(core);
            wrapper.appendChild(ring);

            wrapper.onclick = (e) => {
              // Smoothly zoom the camera to the clicked location
              if (globeRef.current) {
                globeRef.current.pointOfView(
                  { lat: uni.lat, lng: uni.lng, altitude: 0.1 }, 
                  2000 // 2000ms smooth animation
                );
              }
              onNodeClick(uni, { x: e.clientX, y: e.clientY });
            };

            return wrapper;
          }}
        />
      )}
    </div>
  );
}
