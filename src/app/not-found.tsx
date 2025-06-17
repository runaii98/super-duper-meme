'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Create wireframe sphere
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1cfeba,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Position camera
    camera.position.z = 10;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (sphereRef.current) {
        sphereRef.current.rotation.x += 0.001;
        sphereRef.current.rotation.y += 0.001;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-gray-400">This page could not be found.</p>
        <a 
          href="/"
          className="mt-8 px-6 py-3 bg-[#111111] border border-[#222222] rounded-lg text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300"
        >
          Return Home
        </a>
      </div>
    </div>
  );
} 