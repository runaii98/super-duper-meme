'use client';

import { motion } from 'framer-motion';
import React from 'react';
import {
  Code,
  Image,
  Video,
  MessageSquare,
  Zap,
  Settings,
  Save,
  Share2,
  Clock,
  Star,
  Cpu,
  Database,
  HardDrive,
  RotateCcw,
  Play,
  Pause,
  Download,
  Plus,
  X,
  ChevronDown,
  Sparkles,
  Wand2,
  Bot,
  Layers,
  Palette,
  Film,
  Music,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

interface ModelConfig {
  id: string;
  name: string;
  type: 'image' | 'video' | 'code' | 'chat' | 'audio';
  icon: string;
  description: string;
  category: string;
  new?: boolean;
  popular?: boolean;
  parameters: {
    name: string;
    type: 'text' | 'number' | 'select' | 'slider' | 'checkbox';
    label: string;
    default: any;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    description?: string;
  }[];
}

const modelCategories = [
  { id: 'all', name: 'All Models', icon: Layers },
  { id: 'image', name: 'Image Generation', icon: Image },
  { id: 'video', name: 'Video Generation', icon: Film },
  { id: 'chat', name: 'Chat & LLM', icon: MessageSquare },
  { id: 'code', name: 'Code Generation', icon: Code },
  { id: 'audio', name: 'Audio Generation', icon: Music },
];

const models: ModelConfig[] = [
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    type: 'image',
    icon: '🎨',
    category: 'image',
    description: 'Latest version of Stable Diffusion with enhanced image quality',
    popular: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'Prompt',
        default: 'A beautiful sunset over mountains',
        description: 'Describe what you want to generate in detail',
      },
      {
        name: 'negative_prompt',
        type: 'text',
        label: 'Negative Prompt',
        default: 'blurry, low quality, distorted',
        description: 'Describe what you want to avoid in the generation',
      },
      {
        name: 'steps',
        type: 'slider',
        label: 'Steps',
        default: 30,
        min: 10,
        max: 100,
        step: 1,
        description: 'More steps = better quality but slower generation',
      },
      {
        name: 'sampler',
        type: 'select',
        label: 'Sampler',
        default: 'DPM++ 2M Karras',
        options: ['Euler a', 'DPM++ 2M Karras', 'DPM++ SDE Karras', 'UniPC'],
        description: 'Different samplers produce different results',
      },
    ],
  },
  {
    id: 'kandinsky',
    name: 'Kandinsky 3',
    type: 'image',
    icon: '🖌️',
    category: 'image',
    description: 'Multilingual image generation with unique artistic style',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'Prompt',
        default: 'An artistic scene with vibrant colors',
      },
      {
        name: 'style',
        type: 'select',
        label: 'Style',
        default: 'Modern',
        options: ['Modern', 'Classic', 'Abstract', 'Realistic'],
      },
    ],
  },
  {
    id: 'llama2-70b',
    name: 'Llama 2 70B',
    type: 'chat',
    icon: '🦙',
    category: 'chat',
    description: 'Meta\'s largest open-source LLM with strong reasoning capabilities',
    popular: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
        description: 'Define the AI\'s behavior and context',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'Higher values make output more random, lower more deterministic',
      },
      {
        name: 'max_tokens',
        type: 'slider',
        label: 'Max Tokens',
        default: 1024,
        min: 128,
        max: 4096,
        step: 128,
        description: 'Maximum length of the generated response',
      },
    ],
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B',
    type: 'chat',
    icon: '🎭',
    category: 'chat',
    description: 'Mixture of experts model with exceptional performance across tasks',
    new: true,
    popular: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
      {
        name: 'top_p',
        type: 'slider',
        label: 'Top P',
        default: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Controls diversity of token selection',
      },
    ],
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B Instruct',
    type: 'chat',
    icon: '🌪️',
    category: 'chat',
    description: 'Highly efficient model with strong performance despite small size',
    popular: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'phi2',
    name: 'Phi-2',
    type: 'chat',
    icon: 'φ',
    category: 'chat',
    description: 'Microsoft\'s compact yet powerful model with strong reasoning',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'openchat',
    name: 'OpenChat 3.5',
    type: 'chat',
    icon: '💬',
    category: 'chat',
    description: 'Open-source model fine-tuned for chat and instruction following',
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'falcon-180b',
    name: 'Falcon 180B',
    type: 'chat',
    icon: '🦅',
    category: 'chat',
    description: 'TII\'s large open-source model with broad knowledge',
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'yi-34b',
    name: '01.ai Yi-34B',
    type: 'chat',
    icon: '🔮',
    category: 'chat',
    description: 'High-performance bilingual model with strong coding abilities',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'solar',
    name: 'Solar 10.7B',
    type: 'chat',
    icon: '☀️',
    category: 'chat',
    description: 'Upstage\'s efficient model with strong reasoning capabilities',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen 72B',
    type: 'chat',
    icon: '🌟',
    category: 'chat',
    description: 'Alibaba\'s large multilingual model with broad capabilities',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek 67B',
    type: 'chat',
    icon: '🔍',
    category: 'chat',
    description: 'Versatile model with strong coding and reasoning abilities',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'System Prompt',
        default: 'You are a helpful AI assistant',
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    id: 'codellama',
    name: 'Code Llama 34B',
    type: 'code',
    icon: '💻',
    category: 'code',
    description: 'Specialized code generation and completion model',
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'Prompt',
        default: 'Write a function that...',
      },
      {
        name: 'language',
        type: 'select',
        label: 'Language',
        default: 'Python',
        options: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'],
      },
    ],
  },
  {
    id: 'animatediff',
    name: 'AnimateDiff XL',
    type: 'video',
    icon: '🎬',
    category: 'video',
    description: 'Generate animated videos from text descriptions',
    new: true,
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'Prompt',
        default: 'A flowing river under moonlight',
      },
      {
        name: 'duration',
        type: 'slider',
        label: 'Duration (seconds)',
        default: 4,
        min: 2,
        max: 10,
        step: 1,
      },
    ],
  },
  {
    id: 'musicgen',
    name: 'MusicGen Large',
    type: 'audio',
    icon: '🎵',
    category: 'audio',
    description: 'Generate music and audio from text descriptions',
    parameters: [
      {
        name: 'prompt',
        type: 'text',
        label: 'Prompt',
        default: 'A calm piano melody with soft strings',
      },
      {
        name: 'duration',
        type: 'slider',
        label: 'Duration (seconds)',
        default: 30,
        min: 10,
        max: 120,
        step: 10,
      },
    ],
  },
];

