'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Cpu, 
  Zap, 
  Globe2, 
  Shield, 
  Boxes, 
  Image, 
  Video, 
  Bot, 
  Code, 
  Brain, 
  Cloud, 
  Database, 
  Lock, 
  Search, 
  Settings, 
  Star, 
  ChevronRight,
  MessageSquare,
  Eye,
  Mic,
  Target,
  LineChart,
  Network,
  ThumbsUp,
  AlertTriangle,
  Share2,
  Server,
  Check,
  FileText,
  GitBranch,
  Box,
  BarChart,
  Activity,
  Grid,
  DollarSign,
  CheckSquare,
  Clock
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TestimonialSlider from '@/components/TestimonialSlider';
import { StarIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { GpuIcon } from '@/components/ui/icons';
import clsx from 'clsx';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type GpuType = 'T4' | 'A100' | 'A10' | 'L4' | 'H100' | 'A40';
type Status = 'Live' | 'Beta' | 'Coming Soon' | 'Popular' | 'New' | 'Stable' | 'Pro' | 'Enterprise';

interface App {
  title: string;
  description: string;
  icon: React.ElementType | string;
  features: string[];
  category: string;
  status: Status;
  difficulty: Difficulty;
  rating: number;
  gpuSupport: GpuType[];
  recommendedGpu: GpuType;
}

const categories = [
  { id: 'all', name: 'All Apps' },
  { id: 'image-gen', name: 'Image Generation' },
  { id: 'video-gen', name: 'Video Generation' },
  { id: 'comfyui', name: 'ComfyUI Apps' },
  { id: 'ai-apps', name: 'AI & ML' },
  { id: 'development', name: 'Development' },
  { id: 'infrastructure', name: 'Infrastructure' }
];

const difficultyColors: Record<Difficulty, string> = {
  Beginner: 'bg-green-500/10 text-green-400',
  Intermediate: 'bg-yellow-500/10 text-yellow-400',
  Advanced: 'bg-red-500/10 text-red-400'
};

function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${difficultyColors[level]}`}>
      {level}
    </span>
  );
}

function GpuCompatibility({ gpus, recommended }: { gpus: GpuType[], recommended: GpuType }) {
  return (
    <div className="flex flex-wrap gap-1">
      {gpus.map((gpu) => (
        <span
          key={gpu}
          className={`px-2 py-1 rounded-md text-xs font-medium ${
            gpu === recommended
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {gpu}
        </span>
      ))}
    </div>
  );
}

function Rating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(score)
                ? 'text-emerald-400 fill-emerald-400'
                : star <= score
                ? 'text-emerald-400 fill-emerald-400 opacity-50'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">{score.toFixed(1)}</span>
    </div>
  );
}

