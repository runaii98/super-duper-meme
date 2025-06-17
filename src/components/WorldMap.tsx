import React from 'react';
import Image from 'next/image';

interface ServerLocation {
  name: string;
  coordinates: { x: number; y: number };
  isLive: boolean;
}

const serverLocations: ServerLocation[] = [
  // North America
  { name: 'California', coordinates: { x: 15, y: 38 }, isLive: true },
  { name: 'Oregon', coordinates: { x: 14, y: 35 }, isLive: true },
  { name: 'Ohio', coordinates: { x: 20, y: 37 }, isLive: true },
  { name: 'North Virginia', coordinates: { x: 22, y: 38 }, isLive: true },
  { name: 'Montreal', coordinates: { x: 23, y: 35 }, isLive: true },
  
  // South America
  { name: 'São Paulo', coordinates: { x: 28, y: 68 }, isLive: true },
  
  // Europe
  { name: 'Dublin', coordinates: { x: 42, y: 32 }, isLive: true },
  { name: 'Frankfurt', coordinates: { x: 47, y: 33 }, isLive: true },
  
  // Asia
  { name: 'Mumbai', coordinates: { x: 65, y: 48 }, isLive: true },
  { name: 'Singapore', coordinates: { x: 75, y: 58 }, isLive: true },
  { name: 'Tokyo', coordinates: { x: 85, y: 40 }, isLive: true },
  
  // Oceania
  { name: 'Sydney', coordinates: { x: 88, y: 72 }, isLive: true }
];

export default function WorldMap() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e1e_1px,transparent_1px),linear-gradient(to_bottom,#1e1e1e_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)] before:absolute before:inset-0 before:bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] before:bg-[size:16px_16px] before:opacity-50"
        />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(29,178,120,0.1),transparent_100%)]" />

        {/* Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent transform -rotate-[2deg]" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent transform rotate-[1deg]" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent transform -rotate-[1deg]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Content */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#1cfeba]/10 backdrop-blur-md rounded-full px-6 py-2 mb-6">
            <p className="text-sm text-[#1cfeba] font-mono uppercase tracking-[0.2em]">WORLDWIDE COVERAGE</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white/90">
            Global Infrastructure,<br />No Latency
          </h2>
          <p className="text-gray-300 max-w-xl mx-auto text-lg leading-relaxed">
            Deploy your apps across our global network of high-performance servers for unmatched reliability and speed.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative w-full aspect-[2/1] bg-[#111] rounded-3xl overflow-hidden group perspective-1000 mb-16">
          <div className="absolute inset-0 transition-all duration-1000 ease-out preserve-3d 
            group-hover:rotate-x-12 group-hover:rotate-y-6 group-hover:scale-110 group-hover:translate-y-[-2%]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-[#1cfeba]/10 to-transparent mix-blend-overlay" />
              <Image
                src="/world.svg"
                alt="World Map"
                fill
                className="object-contain px-16 py-12 opacity-90 brightness-[2.5] contrast-150 saturate-0"
                priority
              />
            </div>

            {/* Server Location Indicators */}
            {serverLocations.map((location) => (
              <div
                key={location.name}
                className="absolute group/marker"
                style={{
                  left: `${location.coordinates.x}%`,
                  top: `${location.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Outer Ping Animation */}
                <div className="absolute -inset-6">
                  <div className="w-12 h-12 bg-[#1cfeba]/10 rounded-full animate-[ping_5s_ease-in-out_infinite]" />
                </div>

                {/* Secondary Ping */}
                <div className="absolute -inset-4">
                  <div className="w-8 h-8 bg-[#1cfeba]/20 rounded-full animate-[ping_5s_ease-in-out_infinite_750ms]" />
                </div>

                {/* Tertiary Ping */}
                <div className="absolute -inset-2">
                  <div className="w-4 h-4 bg-[#1cfeba]/30 rounded-full animate-[ping_5s_ease-in-out_infinite_1500ms]" />
                </div>

                {/* Inner Static Dot */}
                <div className="relative">
                  <div className="w-3 h-3 bg-[#1cfeba] rounded-full shadow-[0_0_25px_8px_rgba(28,254,186,0.6)] animate-[pulse_5s_ease-in-out_infinite]" />
                </div>

                {/* Location Label */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/marker:opacity-100 transition-all duration-500 group-hover/marker:translate-x-2">
                  <div className="bg-black/95 backdrop-blur-xl px-6 py-3 rounded-xl border border-[#1cfeba]/40 shadow-[0_0_30px_rgba(28,254,186,0.3)]">
                    <span className="text-base font-medium text-white whitespace-nowrap tracking-wide">{location.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] group hover:border-[#1cfeba]/50 transition-all duration-300">
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-[#1cfeba] transition-colors">15+</div>
            <div className="text-sm text-gray-400 uppercase tracking-[0.2em]">Global Locations</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] group hover:border-[#1cfeba]/50 transition-all duration-300">
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-[#1cfeba] transition-colors">&lt;100ms</div>
            <div className="text-sm text-gray-400 uppercase tracking-[0.2em]">Global Latency</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a] group hover:border-[#1cfeba]/50 transition-all duration-300">
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-[#1cfeba] transition-colors">99.99%</div>
            <div className="text-sm text-gray-400 uppercase tracking-[0.2em]">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
} 