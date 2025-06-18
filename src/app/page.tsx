'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import Image from 'next/image';
import WorldMap from '@/components/WorldMap';
import Navbar from '@/components/Navbar';
import Globe from '@/components/Globe';
import TemplateSection from '@/components/TemplateSection';
import AppsGrid from '@/components/AppsGrid';
import Features from '@/components/Features';

type UsabilityLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
type GpuType = 'T4' | 'L4' | 'A40' | 'A100' | 'H100';
type Category = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'AI';
type Status = 'STABLE' | 'BETA' | 'NEW';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Category;
  status: Status;
  deployCount: string;
  usability: UsabilityLevel;
  recommendedGpu: GpuType[];
  githubStars?: string;
  pricing?: string;
}

interface CategorySection {
  title: string;
  description: string;
  apps: App[];
}

const testimonials = [
  {
    quote: "ComfyUI has revolutionized our deployment process. What used to take days now takes minutes.",
    author: "Sarah Chen",
    role: "CTO at TechVision",
    company: "/logos/techvision.svg"
  },
  {
    quote: "The reliability and performance of ComfyUI's infrastructure is unmatched. It's a game-changer.",
    author: "Michael Rodriguez",
    role: "Lead Developer at DataFlow",
    company: "/logos/dataflow.svg"
  },
  {
    quote: "We've cut our infrastructure costs by 60% while improving performance. Simply incredible.",
    author: "Emily Thompson",
    role: "Engineering Manager at ScaleAI",
    company: "/logos/scaleai.svg"
  }
];

const faqs = [
  {
    question: "What is ComfyUI Cloud?",
    answer: "ComfyUI Cloud is a modern cloud platform that enables developers to deploy and scale applications globally with zero infrastructure management. It provides automatic scaling, real-time monitoring, and pay-as-you-go pricing."
  },
  {
    question: "How does pricing work?",
    answer: "We offer simple, usage-based pricing with no hidden fees. You only pay for the resources you consume, with pricing based on compute time, memory usage, and data transfer. Start free with generous limits and scale as you grow."
  },
  {
    question: "Can I deploy any type of application?",
    answer: "Yes! ComfyUI supports all major programming languages and frameworks including Node.js, Python, Ruby, Go, and more. Deploy anything from web apps to APIs, background jobs to ML models."
  },
  {
    question: "How does global deployment work?",
    answer: "Your applications are automatically deployed across our global network of data centers. We handle load balancing, scaling, and failover automatically to ensure optimal performance for users worldwide."
  },
  {
    question: "What about security?",
    answer: "Security is our top priority. We provide SSL certificates, DDoS protection, automated backups, and enterprise-grade security features out of the box. All data is encrypted in transit and at rest."
  },
  {
    question: "Do you offer support?",
    answer: "Yes! We provide 24/7 technical support via email and chat. Enterprise customers get dedicated support with guaranteed response times and a dedicated account manager."
  }
];

const pricingPlans = [
  {
    name: "Base",
    description: "Perfect for individual developers and small projects",
    price: "49",
    features: [
      { name: "GPU", value: "NVIDIA T4", highlight: true },
      { name: "GPU RAM", value: "16GB GDDR6" },
      { name: "System RAM", value: "32GB DDR4" },
      { name: "CPU Cores", value: "8 vCPU" },
      { name: "Storage", value: "50GB NVMe SSD" },
      { name: "Bandwidth", value: "1TB/month" },
      { name: "Deployment Regions", value: "3 Regions" },
      { name: "Auto-scaling", value: "Basic" },
    ],
    popular: false,
    ctaText: "Start Free Trial"
  },
  {
    name: "Pro",
    description: "For growing teams with advanced computing needs",
    price: "199",
    features: [
      { name: "GPU", value: "NVIDIA L4 or A40", highlight: true },
      { name: "GPU RAM", value: "48GB GDDR6" },
      { name: "System RAM", value: "64GB DDR4" },
      { name: "CPU Cores", value: "16 vCPU" },
      { name: "Storage", value: "200GB NVMe SSD" },
      { name: "Bandwidth", value: "5TB/month" },
      { name: "Deployment Regions", value: "All Regions" },
      { name: "Auto-scaling", value: "Advanced" },
    ],
    popular: true,
    ctaText: "Upgrade to Pro"
  },
  {
    name: "Super Pro",
    description: "Enterprise-grade infrastructure for maximum performance",
    price: "999",
    features: [
      { name: "GPU", value: "NVIDIA A100/H100", highlight: true },
      { name: "GPU RAM", value: "80GB HBM2e" },
      { name: "System RAM", value: "256GB DDR4" },
      { name: "CPU Cores", value: "32 vCPU" },
      { name: "Storage", value: "500GB NVMe SSD" },
      { name: "Bandwidth", value: "Unlimited" },
      { name: "Deployment Regions", value: "All Regions + Priority" },
      { name: "Auto-scaling", value: "Enterprise" },
    ],
    popular: false,
    ctaText: "Contact Sales"
  }
];