const apps: App[] = [
  // Image Generation Apps
  {
    title: 'Stable Diffusion',
    description: 'Create stunning images with state-of-the-art AI models.',
    icon: Image,
    features: ['Multiple model support', 'Custom fine-tuning', 'Batch processing'],
    category: 'image-gen',
    status: 'Popular',
    difficulty: 'Beginner',
    rating: 4.8,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Midjourney Integration',
    description: 'Seamlessly integrate Midjourney into your workflow.',
    icon: Image,
    features: ['API integration', 'Custom styles', 'Batch generation'],
    category: 'image-gen',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'DALL-E Studio',
    description: 'Professional image generation with DALL-E models.',
    icon: Image,
    features: ['Multiple models', 'Style transfer', 'High resolution'],
    category: 'image-gen',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'ControlNet Suite',
    description: 'Advanced control over image generation process.',
    icon: Settings,
    features: ['Pose control', 'Style control', 'Batch processing'],
    category: 'image-gen',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.6,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Image Upscaler Pro',
    description: 'Professional-grade image upscaling and enhancement.',
    icon: Image,
    features: ['8x upscaling', 'Detail enhancement', 'Batch processing'],
    category: 'image-gen',
    status: 'Pro',
    difficulty: 'Intermediate',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Style Transfer Studio',
    description: 'Transfer artistic styles between images with AI.',
    icon: Image,
    features: ['Multiple styles', 'Custom training', 'Batch processing'],
    category: 'image-gen',
    status: 'Live',
    difficulty: 'Beginner',
    rating: 4.4,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Image Inpainting',
    description: 'Advanced image editing and restoration tool.',
    icon: Image,
    features: ['Smart fill', 'Object removal', 'Background reconstruction'],
    category: 'image-gen',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Text2Image Pro',
    description: 'Convert text descriptions into high-quality images.',
    icon: Image,
    features: ['Multiple styles', 'Batch generation', 'Custom training'],
    category: 'image-gen',
    status: 'Popular',
    difficulty: 'Beginner',
    rating: 4.8,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Image Restoration AI',
    description: 'Restore and enhance old or damaged photos.',
    icon: Image,
    features: ['Auto repair', 'Color restoration', 'Detail enhancement'],
    category: 'image-gen',
    status: 'Live',
    difficulty: 'Beginner',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'AI Art Generator',
    description: 'Create unique artwork using multiple AI models.',
    icon: Image,
    features: ['Style mixing', 'Custom training', 'High resolution'],
    category: 'image-gen',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Photo Enhancement Suite',
    description: 'Professional photo enhancement and editing tools.',
    icon: Image,
    features: ['Auto enhance', 'Portrait retouching', 'Batch processing'],
    category: 'image-gen',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Background Generator',
    description: 'Generate and replace image backgrounds with AI.',
    icon: Image,
    features: ['Auto masking', 'Style transfer', 'Batch processing'],
    category: 'image-gen',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  // Video Generation Apps
  {
    title: 'AI Video Creator',
    description: 'Create professional videos with AI-powered tools.',
    icon: Video,
    features: ['Text to video', 'Style transfer', 'Scene generation'],
    category: 'video-gen',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Video Upscaling Pro',
    description: 'Enhance video quality and resolution with AI.',
    icon: Video,
    features: ['4K upscaling', 'Frame interpolation', 'Noise reduction'],
    category: 'video-gen',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Motion Graphics AI',
    description: 'Create stunning motion graphics with AI assistance.',
    icon: Video,
    features: ['Template library', 'Custom animations', 'Export options'],
    category: 'video-gen',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Video Style Transfer',
    description: 'Apply artistic styles to videos in real-time.',
    icon: Video,
    features: ['Real-time processing', 'Style library', 'Custom styles'],
    category: 'video-gen',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.5,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Video Restoration',
    description: 'Restore and enhance old or damaged videos.',
    icon: Video,
    features: ['Color restoration', 'Stabilization', 'Noise reduction'],
    category: 'video-gen',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Scene Generator',
    description: 'Generate complete video scenes from text descriptions.',
    icon: Video,
    features: ['Text to scene', 'Environment control', 'Character animation'],
    category: 'video-gen',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Video Effects Studio',
    description: 'Add professional effects to your videos with AI.',
    icon: Video,
    features: ['Effect library', 'Custom effects', 'Real-time preview'],
    category: 'video-gen',
    status: 'Live',
    difficulty: 'Beginner',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Character Animator',
    description: 'Animate characters using AI-powered tools.',
    icon: Video,
    features: ['Motion capture', 'Expression control', 'Voice sync'],
    category: 'video-gen',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.6,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Video Dubbing AI',
    description: 'Automatic voice dubbing and translation for videos.',
    icon: Video,
    features: ['Multi-language', 'Voice cloning', 'Lip sync'],
    category: 'video-gen',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Background Replacement',
    description: 'Replace video backgrounds in real-time.',
    icon: Video,
    features: ['Real-time masking', 'Green screen', 'Custom backgrounds'],
    category: 'video-gen',
    status: 'Stable',
    difficulty: 'Beginner',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Video Summarizer',
    description: 'Create short summaries from long videos.',
    icon: Video,
    features: ['Auto highlight', 'Custom length', 'Caption generation'],
    category: 'video-gen',
    status: 'Popular',
    difficulty: 'Beginner',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Slow Motion Pro',
    description: 'Create stunning slow-motion effects with AI interpolation.',
    icon: Video,
    features: ['Frame generation', 'Speed control', 'Motion blur'],
    category: 'video-gen',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  // ComfyUI Apps
  {
    title: 'Workflow Designer',
    description: 'Visual workflow designer for AI pipelines.',
    icon: Settings,
    features: ['Drag-and-drop', 'Custom nodes', 'Templates'],
    category: 'comfyui',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.9,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Node Library',
    description: 'Extensive library of pre-built nodes for ComfyUI.',
    icon: Boxes,
    features: ['1000+ nodes', 'Categories', 'Documentation'],
    category: 'comfyui',
    status: 'Stable',
    difficulty: 'Beginner',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Pipeline Manager',
    description: 'Manage and monitor AI pipelines in ComfyUI.',
    icon: Settings,
    features: ['Monitoring', 'Alerts', 'Analytics'],
    category: 'comfyui',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Model Hub',
    description: 'Central hub for AI model management.',
    icon: Database,
    features: ['Version control', 'Model registry', 'Deployment'],
    category: 'comfyui',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Workflow Templates',
    description: 'Pre-built workflow templates for common tasks.',
    icon: Code,
    features: ['Category filters', 'One-click deploy', 'Customization'],
    category: 'comfyui',
    status: 'Live',
    difficulty: 'Beginner',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Performance Monitor',
    description: 'Monitor and optimize ComfyUI workflows.',
    icon: Settings,
    features: ['Real-time metrics', 'Optimization tips', 'Alerts'],
    category: 'comfyui',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Custom Node Creator',
    description: 'Create and publish custom nodes for ComfyUI.',
    icon: Code,
    features: ['Node templates', 'Testing tools', 'Publishing'],
    category: 'comfyui',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Workflow Debugger',
    description: 'Debug and optimize ComfyUI workflows.',
    icon: Settings,
    features: ['Step-by-step debug', 'Variable inspection', 'Performance analysis'],
    category: 'comfyui',
    status: 'New',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Workflow Scheduler',
    description: 'Schedule and automate ComfyUI workflows.',
    icon: Clock,
    features: ['Cron scheduling', 'Dependencies', 'Monitoring'],
    category: 'comfyui',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Resource Manager',
    description: 'Manage ComfyUI compute resources efficiently.',
    icon: Cpu,
    features: ['Resource allocation', 'Cost optimization', 'Scaling'],
    category: 'comfyui',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Workflow Analytics',
    description: 'Analyze and optimize workflow performance.',
    icon: BarChart,
    features: ['Performance metrics', 'Cost analysis', 'Recommendations'],
    category: 'comfyui',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Model Optimizer',
    description: 'Optimize AI models for ComfyUI workflows.',
    icon: Zap,
    features: ['Model compression', 'Performance tuning', 'Benchmarking'],
    category: 'comfyui',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  // AI & ML Apps
  {
    title: 'AutoML Platform',
    description: 'Automated machine learning platform for all skill levels.',
    icon: Brain,
    features: ['Model selection', 'Hyperparameter tuning', 'Deployment'],
    category: 'ai-apps',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.9,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'NLP Studio',
    description: 'Natural language processing toolkit and workspace.',
    icon: MessageSquare,
    features: ['Text analysis', 'Sentiment analysis', 'Translation'],
    category: 'ai-apps',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Computer Vision Lab',
    description: 'Advanced computer vision development environment.',
    icon: Eye,
    features: ['Object detection', 'Image segmentation', 'Face recognition'],
    category: 'ai-apps',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Speech AI Studio',
    description: 'Complete toolkit for speech recognition and synthesis.',
    icon: Mic,
    features: ['Voice recognition', 'Text to speech', 'Voice cloning'],
    category: 'ai-apps',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Reinforcement Learning',
    description: 'Build and train reinforcement learning agents.',
    icon: Target,
    features: ['Environment simulation', 'Policy optimization', 'Agent training'],
    category: 'ai-apps',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'H100'
  },
  {
    title: 'Time Series Analysis',
    description: 'Advanced time series forecasting and analysis.',
    icon: LineChart,
    features: ['Forecasting', 'Anomaly detection', 'Pattern recognition'],
    category: 'ai-apps',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.5,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Graph Neural Networks',
    description: 'Develop and deploy graph-based AI models.',
    icon: Network,
    features: ['Graph analysis', 'Node classification', 'Link prediction'],
    category: 'ai-apps',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'AutoML Vision',
    description: 'Automated computer vision model development.',
    icon: Eye,
    features: ['Model selection', 'Training automation', 'Deployment'],
    category: 'ai-apps',
    status: 'Popular',
    difficulty: 'Beginner',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Recommendation Engine',
    description: 'Build personalized recommendation systems.',
    icon: ThumbsUp,
    features: ['Collaborative filtering', 'Content-based', 'Hybrid systems'],
    category: 'ai-apps',
    status: 'Live',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Anomaly Detection',
    description: 'Detect anomalies in data streams and systems.',
    icon: AlertTriangle,
    features: ['Real-time detection', 'Multiple algorithms', 'Alerting'],
    category: 'ai-apps',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Transfer Learning Hub',
    description: 'Leverage pre-trained models for quick development.',
    icon: Share2,
    features: ['Model zoo', 'Fine-tuning', 'Deployment'],
    category: 'ai-apps',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.5,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'MLOps Platform',
    description: 'End-to-end machine learning operations platform.',
    icon: Settings,
    features: ['Pipeline automation', 'Model monitoring', 'Version control'],
    category: 'ai-apps',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['T4', 'A100', 'H100'],
    recommendedGpu: 'H100'
  },
  // Development Apps
  {
    title: 'Code Assistant Pro',
    description: 'AI-powered code completion and suggestions.',
    icon: Code,
    features: ['Multi-language support', 'Code review', 'Documentation'],
    category: 'development',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.9,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'DevOps Automation',
    description: 'Automate your development and deployment pipeline.',
    icon: Settings,
    features: ['CI/CD', 'Infrastructure as code', 'Monitoring'],
    category: 'development',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'API Development Studio',
    description: 'Complete toolkit for API development and testing.',
    icon: Server,
    features: ['API design', 'Testing', 'Documentation'],
    category: 'development',
    status: 'Pro',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Database Manager',
    description: 'Manage and optimize your databases efficiently.',
    icon: Database,
    features: ['Query optimization', 'Backup', 'Monitoring'],
    category: 'development',
    status: 'Live',
    difficulty: 'Advanced',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Security Scanner',
    description: 'Comprehensive security scanning and testing.',
    icon: Shield,
    features: ['Vulnerability scan', 'Compliance check', 'Reports'],
    category: 'development',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Performance Profiler',
    description: 'Profile and optimize application performance.',
    icon: Zap,
    features: ['CPU profiling', 'Memory analysis', 'Bottleneck detection'],
    category: 'development',
    status: 'New',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Test Automation',
    description: 'Automate testing across your application stack.',
    icon: Check,
    features: ['Unit testing', 'Integration tests', 'E2E testing'],
    category: 'development',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Code Quality Monitor',
    description: 'Monitor and improve code quality continuously.',
    icon: Code,
    features: ['Static analysis', 'Code metrics', 'Quality gates'],
    category: 'development',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Documentation Generator',
    description: 'Automatically generate comprehensive documentation.',
    icon: FileText,
    features: ['API docs', 'Code docs', 'Markdown support'],
    category: 'development',
    status: 'Live',
    difficulty: 'Beginner',
    rating: 4.5,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Git Manager Pro',
    description: 'Advanced Git operations and workflow management.',
    icon: GitBranch,
    features: ['Branch management', 'Code review', 'Merge tools'],
    category: 'development',
    status: 'Pro',
    difficulty: 'Intermediate',
    rating: 4.8,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Container Studio',
    description: 'Develop and manage containerized applications.',
    icon: Box,
    features: ['Docker support', 'Orchestration', 'Monitoring'],
    category: 'development',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Code Analytics',
    description: 'Deep insights into your codebase and team.',
    icon: BarChart,
    features: ['Code metrics', 'Team analytics', 'Reports'],
    category: 'development',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  // Infrastructure Apps
  {
    title: 'Cloud Manager',
    description: 'Manage multi-cloud infrastructure efficiently.',
    icon: Cloud,
    features: ['Multi-cloud', 'Cost optimization', 'Monitoring'],
    category: 'infrastructure',
    status: 'Popular',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Kubernetes Platform',
    description: 'Enterprise-grade Kubernetes management.',
    icon: Boxes,
    features: ['Cluster management', 'Auto-scaling', 'Monitoring'],
    category: 'infrastructure',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'A100'
  },
  {
    title: 'Network Monitor',
    description: 'Advanced network monitoring and optimization.',
    icon: Activity,
    features: ['Real-time monitoring', 'Analytics', 'Alerts'],
    category: 'infrastructure',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Load Balancer Pro',
    description: 'Intelligent load balancing and traffic management.',
    icon: Share2,
    features: ['Auto-scaling', 'Health checks', 'Analytics'],
    category: 'infrastructure',
    status: 'Live',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Security Center',
    description: 'Comprehensive infrastructure security management.',
    icon: Shield,
    features: ['Threat detection', 'Compliance', 'Auditing'],
    category: 'infrastructure',
    status: 'Pro',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Storage Manager',
    description: 'Efficient cloud storage management and optimization.',
    icon: Database,
    features: ['Multi-cloud storage', 'Backup', 'Archival'],
    category: 'infrastructure',
    status: 'Stable',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Container Registry',
    description: 'Secure container image storage and management.',
    icon: Box,
    features: ['Image scanning', 'Version control', 'Distribution'],
    category: 'infrastructure',
    status: 'New',
    difficulty: 'Intermediate',
    rating: 4.6,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Service Mesh',
    description: 'Advanced service mesh for microservices.',
    icon: Grid,
    features: ['Traffic management', 'Security', 'Observability'],
    category: 'infrastructure',
    status: 'Beta',
    difficulty: 'Advanced',
    rating: 4.7,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Serverless Platform',
    description: 'Build and deploy serverless applications.',
    icon: Zap,
    features: ['Function deployment', 'API Gateway', 'Monitoring'],
    category: 'infrastructure',
    status: 'Popular',
    difficulty: 'Intermediate',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Cost Explorer',
    description: 'Track and optimize infrastructure costs.',
    icon: DollarSign,
    features: ['Cost analysis', 'Budgeting', 'Optimization'],
    category: 'infrastructure',
    status: 'Pro',
    difficulty: 'Intermediate',
    rating: 4.7,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Compliance Manager',
    description: 'Ensure infrastructure compliance and security.',
    icon: CheckSquare,
    features: ['Policy enforcement', 'Auditing', 'Reporting'],
    category: 'infrastructure',
    status: 'Enterprise',
    difficulty: 'Advanced',
    rating: 4.9,
    gpuSupport: ['T4'],
    recommendedGpu: 'T4'
  },
  {
    title: 'Disaster Recovery',
    description: 'Automated disaster recovery and backup.',
    icon: Shield,
    features: ['Auto backup', 'Quick recovery', 'Testing'],
    category: 'infrastructure',
    status: 'Stable',
    difficulty: 'Advanced',
    rating: 4.8,
    gpuSupport: ['T4', 'A100'],
    recommendedGpu: 'T4'
  }
];

function AppCard({ app }: { app: App }) {
  const Icon = app.icon;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div 
      className={clsx(
        'group relative bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 transition-all duration-500 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-emerald-500/10',
        'opacity-0 transform translate-y-4',
        isLoaded && 'opacity-100 translate-y-0'
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
          {app.status}
        </span>
      </div>

      {/* Icon */}
      <div className="relative w-12 h-12 mb-6 transform-gpu transition-all duration-500 group-hover:scale-110">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-lg transform -rotate-6 transition-transform group-hover:rotate-6 group-hover:scale-110" />
        <div className="absolute inset-0 bg-[#111111] rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-emerald-400 transform transition-transform duration-500 group-hover:scale-110" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400 transition-colors duration-300">
        {app.title}
        <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
      </h3>
      
      <p className="text-gray-400 mb-4 line-clamp-2">{app.description}</p>

      {/* Rating and Difficulty */}
      <div className="flex items-center justify-between mb-4">
        <Rating score={app.rating} />
        <DifficultyBadge level={app.difficulty} />
      </div>
      
      {/* Features */}
      <ul className="space-y-2 mb-4">
        {app.features.map((feature, index) => (
          <li key={index} className="text-sm text-gray-500 flex items-center gap-2 group-hover:text-gray-400 transition-colors duration-300">
            <ChevronRight className="w-4 h-4 text-emerald-400" />
            {feature}
          </li>
        ))}
      </ul>

      {/* GPU Compatibility */}
      <div className="mt-4 pt-4 border-t border-[#222222]">
        <p className="text-xs text-gray-500 mb-2">Works best on</p>
        <GpuCompatibility gpus={app.gpuSupport} recommended={app.recommendedGpu} />
      </div>

      {/* Category */}
      <div className="mt-4 pt-4 border-t border-[#222222] flex items-center justify-between">
        <span className="text-sm text-gray-500">{app.category}</span>
        
        {/* Launch Button */}
        <a
          href={`/dashboard/launch?app=${encodeURIComponent(app.title)}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-300 text-sm font-medium"
        >
          Launch
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
    </div>
  );
}

export default function AppsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredApps = apps.filter((app: App) => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
      
      <main className={`relative pt-28 pb-20 z-10 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 relative">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent blur-xl opacity-75" />
              <h1 className="relative text-5xl md:text-6xl font-bold">
                <span className={`inline-block ${isLoaded ? 'animate-slide-in-left' : ''} opacity-0 [animation-delay:0.2s] [animation-fill-mode:forwards]`}>
                  Explore
                </span>{' '}
                <span className={`inline-block ${isLoaded ? 'animate-slide-in-right' : ''} opacity-0 [animation-delay:0.4s] [animation-fill-mode:forwards]`}>
                  Our
                </span>{' '}
                <span className={`inline-block bg-gradient-to-r from-emerald-400 to-emerald-500 text-transparent bg-clip-text ${isLoaded ? 'animate-slide-in-bottom' : ''} opacity-0 [animation-delay:0.6s] [animation-fill-mode:forwards]`}>
                  Apps
                </span>
              </h1>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl" />
              <h2 className={`relative text-[80px] md:text-[120px] font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/30 ${isLoaded ? 'animate-text-reveal' : ''} opacity-0`}>
                APPLICATIONS
              </h2>
            </div>

            <p className={`text-xl text-gray-400 max-w-2xl mx-auto ${isLoaded ? 'animate-fade-in-up' : ''} opacity-0 [animation-delay:0.8s] [animation-fill-mode:forwards] relative`}>
              Discover powerful applications built for performance, scalability, and developer experience.
            </p>
          </div>

          {/* Search Bar with Glow */}
          <div className="max-w-2xl mx-auto mb-16 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-20" />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 relative"
              />
            </div>
          </div>

          {/* Category Tabs with Glow */}
          <div className="mb-16 overflow-x-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 blur-3xl opacity-20" />
            <div className="flex space-x-4 min-w-max px-4 relative">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
            {filteredApps.map((app, index) => (
              <div
                key={app.title}
                className={clsx(
                  'opacity-0',
                  isLoaded && 'animate-fade-in-up'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AppCard app={app} />
              </div>
            ))}
          </div>

          {/* Testimonials Section */}
          <div className="mt-32 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Trusted by Developers Worldwide</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Join thousands of developers and companies who are building the future with ComfyUI.
              </p>
            </div>
            <TestimonialSlider />
          </div>

          {/* CTA Section with Enhanced Glow */}
          <div className="mt-20 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 blur-3xl opacity-20" />
            <a
              href="/docs/getting-started/quickstart"
              className="relative inline-flex items-center px-6 py-3 bg-emerald-500/10 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all duration-300 group"
            >
              Start Building
              <ArrowUpRight className="ml-2 w-4 h-4 transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}