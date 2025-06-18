'use client';

import { motion } from 'framer-motion';
import React from 'react';
import {
  Activity,
  Search,
  Star,
  Clock,
  Sparkles,
  Image,
  Code,
  Cpu,
  Zap,
  BarChart2,
  Heart,
  TrendingUp,
  MessageSquare,
  Video,
  Layers,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface AppCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rating: number;
  usageCount: number;
  tags: string[];
  gpuOptions: {
    min: string;
    recommended: string;
  };
  pricing: {
    startingAt: number;
    unit: string;
  };
}

interface PerformanceCombo {
  name: string;
  description: string;
  gpu: string;
  ram: string;
  vcpu: number;
  price: number;
  type: 'performance' | 'value' | 'beginner';
  icon: string;
}

const categories = [
  { id: 'all', name: 'All Apps', icon: Layers },
  { id: 'image', name: 'Image Generation', icon: Image },
  { id: 'video', name: 'Video Generation', icon: Video },
  { id: 'code', name: 'Code Generation', icon: Code },
  { id: 'analytics', name: 'Analytics', icon: BarChart2 },
];

const apps: AppCard[] = [
  {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'Node-based UI for Stable Diffusion with powerful customization options',
    icon: '🎨',
    category: 'image',
    rating: 4.8,
    usageCount: 12500,
    tags: ['Image Generation', 'Node-based', 'Stable Diffusion'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.50,
      unit: 'hour'
    }
  },
  {
    id: 'sdwebui',
    name: 'Stable Diffusion WebUI',
    description: 'Popular interface for Stable Diffusion with extensive features',
    icon: '🖼️',
    category: 'image',
    rating: 4.9,
    usageCount: 15000,
    tags: ['Image Generation', 'User-friendly', 'Stable Diffusion'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A100'
    },
    pricing: {
      startingAt: 0.45,
      unit: 'hour'
    }
  },
  {
    id: 'invokeai',
    name: 'InvokeAI',
    description: 'Advanced AI image generation with unique creative tools',
    icon: '✨',
    category: 'image',
    rating: 4.7,
    usageCount: 8000,
    tags: ['Image Generation', 'Creative Tools', 'Stable Diffusion'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.55,
      unit: 'hour'
    }
  },
  {
    id: 'animatediff',
    name: 'AnimateDiff',
    description: 'Create animated content using Stable Diffusion',
    icon: '🎬',
    category: 'video',
    rating: 4.6,
    usageCount: 5000,
    tags: ['Video Generation', 'Animation', 'Stable Diffusion'],
    gpuOptions: {
      min: 'NVIDIA A10G',
      recommended: 'NVIDIA A100'
    },
    pricing: {
      startingAt: 1.20,
      unit: 'hour'
    }
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    description: 'Advanced code generation and completion model',
    icon: '💻',
    category: 'code',
    rating: 4.7,
    usageCount: 7500,
    tags: ['Code Generation', 'AI Assistant', 'Programming'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.75,
      unit: 'hour'
    }
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    description: 'Latest version of Stable Diffusion with enhanced image quality and better prompt understanding',
    icon: '🎭',
    category: 'image',
    rating: 4.9,
    usageCount: 25000,
    tags: ['Image Generation', 'High Quality', 'Text-to-Image'],
    gpuOptions: {
      min: 'NVIDIA A10G',
      recommended: 'NVIDIA A100'
    },
    pricing: {
      startingAt: 0.85,
      unit: 'hour'
    }
  },
  {
    id: 'kandinsky',
    name: 'Kandinsky',
    description: 'Advanced text-to-image model with unique artistic style capabilities',
    icon: '🖌️',
    category: 'image',
    rating: 4.5,
    usageCount: 6000,
    tags: ['Image Generation', 'Artistic', 'Style Transfer'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.60,
      unit: 'hour'
    }
  },
  {
    id: 'deforum',
    name: 'Deforum',
    description: 'Create stunning animations and videos with AI-powered motion and transitions',
    icon: '🎥',
    category: 'video',
    rating: 4.7,
    usageCount: 4500,
    tags: ['Video Generation', 'Animation', 'Motion'],
    gpuOptions: {
      min: 'NVIDIA A10G',
      recommended: 'NVIDIA A100'
    },
    pricing: {
      startingAt: 1.50,
      unit: 'hour'
    }
  },
  {
    id: 'starcoder',
    name: 'StarCoder',
    description: 'Advanced code generation model trained on multiple programming languages',
    icon: '⭐',
    category: 'code',
    rating: 4.6,
    usageCount: 8500,
    tags: ['Code Generation', 'Multi-language', 'AI Assistant'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.65,
      unit: 'hour'
    }
  },
  {
    id: 'wizardcoder',
    name: 'WizardCoder',
    description: 'Specialized code generation model with deep understanding of software patterns',
    icon: '🧙‍♂️',
    category: 'code',
    rating: 4.8,
    usageCount: 6200,
    tags: ['Code Generation', 'Software Patterns', 'Documentation'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.70,
      unit: 'hour'
    }
  },
  {
    id: 'tensorboard',
    name: 'TensorBoard',
    description: 'Visualization toolkit for machine learning experimentation',
    icon: '📊',
    category: 'analytics',
    rating: 4.5,
    usageCount: 9500,
    tags: ['Analytics', 'Visualization', 'Machine Learning'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA T4'
    },
    pricing: {
      startingAt: 0.30,
      unit: 'hour'
    }
  },
  {
    id: 'mlflow',
    name: 'MLflow',
    description: 'End-to-end machine learning lifecycle platform',
    icon: '🔄',
    category: 'analytics',
    rating: 4.6,
    usageCount: 7800,
    tags: ['Analytics', 'ML Ops', 'Experiment Tracking'],
    gpuOptions: {
      min: 'NVIDIA T4',
      recommended: 'NVIDIA A10G'
    },
    pricing: {
      startingAt: 0.45,
      unit: 'hour'
    }
  }
];

