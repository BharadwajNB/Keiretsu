import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { UniversityNode } from '@/lib/universityData';
import { UNIVERSITIES } from '@/lib/universityData';
import { useEffect } from 'react';

// Define the custom green pulsing dot icon for Leaflet
const customIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      width: 10px;
      height: 10px;
      background-color: transparent;
      border: 2px solid #34d399;
      border-radius: 50%;
      box-shadow: 0 0 10px #34d399, inset 0 0 4px #34d399;
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 18px;
        height: 18px;
        border: 2px solid #34d399;
        border-radius: 50%;
        animation: pulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
      "></div>
    </div>
  `,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

interface DetailedMapViewProps {
  university: UniversityNode;
  onClose: () => void;
  onMarkerClick: (uni: UniversityNode) => void;
}

// Helper component to recenter map when university changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.5 }); // Smooth flyTo animation
  }, [lat, lng, map]);
  return null;
}

export default function DetailedMapView({ university, onClose, onMarkerClick }: DetailedMapViewProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999, // Ensure it sits completely on top of globe HTML markers
      background: '#0a0a0a',
      animation: 'fadeIn 1.5s ease-in-out forwards',
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .leaflet-container {
            width: 100%;
            height: 100%;
            background: #0a0a0a;
          }
          /* Dark theme adjustments for leaflet UI */
          .leaflet-control-zoom a {
            background-color: #1a1a1a !important;
            color: #fafafa !important;
            border-color: #282828 !important;
          }
        `
      }} />

      {/* Close button overlay */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(22, 22, 22, 0.9)',
          border: '1px solid #282828',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(22, 22, 22, 0.9)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <MapContainer 
        center={[university.lat, university.lng]} 
        zoom={14} 
        zoomControl={true}
        preferCanvas={true} // Performance optimization for markers
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render ALL universities on the detailed map */}
        {UNIVERSITIES.map((uni) => (
          <Marker 
            key={uni.id}
            position={[uni.lat, uni.lng]} 
            icon={customIcon}
            eventHandlers={{
              click: () => onMarkerClick(uni),
            }}
          />
        ))}
        
        <MapRecenter lat={university.lat} lng={university.lng} />
      </MapContainer>
    </div>
  );
}
