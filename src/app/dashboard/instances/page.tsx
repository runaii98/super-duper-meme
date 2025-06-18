'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Box, Cpu, Database, HardDrive, Power, Globe, Gauge, Wand2, Sparkles, StopCircle, Search } from 'lucide-react';
import { ContainerResponse, ContainerStatusType } from '@/services/api';
import { formatBytes } from '@/utils/format';
import { Toast } from '@/components/Toast';
import { useNotificationStore } from '@/stores/notificationStore';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean } | null;
}

// Mock data moved outside component
const MOCK_INSTANCES: ContainerResponse[] = [
  {
    id: "instance-1",
    name: "ComfyUI Instance 1",
    status: "running" as ContainerStatusType,
    template: "comfyui",
    gpu: {
      type: "T4",
      memory: 16,
      name: "NVIDIA Tesla T4",
      usage: 45,
      temperature: 65
    },
    storage: {
      type: "ssd",
      size: 100,
      used: 45,
      readSpeed: 500,
      writeSpeed: 400
    },
    app_url: "http://localhost:3000",
    message: "Running normally",
    uptime: "2h 30m",
    memory: {
      total: 32,
      used: 16,
      utilization: 50
    }
  },
  {
    id: "instance-2",
    name: "Stable Diffusion Instance",
    status: "stopped" as ContainerStatusType,
    template: "stable-diffusion",
    gpu: {
      type: "A100",
      memory: 80,
      name: "NVIDIA A100",
      usage: 0,
      temperature: 35
    },
    storage: {
      type: "nvme",
      size: 500,
      used: 125,
      readSpeed: 2000,
      writeSpeed: 1800
    },
    message: "Stopped",
    memory: {
      total: 64,
      used: 0,
      utilization: 0
    }
  }
] as const;

// Template Icons/Logos
const TemplateIcons = {
  comfyui: () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
      <Wand2 className="w-4 h-4" />
      <span className="text-xs font-medium">ComfyUI</span>
    </div>
  ),
  'stable-diffusion': () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg">
      <Sparkles className="w-4 h-4" />
      <span className="text-xs font-medium">Stable Diffusion</span>
    </div>
  ),
};

// GPU Brand Icons/Logos
const GpuLogos = {
  T4: () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18v12H3V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 9h10v6H7V9z" stroke="currentColor" strokeWidth="2"/>
      </svg>
      <span className="text-xs font-medium">NVIDIA T4</span>
    </div>
  ),
  A100: () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18v12H3V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 9h10v6H7V9z" stroke="currentColor" strokeWidth="2"/>
      </svg>
      <span className="text-xs font-medium">NVIDIA A100</span>
    </div>
  ),
};

// Memoized Stats Card Component
const StatsCard = memo(({ title, value, icon, trend = null }: StatsCardProps & { trend?: { value: number; isPositive: boolean } | null }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/20 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-green-500/5 text-green-500 group-hover:bg-green-500/10 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <div className="flex items-end gap-3">
          <p className="text-2xl font-semibold text-white">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
));

StatsCard.displayName = 'StatsCard';

interface InstanceCardProps {
  instance: ContainerResponse;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'loading';
}

