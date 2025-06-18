'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon?: JSX.Element;
}

const navItems: NavItem[] = [
  {
    label: 'About',
    href: '/about',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    label: 'Apps',
    href: '/apps',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    label: 'Pricing',
    href: '/pricing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    label: 'Docs',
    href: '/docs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    )
  }
];

interface AppDetails {
  id: string;
  name: string;
  description: string;
  stars: number;
  type: string;
  level: string;
  gpuSupport: string[];
  deployments: string;
  tags: Array<{
    text: string;
    color: string;
  }>;
}

const appTemplates: AppDetails[] = [
  {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'Node-based interface for Stable Diffusion with powerful workflow capabilities',
    stars: 24000,
    type: 'Free',
    level: 'Advanced',
    gpuSupport: ['L4', 'A40', 'A100'],
    deployments: '1.8k+ deployments',
    tags: [
      { text: 'IMAGE', color: 'text-emerald-400 bg-emerald-400/10' },
      { text: 'STABLE', color: 'text-emerald-400 bg-emerald-400/10' },
      { text: 'Advanced', color: 'text-purple-400 bg-purple-400/10' }
    ]
  },
  {
    id: 'sd-webui',
    name: 'Stable Diffusion WebUI',
    description: 'The most popular Stable Diffusion interface. Comprehensive features for image generation',
    stars: 110000,
    type: 'Free',
    level: 'Intermediate',
    gpuSupport: ['T4', 'L4', 'A40'],
    deployments: '2.5k+ deployments',
    tags: [
      { text: 'IMAGE', color: 'text-emerald-400 bg-emerald-400/10' },
      { text: 'STABLE', color: 'text-emerald-400 bg-emerald-400/10' },
      { text: 'Intermediate', color: 'text-blue-400 bg-blue-400/10' }
    ]
  }
];

interface GPUTier {
  name: string;
  color: string;
  description: string;
}

const gpuTiers: Record<string, GPUTier> = {
  basic: {
    name: 'Basic',
    color: 'text-blue-400',
    description: 'Perfect for testing and development'
  },
  medium: {
    name: 'Medium',
    color: 'text-emerald-400',
    description: 'Balanced performance for production'
  },
  pro: {
    name: 'Pro',
    color: 'text-purple-400',
    description: 'High-performance computing'
  },
  ultra: {
    name: 'Ultra',
    color: 'text-amber-400',
    description: 'Maximum performance for any workload'
  }
};

interface GPUOption {
  id: string;
  name: string;
  tier: string;
  memory: string;
  ram: string;
  price: string;
  bargainPrice: string;
  performance: {
    imageGen: number; // Images per minute
    videoGen: number; // Seconds of video per minute
  };
  vram: string;
  architecture: string;
  shared: boolean;
  icon: JSX.Element;
}

interface StorageOption {
  id: string;
  size: string;
  type: string;
  price: string;
  speed: {
    read: string;
    write: string;
  };
  icon: JSX.Element;
}

const gpuOptions: GPUOption[] = [
  {
    id: 't4',
    name: 'NVIDIA T4',
    tier: 'basic',
    memory: '16GB',
    ram: '16GB',
    price: '$0.35/hr',
    bargainPrice: '$0.25/hr',
    performance: {
      imageGen: 30,
      videoGen: 15,
    },
    vram: '16GB GDDR6',
    architecture: 'Turing',
    shared: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'l4',
    name: 'NVIDIA L4',
    tier: 'medium',
    memory: '24GB',
    ram: '32GB',
    price: '$0.80/hr',
    bargainPrice: '$0.49/hr',
    performance: {
      imageGen: 45,
      videoGen: 25,
    },
    vram: '24GB GDDR6',
    architecture: 'Ada Lovelace',
    shared: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    id: 'a10g',
    name: 'NVIDIA A10G',
    tier: 'pro',
    memory: '24GB',
    ram: '64GB',
    price: '$1.20/hr',
    bargainPrice: '$0.75/hr',
    performance: {
      imageGen: 80,
      videoGen: 40,
    },
    vram: '24GB GDDR6X',
    architecture: 'Ampere',
    shared: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    id: 'a100-40g',
    name: 'NVIDIA A100',
    tier: 'pro',
    memory: '40GB',
    ram: '96GB',
    price: '$2.50/hr',
    bargainPrice: '$1.19/hr',
    performance: {
      imageGen: 120,
      videoGen: 60,
    },
    vram: '40GB HBM2e',
    architecture: 'Ampere',
    shared: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    id: 'a100-80g',
    name: 'NVIDIA A100',
    tier: 'ultra',
    memory: '80GB',
    ram: '128GB',
    price: '$3.50/hr',
    bargainPrice: '$1.99/hr',
    performance: {
      imageGen: 150,
      videoGen: 75,
    },
    vram: '80GB HBM2e',
    architecture: 'Ampere',
    shared: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    id: 'h100',
    name: 'NVIDIA H100',
    tier: 'ultra',
    memory: '80GB',
    ram: '256GB',
    price: '$4.00/hr',
    bargainPrice: '$2.99/hr',
    performance: {
      imageGen: 180,
      videoGen: 90,
    },
    vram: '80GB HBM3',
    architecture: 'Hopper',
    shared: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  }
];