export default function PlaygroundPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedModel, setSelectedModel] = React.useState<ModelConfig>(models[0]);
  const [parameters, setParameters] = React.useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [savedExperiments, setSavedExperiments] = React.useState<any[]>([]);

  React.useEffect(() => {
    const defaultParams = selectedModel.parameters.reduce((acc, param) => {
      acc[param.name] = param.default;
      return acc;
    }, {} as Record<string, any>);
    setParameters(defaultParams);
  }, [selectedModel]);

  const filteredModels = models.filter(
    model => selectedCategory === 'all' || model.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-black/10">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">AI Playground</h1>
            <p className="text-gray-400 text-sm">Experiment with state-of-the-art AI models</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="flex items-center gap-2 px-3 py-1.5 bg-black/20 text-emerald-400 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition-all"
              onClick={() => {/* Save current configuration */}}
            >
              <Save className="w-4 h-4" />
              <span>Save Preset</span>
            </button>
            <button 
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-all duration-200"
              onClick={() => setIsProcessing(true)}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Model Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {modelCategories.map((category) => {
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

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Model Selection & Hardware */}
          <div className="col-span-4 space-y-4">
            {/* Model Selection */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/10">
                <h2 className="text-lg font-medium text-white">Available Models</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-2">
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedModel.id === model.id
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-black/20 border-emerald-500/10 text-gray-400 hover:border-emerald-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{model.icon}</span>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            {model.new && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                                NEW
                              </span>
                            )}
                            {model.popular && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded-full">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{model.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hardware Configuration */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Hardware</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Estimated cost:</span>
                  <span className="text-emerald-400 font-medium">$2.50/hour</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-400">GPU</span>
                    </div>
                    <select className="w-full bg-transparent text-white text-sm focus:outline-none">
                      <option value="a100">NVIDIA A100</option>
                      <option value="a10g">NVIDIA A10G</option>
                      <option value="t4">NVIDIA T4</option>
                    </select>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-400">RAM</span>
                    </div>
                    <select className="w-full bg-transparent text-white text-sm focus:outline-none">
                      <option value="64">64 GB</option>
                      <option value="32">32 GB</option>
                      <option value="16">16 GB</option>
                    </select>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-400">Storage</span>
                    </div>
                    <select className="w-full bg-transparent text-white text-sm focus:outline-none">
                      <option value="100">100 GB</option>
                      <option value="50">50 GB</option>
                      <option value="25">25 GB</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">History</h2>
                <div className="flex items-center gap-4">
                  <select className="bg-black/40 border border-emerald-500/10 rounded-lg px-3 py-1 text-sm text-gray-400">
                    <option>All Types</option>
                    <option>Images</option>
                    <option>Videos</option>
                    <option>Text</option>
                  </select>
                  <button 
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    onClick={() => {/* Clear history */}}
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <div className="divide-y divide-emerald-500/10">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="p-4 hover:bg-black/20 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🎨</span>
                          <span className="text-white font-medium">Image Generation</span>
                          <span className="text-xs text-gray-400">2 min ago</span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          A beautiful sunset over mountains, highly detailed, 4k
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Star className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Output & Parameters */}
          <div className="col-span-8 space-y-4">
            {/* Output Area */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium text-white">Output</h2>
                  {isProcessing && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-xs text-emerald-400">Processing...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    onClick={() => {/* Reset output */}}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    onClick={() => {/* Download output */}}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="p-4 min-h-[400px] flex items-center justify-center text-gray-400">
                  {isProcessing ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                      <p>Processing your request...</p>
                      <p className="text-sm text-gray-500 mt-1">This might take a few minutes</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Wand2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p>Select a model and click Generate to start</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Parameters</h2>
                <button 
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  onClick={() => {/* Reset parameters */}}
                >
                  Reset to defaults
                </button>
              </div>
              <div className="p-4 space-y-4">
                {selectedModel.parameters.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-400">
                        {param.label}
                      </label>
                      {param.description && (
                        <div className="group relative">
                          <button className="p-1 text-gray-500 hover:text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <div className="absolute right-0 w-48 px-2 py-1 bg-gray-900 text-xs text-gray-400 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            {param.description}
                          </div>
                        </div>
                      )}
                    </div>
                    {param.type === 'text' && (
                      <textarea
                        value={parameters[param.name] || ''}
                        onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                        className="w-full px-3 py-2 bg-black/40 rounded-lg border border-emerald-500/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30"
                        rows={3}
                        placeholder={param.default}
                      />
                    )}
                    {param.type === 'select' && (
                      <select
                        value={parameters[param.name] || ''}
                        onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                        className="w-full px-3 py-2 bg-black/40 rounded-lg border border-emerald-500/10 text-white focus:outline-none focus:border-emerald-500/30"
                      >
                        {param.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    {param.type === 'slider' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Min: {param.min}</span>
                          <span>Max: {param.max}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={parameters[param.name] || param.default}
                            onChange={(e) => setParameters({ ...parameters, [param.name]: parseFloat(e.target.value) })}
                            className="flex-1 accent-emerald-500"
                          />
                          <span className="text-sm text-white w-12 text-right">
                            {parameters[param.name] || param.default}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 