const gpuServers = [
  {
    name: 'T4',
    description: 'Entry-level GPU perfect for development and light inference workloads.',
    specs: {
      gpu: 'NVIDIA T4',
      gpuMemory: '16GB GDDR6',
      vCPUs: '8 cores',
      ram: '32GB',
      storage: '150GB NVMe',
      network: '10 Gbps'
    },
    pricing: {
      spot: '$0.35/hour',
      onDemand: '$0.60/hour'
    },
    performanceRatio: '8.5/10',
    idealFor: ['Development', 'Testing', 'Small Batch Inference'],
    icon: '/icons/gpu-basic.svg'
  },
  {
    name: 'L4',
    description: 'Balanced performance for production inference and medium training jobs.',
    specs: {
      gpu: 'NVIDIA L4',
      gpuMemory: '24GB GDDR6',
      vCPUs: '12 cores',
      ram: '64GB',
      storage: '250GB NVMe',
      network: '25 Gbps'
    },
    pricing: {
      spot: '$0.60/hour',
      onDemand: '$1.10/hour'
    },
    performanceRatio: '9/10',
    idealFor: ['Production Inference', 'Medium Training', 'Batch Processing'],
    icon: '/icons/gpu-advanced.svg'
  },
  {
    name: 'A100 40GB',
    description: 'High-performance computing for demanding AI workloads.',
    specs: {
      gpu: 'NVIDIA A100',
      gpuMemory: '40GB HBM2',
      vCPUs: '16 cores',
      ram: '128GB',
      storage: '500GB NVMe',
      network: '50 Gbps'
    },
    pricing: {
      spot: '$1.50/hour',
      onDemand: '$2.50/hour'
    },
    performanceRatio: '9.5/10',
    idealFor: ['Large Model Training', 'High-Performance Inference', 'Research'],
    icon: '/icons/gpu-pro.svg'
  },
  {
    name: 'A100 80GB',
    description: 'Enterprise-grade computing for the most demanding workloads.',
    specs: {
      gpu: 'NVIDIA A100',
      gpuMemory: '80GB HBM2e',
      vCPUs: '24 cores',
      ram: '256GB',
      storage: '1TB NVMe',
      network: '100 Gbps'
    },
    pricing: {
      spot: '$2.20/hour',
      onDemand: '$3.50/hour'
    },
    performanceRatio: '9.8/10',
    idealFor: ['Large Language Models', 'Enterprise Workloads', 'Multi-GPU Training'],
    icon: '/icons/gpu-enterprise.svg'
  },
  {
    name: 'H100 80GB',
    description: 'Ultimate performance for cutting-edge AI applications.',
    specs: {
      gpu: 'NVIDIA H100',
      gpuMemory: '80GB HBM3',
      vCPUs: '32 cores',
      ram: '512GB',
      storage: '2TB NVMe',
      network: '200 Gbps'
    },
    pricing: {
      spot: '$3.50/hour',
      onDemand: '$5.00/hour'
    },
    performanceRatio: '10/10',
    idealFor: ['Next-Gen AI', 'Transformer Models', 'Research & Development'],
    icon: '/icons/gpu-ultimate.svg'
  }
];

