'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { api, ContainerResponse, ContainerStatusType, GPU, Storage } from '@/services/api';
import LaunchModal from '@/components/LaunchModal';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Layout, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  StopCircle,
  Cpu,
  Database,
  HardDrive,
  Activity,
  Server
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ContainerStatus {
  id: string;
  name: string;
  status: ContainerStatusType;
  template?: string;
  gpu?: GPU;
  storage?: Storage;
  app_url?: string;
  message?: string;
  uptime?: string;
  memory?: {
    total: number;
    used: number;
    utilization: number;
  };
}

interface UserState {
  userId: string;
  password: string;
  isLoggedIn: boolean;
  errors: {
    userId: string;
    password: string;
  };
}

interface LaunchStage {
  message: string;
  description: string;
  icon: JSX.Element;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  status: 'running' | 'completed' | 'processing';
  timestamp: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

interface ResourceUsage {
  current: number;
  total: number;
  unit: string;
}

const features = [
  {
    title: "Seamless deployment",
    description: "Build and deploy anything from web apps to inference with native HTTP/2, WebSocket, and gRPC support",
    icon: (
      <svg className="w-12 h-12 text-blue-400" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 12V24L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    title: "Zero config infrastructure",
    description: "Smart and fast autoscaling on GPU and CPU with zero-downtime deployments and built-in observability",
    icon: (
      <svg className="w-12 h-12 text-green-400" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 24H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 6V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="14" y="14" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    title: "Any hardware anywhere",
    description: "High-performance CPUs, GPUs, and accelerators available globally across 10 regions and 3 continents",
    icon: (
      <svg className="w-12 h-12 text-purple-400" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M42 24C42 33.9411 33.9411 42 24 42C14.0589 42 6 33.9411 6 24C6 14.0589 14.0589 6 24 6C33.9411 6 42 14.0589 42 24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 12V24L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
];

const launchStages: LaunchStage[] = [
  {
    message: "Initializing Machine",
    description: "Setting up your cloud instance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
      </svg>
    )
  },
  {
    message: "Machine Booting Up",
    description: "Starting system components",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    message: "Connecting to Machine",
    description: "Establishing secure connection",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    )
  }
];

const quickActions = [
  {
    name: 'Launch Instance',
    description: 'Create a new AI instance',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    href: '/launch',
    color: 'from-emerald-400 to-blue-500',
  },
  {
    name: 'Import Model',
    description: 'Add a new AI model',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    href: '/models/import',
    color: 'from-violet-400 to-purple-500',
  },
  {
    name: 'View Instances',
    description: 'Manage running instances',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    href: '/instances',
    color: 'from-amber-400 to-orange-500',
  },
];

const metrics = [
  { name: 'Active Instances', value: '3', change: '+2', changeType: 'increase' },
  { name: 'GPU Usage', value: '75%', change: '-5%', changeType: 'decrease' },
  { name: 'Storage Used', value: '256GB', change: '+20GB', changeType: 'increase' },
  { name: 'Models', value: '12', change: '+3', changeType: 'increase' },
];

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'ComfyUI Instance',
    description: 'Instance started successfully',
    status: 'running',
    timestamp: '2 minutes ago'
  },
  {
    id: '2',
    title: 'Model Import',
    description: 'SD XL Base imported successfully',
    status: 'completed',
    timestamp: '1 hour ago'
  },
  {
    id: '3',
    title: 'Storage Upgrade',
    description: 'Upgrading storage to 500GB',
    status: 'processing',
    timestamp: '3 hours ago'
  }
];

const StatusIcon = ({ status }: { status: ActivityItem['status'] }) => {
  switch (status) {
    case 'running':
      return (
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>
      );
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
    case 'processing':
      return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
    default:
      return null;
  }
};

const formatResourceUsage = (usage: ResourceUsage) => {
  const percentage = (usage.current / usage.total) * 100;
  return {
    value: `${usage.current} / ${usage.total} ${usage.unit}`,
    percentage: Math.round(percentage)
  };
};

const StatusBadge = ({ status, className = '' }: { status: ContainerStatusType; className?: string }) => {
  const statusConfig = {
    running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <Power className="w-4 h-4" /> },
    stopped: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <StopCircle className="w-4 h-4" /> },
    loading: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> }
  };

  const config = statusConfig[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text} ${className}`}>
      {config.icon}
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
};

const ResourceCard = ({ title, icon, usage, trend }: { 
  title: string; 
  icon: React.ReactNode; 
  usage: ResourceUsage;
  trend?: { value: number; isPositive: boolean };
}) => {
  const { value, percentage } = formatResourceUsage(usage);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/20 transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Usage</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${
              percentage > 90 ? 'bg-red-500' :
              percentage > 75 ? 'bg-amber-500' :
              'bg-green-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>({ 
    id: 'initial',
    name: 'Initial Instance',
    status: 'loading',
    message: 'Initializing...'
  });
  const [user, setUser] = useState<UserState>({
    userId: 'demo',
    password: '',
    isLoggedIn: true,
    errors: {
      userId: '',
      password: ''
    }
  });

  const [currentFeature, setCurrentFeature] = useState(0);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [launchComplete, setLaunchComplete] = useState(false);
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [instances, setInstances] = useState<ContainerStatus[]>([
    {
      id: 'comfy-1',
      name: 'ComfyUI Instance',
      status: 'running',
      template: 'ComfyUI',
      gpu: {
        name: 'NVIDIA A10G',
        type: 'A10G',
        memory: 24,
        usage: 45,
        temperature: 65
      },
      storage: {
        type: 'SSD',
        size: 100,
        used: 45,
        readSpeed: 2800,
        writeSpeed: 1900
      },
      memory: {
        total: 32,
        used: 16,
        utilization: 50
      },
      uptime: '2h 15m',
      app_url: 'http://localhost:3001'
    },
    {
      id: 'sd-1',
      name: 'Stable Diffusion',
      status: 'stopped',
      template: 'Stable Diffusion WebUI',
      uptime: '0m'
    }
  ]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<ContainerStatus | null>(null);

  const systemMetrics: SystemMetrics = {
    cpu: 45,
    memory: 60,
    storage: 75,
    network: 30
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      userId: '',
      password: ''
    };

    if (!user.userId) {
      newErrors.userId = 'Username is required';
      isValid = false;
    } else if (user.userId.length < 3) {
      newErrors.userId = 'Username must be at least 3 characters long';
      isValid = false;
    }

    if (!user.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    setUser(prev => ({ ...prev, errors: newErrors }));
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.register({ 
        userId: user.userId, 
        password: user.password 
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      // If registration is successful, the api.register function will automatically
      // store the server_port, userId, and password in localStorage

      setUser(prev => ({ ...prev, isLoggedIn: true }));
      checkContainerStatus();
      
      toast({
        type: 'success',
        title: 'Success',
        message: 'Logged in successfully'
      });
    } catch (err) {
      setError('Failed to login. Please try again.');
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser({
      userId: '',
      password: '',
      isLoggedIn: false,
      errors: {
        userId: '',
        password: ''
      }
    });
    router.push('/');
  };

  const checkContainerStatus = async () => {
    if (!user.isLoggedIn) return;
    try {
      const status = await api.monitorContainer({
        userId: user.userId,
        password: user.password
      });
      setContainerStatus(status);
    } catch (err) {
      setError('Failed to check container status');
    }
  };

  const handleLaunchInstance = async () => {
    setShowLaunchModal(true);
    setCurrentStage(0);
    setLaunchComplete(false);
    setProgress(0);
    setError(null);
    setAppUrl(null);

    try {
      // Start the launch process
      setCurrentStage(0);
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate initialization

      // Machine booting up
      setCurrentStage(1);
      setProgress(50);
      const response = await api.spinContainer({
        userId: user.userId,
        password: user.password,
        instanceName: newInstanceName
      });

      // Connecting to machine
      setCurrentStage(2);
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for connection

      if (response.app_url) {
        setAppUrl(response.app_url);
        setProgress(100);
        setLaunchComplete(true);
        
        // Add the new instance to the list
        setInstances(prev => [...prev, {
          status: response.status as ContainerStatus['status'],
          app_url: response.app_url,
          id: response.id,
          name: newInstanceName
        }]);
      } else {
        throw new Error('Failed to get instance URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch instance');
      setProgress(0);
    }
  };

  const handleStartContainer = async (instanceId?: string) => {
    setIsLoading(true);
    setError(null);
    setShowLaunchModal(true);
    setCurrentStage(0);
    setLaunchComplete(false);
    setProgress(0);

    try {
      const response = await api.spinContainer({
        userId: user.userId,
        password: user.password
      });

      const newInstance = {
        ...response,
        id: instanceId || Date.now().toString(),
        name: newInstanceName || `Instance ${instances.length + 1}`
      };

      setInstances(prev => [...prev, newInstance]);
      setContainerStatus(response);
      setAppUrl(response.app_url || null);
      setNewInstanceName('');
      
      // Start the progress animation
      const startTime = Date.now();
      const duration = 30000; // 30 seconds
      
      const animateProgress = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        
        setProgress(currentProgress);
        
        // Update current stage based on progress
        if (currentProgress < 33.33) {
          setCurrentStage(0);
        } else if (currentProgress < 66.66) {
          setCurrentStage(1);
        } else if (currentProgress < 100) {
          setCurrentStage(2);
        }
        
        if (currentProgress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          setLaunchComplete(true);
          // Open the URL after completion
          if (response.app_url) {
            setTimeout(() => {
              window.open(response.app_url, '_blank');
              setShowLaunchModal(false);
            }, 2000);
          }
        }
      };
      
      requestAnimationFrame(animateProgress);
      
    } catch (err) {
      setError('Failed to start container');
      setShowLaunchModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopContainer = async (instanceId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.stopContainer({
        userId: user.userId,
        password: user.password
      });

      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? { ...instance, ...response }
            : instance
        )
      );
      setContainerStatus(response);
    } catch (err) {
      setError('Failed to stop container');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInstance = async (instance: ContainerStatus) => {
    try {
      setLoading(true);
      // Create a complete ContainerStatus object for the loading state
      setSelectedInstance({
        ...instance,
        status: 'loading',
        message: 'Starting instance...',
      });
      
      const response = await fetch(`/api/instances/${instance.id}/start`, {
        method: 'POST',
      });
      const data: ContainerResponse = await response.json();
      
      // Update the instance status in the list
      setInstances(prev => prev.map(inst => 
        inst.id === instance.id ? { ...inst, ...data } : inst
      ));
      
      // Update the selected instance if it's the one being started
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance({ ...selectedInstance, ...data });
      }
      
      toast({
        type: 'success',
        title: 'Success',
        message: 'Instance started successfully'
      });
    } catch (error) {
      console.error('Failed to start instance:', error);
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to start instance'
      });
      // Reset the instance state on error
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance(instance);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopInstance = async (instance: ContainerStatus) => {
    try {
      setLoading(true);
      // Create a complete ContainerStatus object for the loading state
      setSelectedInstance({
        ...instance,
        status: 'loading',
        message: 'Stopping instance...',
      });
      
      const response = await fetch(`/api/instances/${instance.id}/stop`, {
        method: 'POST',
      });
      const data: ContainerResponse = await response.json();
      
      // Update the instance status in the list
      setInstances(prev => prev.map(inst => 
        inst.id === instance.id ? { ...inst, ...data } : inst
      ));
      
      // Update the selected instance if it's the one being stopped
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance({ ...selectedInstance, ...data });
      }
      
      toast({
        type: 'success',
        title: 'Success',
        message: 'Instance stopped successfully'
      });
    } catch (error) {
      console.error('Failed to stop instance:', error);
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to stop instance'
      });
      // Reset the instance state on error
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance(instance);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const password = localStorage.getItem('password');
    
    if (userId && password) {
      setUser(prev => ({
        ...prev,
        userId,
        password,
        isLoggedIn: true
      }));
    }
  }, []);

  useEffect(() => {
    if (user.isLoggedIn) {
      checkContainerStatus();
      const interval = setInterval(checkContainerStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user.isLoggedIn]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getStatusDisplay = (status: string): string => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen flex bg-[#0a0a0a]">
        {/* Left side - Login Form */}
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center transform rotate-45">
                  <div className="-rotate-45">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to manage your container</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="transform transition-all duration-300 hover:translate-x-1">
                <label className="block text-gray-400 mb-2 text-sm font-medium">User ID</label>
                <input
                  type="text"
                  value={user.userId}
                  onChange={(e) => setUser(prev => ({
                    ...prev,
                    userId: e.target.value,
                    errors: { ...prev.errors, userId: '' }
                  }))}
                  className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                    user.errors.userId ? 'border-red-500' : 'border-[#2a2a2a]'
                  } focus:border-blue-500 text-white transition-all duration-300`}
                  placeholder="Enter your user ID"
                  required
                />
                {user.errors.userId && (
                  <p className="text-red-400 text-sm mt-1 animate-fade-in">{user.errors.userId}</p>
                )}
              </div>

              <div className="transform transition-all duration-300 hover:translate-x-1">
                <label className="block text-gray-400 mb-2 text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={user.password}
                  onChange={(e) => setUser(prev => ({
                    ...prev,
                    password: e.target.value,
                    errors: { ...prev.errors, password: '' }
                  }))}
                  className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                    user.errors.password ? 'border-red-500' : 'border-[#2a2a2a]'
                  } focus:border-blue-500 text-white transition-all duration-300`}
                  placeholder="Enter your password"
                  required
                />
                {user.errors.password && (
                  <p className="text-red-400 text-sm mt-1 animate-fade-in">{user.errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Right side - Features */}
        <div className="w-1/2 bg-[#0f0f0f] p-8 flex items-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -top-[400px] -right-[400px] animate-pulse"></div>
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl -bottom-[300px] -left-[300px] animate-pulse delay-1000"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Cloud Platform</h2>
              <p className="text-gray-400 text-lg">Deploy and scale your applications with ease</p>
            </div>

            <div className="relative">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`absolute top-0 left-0 w-full transition-all duration-300 transform ${
                    index === currentFeature
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
                >
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 transform transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-3 bg-[#2a2a2a] rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-blue-500 w-8' : 'bg-[#2a2a2a]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Section with System Status */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.userId}</h1>
            <p className="text-gray-400">Here's what's happening with your AI instances</p>
          </div>
          <button
            onClick={() => setShowNewInstanceModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Launch New Instance
          </button>
        </div>
      </div>

      {/* Resource Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ResourceCard
          title="GPU Resources"
          icon={<Cpu className="w-5 h-5" />}
          usage={{ current: 16, total: 32, unit: 'GB' }}
          trend={{ value: 12, isPositive: true }}
        />
        <ResourceCard
          title="Memory Usage"
          icon={<Database className="w-5 h-5" />}
          usage={{ current: 192, total: 256, unit: 'GB' }}
          trend={{ value: 5, isPositive: false }}
        />
        <ResourceCard
          title="Storage Used"
          icon={<HardDrive className="w-5 h-5" />}
          usage={{ current: 450, total: 1000, unit: 'GB' }}
          trend={{ value: 8, isPositive: true }}
        />
        <ResourceCard
          title="Network Usage"
          icon={<Activity className="w-5 h-5" />}
          usage={{ current: 2.1, total: 10, unit: 'Gbps' }}
        />
          </div>
          
      {/* System Health */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {Object.entries(systemMetrics).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{key}</span>
                    <span className="text-white">{value}%</span>
            </div>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      className={`h-full rounded-full ${
                        value > 90 ? 'bg-red-500' :
                        value > 75 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                    />
                </div>
                </div>
              ))}
              </div>
          </motion.div>

          {/* Active Instances Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-medium text-white mb-4">Active Instances</h3>
            <div className="space-y-4">
              {instances.map((instance) => (
                <div key={instance.id} className="flex flex-col bg-black/20 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={instance.status} />
                      <div>
                        <h4 className="text-white font-medium">{instance.name}</h4>
                        <p className="text-sm text-gray-400">{instance.template}</p>
                </div>
                </div>
                    <div className="flex items-center gap-4">
                      {instance.status === 'running' && (
                        <>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{instance.uptime}</span>
              </div>
                          <a
                            href={instance.app_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm hover:bg-green-500/30 transition-colors"
                          >
                            Open App
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => instance.status === 'running' ? handleStopInstance(instance) : handleStartInstance(instance)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          instance.status === 'running'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {instance.status === 'running' ? 'Stop' : 'Start'}
                      </button>
                </div>
                </div>
                  {instance.status === 'running' && instance.gpu && (
                    <div className="p-4 grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">GPU Usage</span>
                          <span className="text-white">{instance.gpu.usage}%</span>
              </div>
                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${instance.gpu.usage}%` }}
                          />
            </div>
                        <p className="text-xs text-gray-400">{instance.gpu.name} ({instance.gpu.memory}GB)</p>
          </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Memory</span>
                          <span className="text-white">{instance.memory?.utilization}%</span>
                        </div>
                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${instance.memory?.utilization}%` }}
                          />
              </div>
                        <p className="text-xs text-gray-400">{instance.memory?.used}GB / {instance.memory?.total}GB</p>
            </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Storage</span>
                          <span className="text-white">
                            {instance.storage ? Math.round((instance.storage.used / instance.storage.size) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ 
                              width: instance.storage 
                                ? `${Math.round((instance.storage.used / instance.storage.size) * 100)}%`
                                : '0%'
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">
                          {instance.storage ? `${instance.storage.used}GB / ${instance.storage.size}GB` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/launch" className="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
                  <Plus className="w-6 h-6" />
              </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Launch Instance</h3>
                  <p className="text-sm text-gray-400">Create a new AI instance</p>
            </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/models" className="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
              <div>
                  <h3 className="text-lg font-medium text-white">Import Model</h3>
                  <p className="text-sm text-gray-400">Add a new AI model</p>
              </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/instances" className="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer"
                >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                  <Layout className="w-6 h-6" />
              </div>
                <div>
                  <h3 className="text-lg font-medium text-white">View Instances</h3>
                  <p className="text-sm text-gray-400">Manage running instances</p>
            </div>
          </div>
            </motion.div>
          </Link>
        </div>
            </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10"
        >
          {recentActivity.map((activity, index) => (
                <div 
              key={activity.id}
              className={`p-4 flex items-center justify-between ${
                index !== recentActivity.length - 1 ? 'border-b border-white/5' : ''
              }`}
                >
              <div className="flex items-center gap-4">
                <StatusIcon status={activity.status} />
                <div>
                  <h3 className="text-white font-medium">{activity.title}</h3>
                  <p className="text-sm text-gray-400">{activity.description}</p>
                  </div>
                </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {activity.timestamp}
            </div>
              </div>
          ))}
        </motion.div>
          </div>
    </div>
  );
} 

export default DashboardPage; 