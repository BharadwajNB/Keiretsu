'use client';

import { useState, useEffect } from 'react';
import styles from './StarField.module.css';

function generateStars(count: number, spread: number): string {
  return Array.from({ length: count }, () => {
    const x = Math.floor(Math.random() * spread);
    const y = Math.floor(Math.random() * spread);
    const opacity = 0.3 + Math.random() * 0.7;
    return `${x}px ${y}px rgba(255,255,255,${opacity.toFixed(2)})`;
  }).join(', ');
}

interface StarLayer {
  shadows: string;
  size: number;
  duration: number;
}

export default function StarField() {
  const [layers, setLayers] = useState<StarLayer[]>([]);

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayers([
      { shadows: generateStars(600, 2000), size: 1, duration: 120 },
      { shadows: generateStars(200, 2000), size: 1.5, duration: 180 },
      { shadows: generateStars(80, 2000), size: 2, duration: 240 },
    ]);
  }, []);

  return (
    <div className={styles.starField}>
      {layers.map((layer, i) => (
        <div
          key={i}
          className={styles.starLayer}
          style={{
            width: `${layer.size}px`,
            height: `${layer.size}px`,
            boxShadow: layer.shadows,
            animationDuration: `${layer.duration}s`,
          }}
        />
      ))}
      <div className={styles.nebula} />
    </div>
  );
}
