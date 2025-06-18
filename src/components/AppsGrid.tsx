import React from 'react';
import Image from 'next/image';

type Category = 'IMAGE' | 'AUDIO' | 'AI';
type Status = 'STABLE' | 'BETA' | 'NEW';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Category;
  status: Status;
  deployCount: string;
}

const apps: App[] = [
  {
    id: 'sd-webui',
    name: 'SD WebUI',
    description: 'Automatic1111 Stable Diffusion is a powerful tool that completely revolutionizes the way we create images.',
    icon: '/icons/sd.svg',
    category: 'IMAGE',
    status: 'STABLE',
    deployCount: '2.5k+'
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'ComfyUI is an AI drawing tool that utilizes StableDiffusion, offering a useful and complete workflow.',
    icon: '/icons/comfy.svg',
    category: 'IMAGE',
    status: 'STABLE',
    deployCount: '1.8k+'
  },
  {
    id: 'facefusion',
    name: 'FaceFusion',
    description: 'FaceFusion is the next generation face swapper and enhancer to create high-quality face swaps.',
    icon: '/icons/face.svg',
    category: 'IMAGE',
    status: 'BETA',
    deployCount: '950+'
  },
  {
    id: 'ai-toolkit',
    name: 'AI-Toolkit',
    description: 'AI-Toolkit is designed for both ease of use and high performance, utilizing state-of-the-art AI tools.',
    icon: '/icons/toolkit.svg',
    category: 'AI',
    status: 'NEW',
    deployCount: '500+'
  },
  {
    id: 'rvc',
    name: 'RVC',
    description: 'RVC is an advanced voice cloning system based on VITS, designed to provide a convenient voice changing experience.',
    icon: '/icons/rvc.svg',
    category: 'AUDIO',
    status: 'STABLE',
    deployCount: '1.2k+'
  },
  {
    id: 'foocus',
    name: 'Foocus',
    description: 'Foocus is an innovative image generation software that focuses on usability and high-quality outputs.',
    icon: '/icons/focus.svg',
    category: 'IMAGE',
    status: 'NEW',
    deployCount: '750+'
  },
  {
    id: 'kohya_ss',
    name: 'Kohya_ss',
    description: 'Advanced LoRA training interface with support for multiple training methods and architectures.',
    icon: '/icons/kohya.svg',
    category: 'AI',
    status: 'STABLE',
    deployCount: '1.5k+'
  },
  {
    id: 'dreambooth',
    name: 'DreamBooth',
    description: 'Fine-tune Stable Diffusion models with personalized generation for custom images and styles.',
    icon: '/icons/dream.svg',
    category: 'IMAGE',
    status: 'STABLE',
    deployCount: '2k+'
  }
];

const categoryColors: Record<Category, string> = {
  IMAGE: 'emerald',
  AUDIO: 'blue',
  AI: 'purple'
};

const statusColors: Record<Status, string> = {
  STABLE: 'emerald',
  BETA: 'yellow',
  NEW: 'blue'
};

export default function AppsGrid() {
  return (
    <section className="py-24 bg-black relative">
      {/* Section Background with Grid and Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e1e_1px,transparent_1px),linear-gradient(to_bottom,#1e1e1e_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
            <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/INSTANT BUILDING</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Deploy in Production with<br />One-Click Apps
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From AI models to full-stack apps and databases, start in seconds.
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="group relative bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transition-all duration-300
                hover:border-[#1cfeba]/50 hover:shadow-[0_0_30px_rgba(28,254,186,0.1)] hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] p-2.5 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${categoryColors[app.category]}-500/10 text-${categoryColors[app.category]}-500`}>
                    {app.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColors[app.status]}-500/10 text-${statusColors[app.status]}-500`}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <h3 className="text-xl font-bold mb-2 group-hover:text-[#1cfeba] transition-colors">
                {app.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                {app.description}
              </p>

              {/* Card Footer */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm text-gray-500">
                  {app.deployCount} deployments
                </span>
                <button className="px-4 py-2 rounded-lg bg-[#2a2a2a] text-white text-sm font-medium 
                  hover:bg-[#1cfeba] hover:text-black transition-all duration-200 group-hover:bg-[#1cfeba] group-hover:text-black">
                  Deploy Now
                </button>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1cfeba]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a href="/apps" className="inline-flex items-center space-x-2 text-[#1cfeba] hover:text-[#1cfeba]/80 transition-colors">
            <span>View all applications</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 