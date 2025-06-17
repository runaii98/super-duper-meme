import React, { useEffect, useRef } from 'react';

interface DataCenter {
  name: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive';
}

const dataCenters: DataCenter[] = [
  { name: 'California', lat: 37.7749, lng: -122.4194, status: 'active' },
  { name: 'Oregon', lat: 45.5155, lng: -122.6789, status: 'active' },
  { name: 'Ohio', lat: 40.4173, lng: -82.9071, status: 'active' },
  { name: 'North Virginia', lat: 37.9266, lng: -78.0247, status: 'active' },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, status: 'active' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, status: 'active' },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, status: 'active' },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, status: 'active' },
  { name: 'Bahrain', lat: 26.0667, lng: 50.5577, status: 'active' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, status: 'active' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, status: 'active' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, status: 'active' },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, status: 'active' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, status: 'active' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, status: 'active' },
];

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const handleResize = () => {
      if (!canvas || !ctx) return;
      
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const projectLatLng = (lat: number, lng: number, radius: number, rotation: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180 + rotation * (180 / Math.PI)) * (Math.PI / 180);
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      if (z < 0) return null;
      
      return { x, y, z };
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        handleResize();
        if (canvas.width === 0 || canvas.height === 0) return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      let radius = Math.min(centerX, centerY) * 0.8;
      
      if (window.innerWidth >= 1024) { // Laptop and larger screens
        radius = Math.min(centerX, centerY) * 0.95;
      } else if (window.innerWidth >= 768) { // Tablet screens
        radius = Math.min(centerX, centerY) * 0.85;
      }

      if (radius <= 0) return;

      try {
        // Create gradient for the globe background
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');

        // Draw base globe
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw the glowing ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add outer glow to the ring
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Reset shadow for grid lines
        ctx.shadowBlur = 0;

        // Draw grid lines
        const numLines = 20; // Increased number of lines
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numLines; i++) {
          const angle = (i * Math.PI) / (numLines - 1) + rotation;
          
          try {
            // Latitude lines
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              Math.max(0, radius * Math.cos(angle)),
              radius,
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = 'rgba(28, 254, 186, 0.15)';
            ctx.stroke();

            // Longitude lines
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              radius,
              Math.max(0, radius * Math.abs(Math.cos(angle))),
              Math.PI / 2,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = 'rgba(28, 254, 186, 0.15)';
            ctx.stroke();
          } catch (error) {
            continue;
          }
        }

        // Draw data centers with enhanced glow
        dataCenters.forEach(dc => {
          const point = projectLatLng(dc.lat, dc.lng, radius * 0.95, rotation);
          if (point) {
            const screenX = centerX + point.x;
            const screenY = centerY + point.y;
            
            const size = 4 * (point.z / radius + 1);

            // Draw outer glow
            ctx.shadowColor = '#1cfeba';
            ctx.shadowBlur = 15;

            // Draw pulse animation
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * (1 + Math.sin(Date.now() / 500) * 0.3), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(28, 254, 186, 0.3)';
            ctx.fill();

            // Draw center point
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#1cfeba';
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;
          }
        });

        // Update rotation
        rotation += 0.002;
      } catch (error) {
        console.error('Error drawing globe:', error);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-90"
      style={{ filter: 'blur(0.3px)' }}
    />
  );
} 