// Generate more sample apps for testing infinite scroll
const generateMoreApps = (baseApps: App[], count: number): App[] => {
  const result: App[] = [...baseApps];
  for (let i = 1; i <= count; i++) {
    baseApps.forEach((baseApp) => {
      result.push({
        ...baseApp,
        id: `${baseApp.id}-${i}`,
        name: `${baseApp.name} ${i}`,
        deployCount: `${parseInt(baseApp.deployCount) + i * 100}+`
      });
    });
  }
  return result;
};

// Modify appCategories to include more apps
const appCategories: CategorySection[] = [
  {
    title: "Image Generation",
    description: "Create stunning images with state-of-the-art AI models",
    apps: generateMoreApps([
      {
        id: 'sd-webui',
        name: 'Stable Diffusion WebUI',
        description: 'The most popular Stable Diffusion interface. Comprehensive features for image generation, inpainting, outpainting, and more.',
        icon: '/apps/sd-webui.png',
        category: 'IMAGE',
        status: 'STABLE',
        deployCount: '2.5k+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['T4', 'L4', 'A40'],
        githubStars: '110k+',
        pricing: 'Free'
      },
      {
        id: 'comfyui',
        name: 'ComfyUI',
        description: 'Node-based interface for Stable Diffusion with powerful workflow customization. Perfect for advanced users and developers.',
        icon: '/apps/comfyui.png',
        category: 'IMAGE',
        status: 'STABLE',
        deployCount: '1.8k+',
        usability: 'ADVANCED',
        recommendedGpu: ['L4', 'A40', 'A100'],
        githubStars: '24k+',
        pricing: 'Free'
      },
      {
        id: 'foocus',
        name: 'Fooocus',
        description: 'Streamlined Stable Diffusion interface focused on simplicity and quality. Perfect for beginners.',
        icon: '/apps/fooocus.png',
        category: 'IMAGE',
        status: 'NEW',
        deployCount: '750+',
        usability: 'BEGINNER',
        recommendedGpu: ['T4', 'L4'],
        githubStars: '15k+',
        pricing: 'Free'
      },
      {
        id: 'invokeai',
        name: 'InvokeAI',
        description: 'Professional-grade image generation suite with advanced features and Unity integration.',
        icon: '/apps/invokeai.png',
        category: 'IMAGE',
        status: 'STABLE',
        deployCount: '1.2k+',
        usability: 'PRO',
        recommendedGpu: ['A40', 'A100', 'H100'],
        githubStars: '18k+',
        pricing: 'Free'
      }
    ], 3)
  },
  {
    title: "Video & Animation",
    description: "Transform images into stunning videos and animations",
    apps: generateMoreApps([
      {
        id: 'animateanyone',
        name: 'AnimateAnyone',
        description: 'Create stunning animations from single images with advanced AI technology.',
        icon: '/icons/animate.svg',
        category: 'VIDEO',
        status: 'NEW',
        deployCount: '500+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['A40', 'A100'],
        githubStars: '8k+',
        pricing: 'Free'
      },
      {
        id: 'svd',
        name: 'Stable Video',
        description: 'Transform still images into fluid videos with state-of-the-art diffusion models.',
        icon: '/icons/svd.svg',
        category: 'VIDEO',
        status: 'BETA',
        deployCount: '300+',
        usability: 'ADVANCED',
        recommendedGpu: ['A40', 'A100', 'H100'],
        githubStars: '5k+',
        pricing: 'Free'
      },
      {
        id: 'deforum',
        name: 'Deforum',
        description: 'Create complex animations and videos with advanced scripting and keyframe control.',
        icon: '/icons/deforum.svg',
        category: 'VIDEO',
        status: 'STABLE',
        deployCount: '900+',
        usability: 'PRO',
        recommendedGpu: ['A40', 'A100'],
        githubStars: '12k+',
        pricing: 'Free'
      },
      {
        id: 'ebsynth',
        name: 'EbSynth',
        description: 'Style transfer and temporal consistency for video processing.',
        icon: '/icons/ebsynth.svg',
        category: 'VIDEO',
        status: 'NEW',
        deployCount: '200+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['L4', 'A40'],
        githubStars: '3k+',
        pricing: 'Free'
      }
    ], 3)
  },
  {
    title: "AI Models & Training",
    description: "Train and fine-tune custom AI models",
    apps: generateMoreApps([
      {
        id: 'kohya_ss',
        name: 'Kohya_ss',
        description: 'Advanced LoRA training interface with support for multiple training methods and architectures.',
        icon: '/icons/kohya.svg',
        category: 'AI',
        status: 'STABLE',
        deployCount: '1.5k+',
        usability: 'ADVANCED',
        recommendedGpu: ['A40', 'A100', 'H100'],
        githubStars: '15k+',
        pricing: 'Free'
      },
      {
        id: 'dreambooth',
        name: 'DreamBooth',
        description: 'Fine-tune Stable Diffusion models with personalized generation for custom images and styles.',
        icon: '/icons/dream.svg',
        category: 'AI',
        status: 'STABLE',
        deployCount: '2k+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['A40', 'A100'],
        githubStars: '10k+',
        pricing: 'Free'
      },
      {
        id: 'llama',
        name: 'LLaMA',
        description: 'Run powerful language models locally with optimized inference and fine-tuning capabilities.',
        icon: '/icons/llama.svg',
        category: 'AI',
        status: 'NEW',
        deployCount: '800+',
        usability: 'PRO',
        recommendedGpu: ['A100', 'H100'],
        githubStars: '45k+',
        pricing: 'Free'
      },
      {
        id: 'textgen',
        name: 'TextGen',
        description: 'Advanced text generation interface supporting multiple models and architectures.',
        icon: '/icons/textgen.svg',
        category: 'AI',
        status: 'STABLE',
        deployCount: '1.1k+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['L4', 'A40', 'A100'],
        githubStars: '8k+',
        pricing: 'Free'
      }
    ], 3)
  },
  {
    title: "Audio & Voice",
    description: "Process and generate audio with AI",
    apps: generateMoreApps([
      {
        id: 'rvc',
        name: 'RVC',
        description: 'RVC is an advanced voice cloning system based on VITS, designed to provide a convenient voice changing experience.',
        icon: '/icons/rvc.svg',
        category: 'AUDIO',
        status: 'STABLE',
        deployCount: '1.2k+',
        usability: 'INTERMEDIATE',
        recommendedGpu: ['T4', 'L4'],
        githubStars: '12k+',
        pricing: 'Free'
      },
      {
        id: 'audiocraft',
        name: 'AudioCraft',
        description: 'Generate high-quality music and sound effects using state-of-the-art AI models.',
        icon: '/icons/audiocraft.svg',
        category: 'AUDIO',
        status: 'NEW',
        deployCount: '400+',
        usability: 'BEGINNER',
        recommendedGpu: ['T4', 'L4'],
        githubStars: '16k+',
        pricing: 'Free'
      },
      {
        id: 'bark',
        name: 'Bark',
        description: 'Text-to-speech generation with emotional and multilingual support.',
        icon: '/icons/bark.svg',
        category: 'AUDIO',
        status: 'BETA',
        deployCount: '600+',
        usability: 'BEGINNER',
        recommendedGpu: ['T4', 'L4'],
        githubStars: '25k+',
        pricing: 'Free'
      },
      {
        id: 'whisper',
        name: 'Whisper',
        description: 'State-of-the-art speech recognition and transcription with multiple language support.',
        icon: '/icons/whisper.svg',
        category: 'AUDIO',
        status: 'STABLE',
        deployCount: '1.5k+',
        usability: 'BEGINNER',
        recommendedGpu: ['T4', 'L4'],
        githubStars: '50k+',
        pricing: 'Free'
      }
    ], 3)
  }
];