const storageOptions: StorageOption[] = [
  {
    id: 'basic',
    size: '20GB',
    type: 'NVMe SSD',
    price: '$2/month',
    speed: {
      read: '3,000 MB/s',
      write: '1,500 MB/s'
    },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  {
    id: 'pro',
    size: '100GB',
    type: 'NVMe SSD',
    price: '$8/month',
    speed: {
      read: '5,000 MB/s',
      write: '2,500 MB/s'
    },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="7" y1="8" x2="17" y2="8" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
    )
  },
  {
    id: 'enterprise',
    size: '500GB',
    type: 'NVMe SSD',
    price: '$35/month',
    speed: {
      read: '7,000 MB/s',
      write: '5,000 MB/s'
    },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  }
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  })
};

// Add pricing calculation helper
const calculateTotalPrice = (gpu: GPUOption, storage: StorageOption) => {
  const gpuPrice = parseFloat(gpu.price.replace('$', ''));
  const storagePrice = parseFloat(storage.price.replace('$', '').replace('/month', ''));
  return {
    hourly: gpuPrice,
    monthly: (gpuPrice * 24 * 30) + storagePrice
  };
};

export default function LaunchWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<AppDetails | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [selectedGPU, setSelectedGPU] = useState<GPUOption | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [runtime, setRuntime] = useState({ hours: 0, minutes: 30 });
  const generateRandomString = () => Math.random().toString(36).substring(7);
  const [instanceId] = useState(generateRandomString());

  // Template selection section
  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-emerald-400">Choose Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appTemplates.map((template) => (
          <motion.div
            key={template.id}
            className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
              selectedTemplate?.id === template.id
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#2a2a2a] hover:border-emerald-500/50 bg-[#1a1a1a]'
            }`}
            onClick={() => setSelectedTemplate(template)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{template.name}</h3>
                <p className="text-gray-400 text-sm">{template.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">⭐</span>
                <span className="text-gray-400">{template.stars.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {template.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-md text-xs font-medium ${tag.color}`}
                >
                  {tag.text}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Works best on:</span>
                <div className="flex space-x-1">
                  {template.gpuSupport.map((gpu) => (
                    <span
                      key={gpu}
                      className="px-2 py-0.5 rounded bg-[#2a2a2a] text-gray-300"
                    >
                      {gpu}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-gray-400">{template.deployments}</span>
            </div>

            {selectedTemplate?.id === template.id && (
              <motion.div
                className="absolute -top-px -bottom-px left-0 w-1 bg-emerald-500"
                layoutId="selectedIndicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Add name validation
  const validateInstanceName = (name: string) => {
    if (name.length < 3) {
      setNameError('Instance name must be at least 3 characters long');
      return false;
    }
    if (name.length > 20) {
      setNameError('Instance name must be less than 20 characters');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      setNameError('Instance name can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setError(null);

    try {
      const response = await api.spinContainer({
        userId: 'demo', // You should get this from your auth context
        password: '', // You should get this from your auth context
        instanceName,
        gpu: selectedGPU?.id,
        storage: selectedStorage?.id,
        template: selectedTemplate?.id
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch instance');
    } finally {
      setIsLaunching(false);
    }
  };

  const steps = [
    { number: 1, title: 'Choose Template' },
    { number: 2, title: 'Instance Details' },
    { number: 3, title: 'Select GPU' },
    { number: 4, title: 'Storage Options' },
    { number: 5, title: 'Review & Launch' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 7H7v6h6V7z" />
                    <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xl font-bold">ComfyUI</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button className="px-4 py-2 rounded-lg bg-emerald-400 text-black font-medium hover:bg-emerald-500 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold text-emerald-400">
                Launch New Instance
              </h1>
              <p className="text-gray-400 mt-2">Configure and deploy your AI application</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center space-x-2 border border-[#2a2a2a]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Dashboard</span>
            </motion.button>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  custom={index}
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <div className={`flex flex-col items-center ${index !== 0 && 'ml-4'}`}>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.number === currentStep
                          ? 'bg-emerald-400 text-black'
                          : step.number < currentStep
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </motion.div>
                    <span className={`text-sm mt-2 ${
                      step.number === currentStep ? 'text-emerald-400' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-4 ${
                      step.number < currentStep ? 'bg-emerald-400' : 'bg-[#2a2a2a]'
                    }`} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="bg-[#1a1a1a] rounded-xl p-8 border border-[#2a2a2a]"
          >
            {currentStep === 1 && renderTemplateSelection()}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-emerald-400">Instance Details</h2>
                    <p className="text-gray-400 mt-1">Configure your instance settings</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Instance names must be unique within your account</span>
                  </div>
                </div>

                <div className="space-y-8 max-w-3xl">
                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
                    <h3 className="text-lg font-medium text-white mb-4">Basic Configuration</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Instance Name
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={instanceName}
                            onChange={(e) => {
                              setInstanceName(e.target.value);
                              validateInstanceName(e.target.value);
                            }}
                            placeholder="e.g., my-comfy-instance"
                            className={`w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border ${
                              nameError ? 'border-red-500' : 'border-[#3a3a3a]'
                            } focus:border-emerald-400 text-white transition-all duration-300`}
                          />
                          {nameError && (
                            <p className="text-red-500 text-sm">{nameError}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Runtime Duration
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={runtime.hours}
                              onChange={(e) => setRuntime({ ...runtime, hours: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] focus:border-emerald-400 text-white"
                            />
                            <p className="text-sm text-gray-500 mt-1">Hours</p>
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={runtime.minutes}
                              onChange={(e) => setRuntime({ ...runtime, minutes: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] focus:border-emerald-400 text-white"
                            />
                            <p className="text-sm text-gray-500 mt-1">Minutes</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Set how long you want your instance to run. It will automatically stop after this duration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
                    <h3 className="text-lg font-medium text-white mb-4">Naming Guidelines</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">Requirements</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>3-20 characters long</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Lowercase letters, numbers, hyphens</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Must start with a letter</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Restrictions</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>No uppercase letters</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>No special characters except hyphens</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>No reserved terms (admin, root, etc.)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
                    <h3 className="text-lg font-medium text-white mb-4">Instance URL Preview</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#2a2a2a] rounded-lg">
                        <p className="font-mono text-sm text-emerald-400">
                          https://comfyui.com/{instanceName || 'your-instance-name'}/apps/{instanceId}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">
                        This is the URL where your instance will be accessible after launch. The URL includes a unique identifier for security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-emerald-400">Select GPU</h2>
                    <p className="text-gray-400 mt-1">Choose the GPU that best fits your needs</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Performance metrics based on 60-second intervals</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gpuOptions.map((gpu, index) => (
                    <motion.div
                      key={gpu.id}
                      custom={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedGPU(gpu)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedGPU?.id === gpu.id
                          ? 'border-emerald-400 bg-emerald-400/5'
                          : 'border-[#2a2a2a] hover:border-emerald-400/50'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${gpuTiers[gpu.tier].color} bg-opacity-10 mb-2`}>
                              {gpuTiers[gpu.tier].name}
                            </span>
                            <h3 className="text-xl font-medium">{gpu.name}</h3>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            selectedGPU?.id === gpu.id ? 'bg-emerald-400/10' : 'bg-[#2a2a2a]'
                          }`}>
                            {gpu.icon}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">VRAM</span>
                              <span className="text-white">{gpu.memory}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">System RAM</span>
                              <span className="text-white">{gpu.ram}</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#2a2a2a]">
                            <div className="text-sm font-medium text-white mb-2">Performance</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Image Generation:</span>
                                <span className="text-emerald-400">{gpu.performance.imageGen}/min</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Video Generation:</span>
                                <span className="text-emerald-400">{gpu.performance.videoGen}s/min</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#2a2a2a]">
                            <div className="text-sm font-medium text-white mb-2">Specifications</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Architecture:</span>
                                <span className="text-blue-400">{gpu.architecture}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Memory Type:</span>
                                <span className="text-blue-400">{gpu.vram}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#2a2a2a]">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xs text-gray-400">Regular Price</div>
                                <div className="text-lg font-medium text-white">{gpu.price}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-emerald-400">Bargain Price</div>
                                <div className="text-lg font-medium text-emerald-400">{gpu.bargainPrice}</div>
                              </div>
                            </div>
                            {gpu.shared && (
                              <div className="mt-2 flex items-center space-x-1 text-xs text-amber-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                <span>Shared Resource</span>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500">
                            {gpuTiers[gpu.tier].description}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
                  <h3 className="text-lg font-medium text-white mb-4">Understanding GPU Tiers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(gpuTiers).map(([key, tier]) => (
                      <div key={key} className="space-y-2">
                        <div className={`text-sm font-medium ${tier.color}`}>{tier.name}</div>
                        <p className="text-sm text-gray-400">{tier.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                    Storage Options
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>All storage options use high-performance NVMe SSDs</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {storageOptions.map((storage, index) => (
                    <motion.div
                      key={storage.id}
                      custom={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedStorage(storage)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedStorage?.id === storage.id
                          ? 'border-emerald-400 bg-emerald-400/5'
                          : 'border-[#2a2a2a] hover:border-emerald-400/50'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-xl mb-4 ${
                          selectedStorage?.id === storage.id ? 'bg-emerald-400/10' : 'bg-[#2a2a2a]'
                        }`}>
                          {storage.icon}
                        </div>
                        <h3 className="text-xl font-medium">{storage.size}</h3>
                        <p className="text-gray-400 text-sm mt-1">{storage.type}</p>
                        <p className="text-emerald-400 font-medium mt-2">{storage.price}</p>
                        
                        <div className="mt-4 pt-4 border-t border-[#2a2a2a] w-full">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Read Speed:</span>
                              <span className="text-emerald-400">{storage.speed.read}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Write Speed:</span>
                              <span className="text-emerald-400">{storage.speed.write}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-emerald-400">Review & Launch</h2>
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
                    <h3 className="text-lg font-medium text-white mb-6">Configuration Summary</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-4">Instance Details</h4>
                          <dl className="space-y-4">
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Application</dt>
                              <dd className="text-white">{selectedTemplate?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Instance Name</dt>
                              <dd className="text-white font-mono">{instanceName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">URL</dt>
                              <dd className="text-emerald-400 font-mono">comfyui.run/{instanceName}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-4">Resources</h4>
                          <dl className="space-y-4">
                            <div className="flex justify-between">
                              <dt className="text-gray-400">GPU</dt>
                              <dd className="text-white">{selectedGPU?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Memory</dt>
                              <dd className="text-white">{selectedGPU?.memory}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Storage</dt>
                              <dd className="text-white">{selectedStorage?.size}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#2a2a2a]">
                        <h4 className="text-sm font-medium text-gray-400 mb-4">Estimated Costs</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-4 rounded-lg bg-[#2a2a2a]">
                            <div className="text-sm text-gray-400 mb-1">Hourly Rate</div>
                            <div className="text-2xl font-semibold text-emerald-400">
                              ${calculateTotalPrice(
                                selectedGPU!,
                                selectedStorage!
                              ).hourly.toFixed(2)}/hr
                            </div>
                            <div className="text-xs text-gray-500 mt-1">GPU costs only</div>
                          </div>
                          
                          <div className="p-4 rounded-lg bg-[#2a2a2a]">
                            <div className="text-sm text-gray-400 mb-1">Monthly Estimate</div>
                            <div className="text-2xl font-semibold text-emerald-400">
                              ${calculateTotalPrice(
                                selectedGPU!,
                                selectedStorage!
                              ).monthly.toFixed(2)}/mo
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Includes storage and 24/7 usage</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="bg-emerald-400/10 border border-emerald-400/20 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400">Important Information</h4>
                        <ul className="mt-2 text-sm text-gray-400 space-y-1">
                          <li>• Your instance will be ready in approximately 2-3 minutes</li>
                          <li>• You will be billed only for the time your instance is running</li>
                          <li>• You can stop the instance at any time from the dashboard</li>
                          <li>• Storage charges continue even when the instance is stopped</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="px-6 py-3 rounded-lg border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentStep === 1}
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentStep === 5) {
                    handleLaunch();
                  } else {
                    setCurrentStep(prev => Math.min(5, prev + 1));
                  }
                }}
                disabled={
                  (currentStep === 1 && !selectedTemplate) ||
                  (currentStep === 2 && !instanceName) ||
                  (currentStep === 3 && !selectedGPU) ||
                  (currentStep === 4 && !selectedStorage) ||
                  isLaunching
                }
                className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  currentStep === 5
                    ? 'bg-emerald-400 text-black hover:bg-emerald-500'
                    : 'bg-emerald-400 text-black hover:bg-emerald-500'
                }`}
              >
                {isLaunching ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Launching...</span>
                  </>
                ) : (
                  <span>{currentStep === 5 ? 'Launch' : 'Next'}</span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
} 