const performanceCombos: PerformanceCombo[] = [
  {
    name: 'Performance',
    description: 'Maximum performance for professional workloads',
    gpu: 'NVIDIA A100',
    ram: '64GB',
    vcpu: 16,
    price: 4.50,
    type: 'performance',
    icon: '⚡'
  },
  {
    name: 'Value',
    description: 'Balanced performance and cost',
    gpu: 'NVIDIA A10G',
    ram: '32GB',
    vcpu: 8,
    price: 2.20,
    type: 'value',
    icon: '💎'
  },
  {
    name: 'Beginner',
    description: 'Cost-effective for learning and testing',
    gpu: 'NVIDIA T4',
    ram: '16GB',
    vcpu: 4,
    price: 0.90,
    type: 'beginner',
    icon: '🌱'
  }
];

const recentlyUsed = ['comfyui', 'sdwebui', 'codellama'];
const trending = ['animatediff', 'invokeai', 'comfyui'];

export default function MyAppsPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredApps = apps.filter(app => 
    (selectedCategory === 'all' || app.category === selectedCategory) &&
    (app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-black/10">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">App Store</h1>
            <p className="text-gray-400 text-sm">Discover and launch AI applications</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-black/20 border border-emerald-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/30"
              />
            </div>
            <button className="p-2 rounded-lg bg-black/20 border border-emerald-500/10 text-emerald-500 hover:bg-black/30">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-max ${
                  selectedCategory === category.id
                    ? 'bg-emerald-500 text-black'
                    : 'bg-black/20 text-gray-400 hover:text-white hover:bg-black/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Recently Used */}
        {selectedCategory === 'all' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              Recently Used
              <Clock className="w-4 h-4 text-emerald-500" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyUsed.map(id => {
                const app = apps.find(a => a.id === id)!;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden"
                  >
                    {/* App Header */}
                    <div className="p-4 border-b border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{app.icon}</div>
                          <div>
                            <h3 className="text-lg font-medium text-white">{app.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm text-gray-400">Last used 2 days ago</span>
                            </div>
                          </div>
                        </div>
                        <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Star className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Performance Combinations */}
                    <div className="p-4 space-y-2">
                      {performanceCombos.map((combo) => (
                        <div
                          key={combo.type}
                          className="group/combo relative bg-black/40 rounded-lg p-3 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{combo.icon}</span>
                              <span className="text-white font-medium">{combo.name}</span>
                            </div>
                            <Link
                              href={`/launch?app=${app.id}&template=${app.name}&combo=${combo.type}`}
                              className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-md transition-colors duration-200"
                            >
                              Launch
                            </Link>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-gray-400">GPU</span>
                              <span className="text-white font-medium">{combo.gpu}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400">RAM</span>
                              <span className="text-white font-medium">{combo.ram}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400">vCPU</span>
                              <span className="text-white font-medium">{combo.vcpu}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {selectedCategory === 'all' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-white">Trending</h2>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map(id => {
                const app = apps.find(a => a.id === id)!;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{app.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-white">{app.name}</h3>
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">{app.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-400">{app.usageCount.toLocaleString()} users</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Apps Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">
            {selectedCategory === 'all' ? 'All Apps' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden"
              >
                {/* App Header */}
                <div className="p-4 border-b border-emerald-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{app.icon}</div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{app.name}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{app.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Performance Combinations */}
                <div className="p-4 space-y-2">
                  {performanceCombos.map((combo) => (
                    <div
                      key={combo.type}
                      className="group/combo relative bg-black/40 rounded-lg p-3 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{combo.icon}</span>
                          <div>
                            <span className="text-white font-medium">{combo.name}</span>
                            <span className="text-xs text-gray-400 ml-2">${combo.price}/hour</span>
                          </div>
                        </div>
                        <Link
                          href={`/launch?app=${app.id}&template=${app.name}&combo=${combo.type}`}
                          className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-md transition-colors duration-200"
                        >
                          Launch
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-400">GPU</span>
                          <span className="text-white font-medium">{combo.gpu}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400">RAM</span>
                          <span className="text-white font-medium">{combo.ram}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400">vCPU</span>
                          <span className="text-white font-medium">{combo.vcpu}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="px-4 py-3 border-t border-emerald-500/10 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-400">{app.usageCount.toLocaleString()} users</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-400">{app.rating} rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 