const APPS_PER_PAGE = 4; // Number of apps to show initially and load each time

const UsabilityBadge = ({ level }: { level: UsabilityLevel }) => {
  const colors = {
    BEGINNER: 'bg-green-500/10 text-green-500',
    INTERMEDIATE: 'bg-blue-500/10 text-blue-500',
    ADVANCED: 'bg-purple-500/10 text-purple-500',
    PRO: 'bg-red-500/10 text-red-500'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
      {level.charAt(0) + level.slice(1).toLowerCase()}
    </span>
  );
};

const GpuBadge = ({ type }: { type: GpuType }) => {
  const colors = {
    T4: 'bg-emerald-500/10 text-emerald-500',
    L4: 'bg-blue-500/10 text-blue-500',
    A40: 'bg-purple-500/10 text-purple-500',
    A100: 'bg-red-500/10 text-red-500',
    H100: 'bg-orange-500/10 text-orange-500'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
      {type}
    </span>
  );
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [visibleApps, setVisibleApps] = useState<{ [key: string]: number }>({});
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Increased margin to trigger earlier
  });

  // Initialize visible apps count for each category
  useEffect(() => {
    const initial = appCategories.reduce((acc, category) => {
      acc[category.title] = APPS_PER_PAGE;
      return acc;
    }, {} as { [key: string]: number });
    setVisibleApps(initial);
  }, []);

  // Load more apps when scrolling
  useEffect(() => {
    if (inView) {
      console.log('Loading more apps...'); // Debug log
      setVisibleApps(prev => {
        const updated = { ...prev };
        let hasMore = false;
        appCategories.forEach(category => {
          if (updated[category.title] < category.apps.length) {
            updated[category.title] = Math.min(
              updated[category.title] + APPS_PER_PAGE,
              category.apps.length
            );
            hasMore = true;
          }
        });
        return hasMore ? updated : prev;
      });
    }
  }, [inView]);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
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

      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Globe />
            </div>
        <div className="relative z-10 text-center px-4">
          <div className="inline-block bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <p className="text-white flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              <span>ALL SYSTEMS OPERATIONAL</span>
            </p>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Deploy Your Apps Globally<br />with Zero Infrastructure
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            The most developer-friendly platform for deploying and scaling
            applications worldwide. No ops, no servers, just pure development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#1cfeba] hover:bg-[#1cfeba]/90 text-black px-8 py-3 rounded-lg font-medium text-lg transition-colors duration-200">
              Get Started Free
            </button>
            <button className="border border-white/20 hover:bg-white/10 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors duration-200">
              View Documentation
            </button>
      </div>
        </div>
      </div>

      {/* Apps Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0">
          {/* Main Grid */}
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

          {/* Categories */}
          {appCategories.map((category, index) => (
            <div key={index} className="mb-20 last:mb-0">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                <p className="text-gray-400">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.apps.slice(0, visibleApps[category.title] || APPS_PER_PAGE).map((app) => (
                  <div
                    key={app.id}
                    className="group relative bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transition-all duration-300
                      hover:border-[#1cfeba]/50 hover:shadow-[0_0_30px_rgba(28,254,186,0.1)] hover:-translate-y-1"
                  >
                    {/* App Header */}
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-xl font-bold group-hover:text-[#1cfeba] transition-colors">
                        {app.name}
                      </h3>
                    </div>

                    {/* GitHub Stats & Pricing */}
                    <div className="flex items-center space-x-3 mb-4">
                      {app.githubStars && (
                        <span className="text-sm text-gray-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .25a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.2-1.8-1.2-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.2 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.7.2 2.9.1 3.2.7.8 1.1 1.8 1.1 3.1 0 4.5-2.8 5.5-5.4 5.8.4.3.7.9.7 1.9v2.8c0 .3.2.7.8.6A12 12 0 0 0 12 .25z"/>
                          </svg>
                          {app.githubStars}
                        </span>
                      )}
                      {app.pricing && (
                        <span className="text-sm text-gray-400">
                          {app.pricing}
                        </span>
                      )}
                    </div>

                    {/* App Description */}
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                      {app.description}
                    </p>

                    {/* Tags Section */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500`}>
                        {app.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'BETA' ? 'bg-yellow-500/10 text-yellow-500' : 
                        app.status === 'NEW' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {app.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.usability === 'BEGINNER' ? 'bg-green-500/10 text-green-500' :
                        app.usability === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-500' :
                        app.usability === 'ADVANCED' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {app.usability.charAt(0) + app.usability.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* GPU Requirements */}
                    <div className="mb-6">
                      <p className="text-xs text-gray-500 mb-2">Works best on:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.recommendedGpu.map((gpu) => (
                          <span
                            key={gpu}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              gpu === 'T4' ? 'bg-emerald-500/10 text-emerald-500' :
                              gpu === 'L4' ? 'bg-blue-500/10 text-blue-500' :
                              gpu === 'A40' ? 'bg-purple-500/10 text-purple-500' :
                              gpu === 'A100' ? 'bg-red-500/10 text-red-500' :
                              'bg-orange-500/10 text-orange-500'
                            }`}
                          >
                            {gpu}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {app.deployCount} deployments
                      </span>
                      <button className="px-6 py-2 rounded-lg bg-[#1cfeba] text-black text-sm font-medium 
                        hover:bg-[#1cfeba]/90 transition-all duration-200">
                        Launch
                      </button>
                    </div>

                    {/* Hover Gradient */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1cfeba]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ))}
              </div>

              {/* Loading indicator */}
              {visibleApps[category.title] < category.apps.length && (
                <div className="flex justify-center mt-8">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animation-delay-400"></div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Intersection Observer Target */}
          <div ref={loadMoreRef} className="h-20 -mt-10" />

          {/* View All Link */}
          <div className="text-center mt-12">
            <Link href="/apps" className="inline-flex items-center space-x-2 text-[#1cfeba] hover:text-[#1cfeba]/80 transition-colors">
              <span>View all applications</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
              <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/HARDWARE</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Enterprise-Grade GPU Infrastructure
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose from our range of NVIDIA GPUs optimized for every workload, from development to production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gpuServers.map((server) => (
              <div
                key={server.name}
                className="group relative bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transition-all duration-300
                  hover:border-[#1cfeba]/50 hover:shadow-[0_0_30px_rgba(28,254,186,0.1)] hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#1cfeba] transition-colors">
                    {server.name}
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-[#1cfeba]/10 text-[#1cfeba] text-sm">
                    {server.performanceRatio}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                  {server.description}
                </p>

                {/* Specs */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GPU Memory</span>
                    <span className="text-white">{server.specs.gpuMemory}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">vCPUs</span>
                    <span className="text-white">{server.specs.vCPUs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">RAM</span>
                    <span className="text-white">{server.specs.ram}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Storage</span>
                    <span className="text-white">{server.specs.storage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Network</span>
                    <span className="text-white">{server.specs.network}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Spot Price</span>
                    <span className="text-[#1cfeba] font-bold">{server.pricing.spot}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">On-Demand</span>
                    <span className="text-white font-bold">{server.pricing.onDemand}</span>
                  </div>
                </div>

                {/* Ideal Use Cases */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {server.idealFor.map((use) => (
                    <span
                      key={use}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300"
                    >
                      {use}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full px-4 py-2 rounded-lg bg-[#1cfeba] text-black text-sm font-medium 
                  hover:bg-[#1cfeba]/90 transition-all duration-200">
                  Deploy Now
                </button>

                {/* Hover Gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1cfeba]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* World Map Section */}
      <WorldMap />

      {/* New Enhanced Features Section */}
      <Features />

      {/* Testimonials Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
              <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/TESTIMONIALS</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Trusted by Developers Worldwide
            </h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a]">
                <div className="h-32 flex items-start">
                  <p className="text-gray-300 text-lg italic">"{testimonial.quote}"</p>
                </div>
                <div className="mt-8 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Image
                        src={testimonial.company}
                        alt={testimonial.author}
                        width={32}
                        height={32}
                        className="opacity-75"
                      />
              </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-medium">{testimonial.author}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Pricing Section */}
      <section className="py-24 bg-[#0f0f0f] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1cfeba]/5 to-transparent opacity-20" />
        
        {/* Background Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(28,254,186,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(28,254,186,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
              <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/PRICING</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Choose Your Computing Power
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Scalable infrastructure that grows with your needs. Pay only for what you use.
            </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`
                  relative group perspective-1000 
                  ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}
                `}
              >
                <div className={`
                  relative z-10 bg-[#1a1a1a] rounded-xl p-8 h-full
                  transition-all duration-500 ease-out preserve-3d
                  border ${plan.popular ? 'border-[#1cfeba]' : 'border-[#2a2a2a]'}
                  group-hover:rotate-y-3 group-hover:rotate-x-3 group-hover:scale-105
                  group-hover:shadow-[0_0_40px_rgba(28,254,186,0.1)]
                `}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-[#1cfeba] text-black px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-gray-400 ml-2">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center justify-between">
                        <span className="text-gray-400">{feature.name}</span>
                        <span className={feature.highlight ? 'text-[#1cfeba] font-medium' : 'text-white'}>
                          {feature.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                      ${plan.popular 
                        ? 'bg-[#1cfeba] text-black hover:bg-[#1cfeba]/90' 
                        : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'}
                    `}
                  >
                    {plan.ctaText}
                  </button>
                </div>

                {/* 3D Shadow Effect */}
                <div className="absolute inset-0 bg-[#1cfeba]/5 rounded-xl transform translate-z-20 group-hover:translate-z-40 transition-transform duration-500 blur-xl opacity-0 group-hover:opacity-100" />
              </div>
            ))}
            </div>

          {/* Enterprise Contact */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4">Need a custom solution?</p>
            <Link
              href="/enterprise"
              className="text-[#1cfeba] hover:text-[#1cfeba]/80 font-medium transition-colors"
            >
              Contact us for enterprise pricing →
            </Link>
                </div>
              </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
              <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/FAQ</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to know about ComfyUI Cloud. Can't find the answer you're looking for? Reach out to our support team.
            </p>
                    </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2a2a2a] transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`px-6 transition-all duration-200 ease-in-out ${
                    openFaq === index ? 'py-4' : 'py-0 h-0'
                  }`}
                >
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1cfeba]/10 to-purple-500/10 opacity-20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of developers who are already building the future with ComfyUI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
                className="bg-[#1cfeba] hover:bg-[#1cfeba]/90 text-black px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200 hover:scale-105"
              >
                Start Building Now
              </Link>
              <Link
                href="/contact"
                className="border border-[#1cfeba]/20 hover:border-[#1cfeba]/40 text-white px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200"
              >
                Contact Sales
          </Link>
        </div>
      </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block">
                <Image
                  src="/logos/comfyui-logo.svg"
                  alt="ComfyUI"
                  width={120}
                  height={32}
                  className="mb-6"
                />
              </Link>
              <p className="text-gray-400 text-sm">
                Deploy and scale your applications globally with zero infrastructure management.
              </p>
            </div>
            
            <div>
              <h3 className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
                <li><Link href="/enterprise" className="text-gray-400 hover:text-white transition-colors">Enterprise</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider mb-4">Developers</h3>
              <ul className="space-y-3">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
                <li><Link href="/changelog" className="text-gray-400 hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/compliance" className="text-gray-400 hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 ComfyUI. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link href="https://twitter.com/comfyui" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="https://github.com/comfyui" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.708.069-.708 1.003.07 1.7 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.2 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.7.2 2.9.1 3.2.7.8 1.1 1.8 1.1 3.1 0 4.5-2.8 5.5-5.4 5.8.4.3.7.9.7 1.9v2.8c0 .3.2.7.8.6A12 12 0 0 0 12 .25z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="https://discord.gg/comfyui" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 00-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