// Status Indicator Component
const StatusIndicator = memo(({ status }: { status: string }) => {
  const isRunning = status === 'running';
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex">
        <div className={`w-3 h-3 rounded-full ${
          isRunning ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Pulsing animation for running status */}
        {isRunning && (
          <>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          </>
        )}
      </div>
      <span className={`text-sm font-medium ${
        isRunning ? 'text-green-400' : 'text-red-400'
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

// Memoized Instance Card Component
const InstanceCard = memo(({ instance, onAction }: InstanceCardProps & { onAction: (instance: ContainerResponse, action: 'start' | 'stop') => void }) => {
  const GpuLogo = instance.gpu?.type && GpuLogos[instance.gpu.type as keyof typeof GpuLogos];
  const TemplateIcon = instance.template && TemplateIcons[instance.template as keyof typeof TemplateIcons];

  const handleAction = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the action button
    onAction(instance, instance.status === 'running' ? 'stop' : 'start');
  }, [instance, onAction]);

  return (
    <Link href={`/dashboard/instances/${instance.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-black/20 backdrop-blur-lg rounded-xl p-6 border transition-all hover:shadow-lg cursor-pointer ${
          instance.status === 'running'
            ? 'border-green-500/20 hover:border-green-500/50 hover:shadow-green-500/10'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {TemplateIcon && <TemplateIcon />}
              <StatusIndicator status={instance.status} />
            </div>
            <h3 className="text-xl font-semibold text-white">{instance.name}</h3>
            {GpuLogo && <GpuLogo />}
          </div>
          <button
            onClick={handleAction}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              instance.status === 'running'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
            }`}
          >
            {instance.status === 'running' ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-400">
              <Box className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm">
                Template: <span className="text-white">{instance.template}</span>
              </span>
            </div>
            <div className="flex items-center text-gray-400">
              <Cpu className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm">
                GPU Memory: <span className="text-white">{instance.gpu?.memory}GB</span>
              </span>
            </div>
            <div className="flex items-center text-gray-400">
              <Database className="w-4 h-4 mr-2 text-emerald-400" />
              <span className="text-sm">
                RAM: <span className="text-white">32GB</span>
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center text-gray-400">
              <HardDrive className="w-4 h-4 mr-2 text-amber-400" />
              <span className="text-sm">
                Storage: <span className="text-white">{instance.storage?.size}GB</span>
              </span>
            </div>
            <div className="flex items-center text-gray-400">
              <Gauge className="w-4 h-4 mr-2 text-rose-400" />
              <span className="text-sm">
                Used: <span className="text-white">45%</span>
              </span>
            </div>
            {instance.status === 'running' && (
              <div className="flex items-center text-gray-400">
                <Globe className="w-4 h-4 mr-2 text-sky-400" />
                <a 
                  href="http://localhost:3000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open App URL
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Usage Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>GPU Usage</span>
              <span>75%</span>
            </div>
            <div className="h-1.5 bg-purple-500/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Memory Usage</span>
              <span>60%</span>
            </div>
            <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Storage Usage</span>
              <span>45%</span>
            </div>
            <div className="h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

InstanceCard.displayName = 'InstanceCard';

export default function InstancesPage() {
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const { addNotification } = useNotificationStore();
  const [instances] = useState(MOCK_INSTANCES);

  const filteredInstances = instances.filter(instance => {
    if (filter === 'all') return true;
    return instance.status === filter;
  });

  const statistics = {
    total: instances.length,
    running: instances.filter(i => i.status === "running").length,
    stopped: instances.filter(i => i.status === "stopped").length,
    totalMemory: instances.reduce((acc, i) => acc + (i.gpu?.memory || 0), 0),
    totalStorage: instances.reduce((acc, i) => acc + (i.storage?.size || 0), 0)
  };

  const handleFilterChange = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter);
  }, []);

  const handleInstanceAction = useCallback(async (instance: ContainerResponse, action: 'start' | 'stop') => {
    const isStarting = action === 'start';
    const toastMessage = isStarting ? 'Starting instance...' : 'Stopping instance...';
    const notificationMessage = isStarting 
      ? `Starting VM instance "${instance.name}"`
      : `Stopping VM instance "${instance.name}"`;

    // Show loading toast
    setToast({
      message: toastMessage,
      type: 'loading'
    });

    // Add loading notification
    const notificationId = Math.random().toString(36).substring(7);
    addNotification({
      message: notificationMessage,
      type: 'loading'
    });

    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update toast and notification on success
      const successMessage = isStarting 
        ? `Instance "${instance.name}" started successfully`
        : `Instance "${instance.name}" stopped successfully`;
      
      setToast({
        message: successMessage,
        type: 'success'
      });

      addNotification({
        message: successMessage,
        type: 'success'
      });
    } catch (error) {
      // Handle error
      const errorMessage = isStarting 
        ? `Failed to start instance "${instance.name}"`
        : `Failed to stop instance "${instance.name}"`;
      
      setToast({
        message: errorMessage,
        type: 'error'
      });

      addNotification({
        message: errorMessage,
        type: 'error'
      });
    }
  }, [addNotification]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Instances Overview</h1>
          <p className="text-gray-400">Manage and monitor your running instances</p>
        </div>
        <Link 
          href="/launch"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors font-medium"
        >
          <Power className="w-4 h-4" />
          Launch New Instance
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Running Instances"
          value={statistics.running}
          icon={<Power className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total GPU Usage"
          value={formatBytes(statistics.totalMemory)}
          icon={<Cpu className="w-5 h-5" />}
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Total Storage"
          value={formatBytes(statistics.totalStorage)}
          icon={<Database className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Active Users"
          value="3"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            {(['all', 'running', 'stopped'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleFilterChange(option)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === option
                    ? 'bg-green-500 text-black font-medium shadow-lg shadow-green-500/20'
                    : 'bg-black/50 text-gray-400 hover:bg-green-500/10 hover:text-green-500'
                }`}
              >
                {option === 'all' && <Box className="w-4 h-4 inline mr-2" />}
                {option === 'running' && <Power className="w-4 h-4 inline mr-2" />}
                {option === 'stopped' && <StopCircle className="w-4 h-4 inline mr-2" />}
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search instances..."
              className="w-64 px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
            />
            <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredInstances.length > 0 ? (
              filteredInstances.map((instance) => (
                <InstanceCard 
                  key={instance.id} 
                  instance={instance} 
                  onAction={handleInstanceAction}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400"
              >
                <Box className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg mb-2">No instances found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 