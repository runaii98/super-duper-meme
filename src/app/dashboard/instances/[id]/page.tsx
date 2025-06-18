'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Cpu, 
  HardDrive, 
  CircleEqual, 
  Clock, 
  Activity, 
  Globe, 
  ArrowUpRight,
  Gauge,
  Thermometer,
  Power,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Toast } from '@/components/Toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
      }
    }
  }
};

// Mock data generator for charts
const generateTimeSeriesData = (hours = 24) => {
  const data = [];
  const now = new Date();
  for (let i = hours; i > 0; i--) {
    data.push({
      time: new Date(now.getTime() - (i * 3600000)).toLocaleTimeString(),
      value: Math.random() * 100
    });
  }
  return data;
};

export default function InstanceDetailsPage({ params }: { params: { id: string } }) {
  const [instance, setInstance] = useState({
    id: params.id,
    name: "ComfyUI Instance 1",
    status: "running",
    template: "comfyui",
    gpu: {
      type: "NVIDIA T4",
      memory: 16,
      temperature: 65,
      utilization: 75
    },
    storage: {
      size: 100,
      used: 45,
      readSpeed: 450,
      writeSpeed: 280
    },
    memory: {
      total: 32,
      used: 19.2,
      utilization: 60
    },
    uptime: "2 days 5 hours",
    url: "http://localhost:3000"
  });

  const [metrics] = useState({
    gpu: generateTimeSeriesData(),
    memory: generateTimeSeriesData(),
    storage: generateTimeSeriesData(),
    network: generateTimeSeriesData()
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const { addNotification } = useNotificationStore();

  const handleInstanceAction = useCallback(async (action: 'start' | 'stop') => {
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
    addNotification({
      message: notificationMessage,
      type: 'loading'
    });

    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update instance status
      setInstance(prev => ({
        ...prev,
        status: isStarting ? 'running' : 'stopped'
      }));

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
  }, [instance.name, addNotification]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{instance.name}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              instance.status === 'running' 
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {instance.status}
            </span>
            <span className="text-gray-400">Template: {instance.template}</span>
            <span className="text-gray-400">Uptime: {instance.uptime}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {instance.status === 'running' ? (
            <>
              <a
                href={instance.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Open App</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleInstanceAction('stop')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Instance</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleInstanceAction('start')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Instance</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">GPU Utilization</p>
              <p className="text-2xl font-semibold text-white">{instance.gpu.utilization}%</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {instance.gpu.type} • {instance.gpu.memory}GB VRAM
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CircleEqual className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="text-2xl font-semibold text-white">{instance.memory.utilization}%</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {instance.memory.used}GB / {instance.memory.total}GB
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Storage Used</p>
              <p className="text-2xl font-semibold text-white">{instance.storage.used}%</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {instance.storage.used}GB / {instance.storage.size}GB
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Thermometer className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">GPU Temperature</p>
              <p className="text-2xl font-semibold text-white">{instance.gpu.temperature}°C</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Optimal Range: 30-85°C
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* GPU Usage Chart */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">GPU Usage Over Time</h3>
          <div className="h-[300px]">
            <Line
              options={chartOptions}
              data={{
                labels: metrics.gpu.map(d => d.time),
                datasets: [{
                  label: 'GPU Utilization',
                  data: metrics.gpu.map(d => d.value),
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
            />
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Memory Usage Over Time</h3>
          <div className="h-[300px]">
            <Line
              options={chartOptions}
              data={{
                labels: metrics.memory.map(d => d.time),
                datasets: [{
                  label: 'Memory Usage',
                  data: metrics.memory.map(d => d.value),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
            />
          </div>
        </div>

        {/* Disk Speed Chart */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Storage Performance</h3>
          <div className="h-[300px]">
            <Line
              options={chartOptions}
              data={{
                labels: metrics.storage.map(d => d.time),
                datasets: [
                  {
                    label: 'Read Speed (MB/s)',
                    data: metrics.storage.map(d => d.value),
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Write Speed (MB/s)',
                    data: metrics.storage.map(d => d.value * 0.7),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                  }
                ]
              }}
            />
          </div>
        </div>

        {/* Network Usage Chart */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Network Activity</h3>
          <div className="h-[300px]">
            <Line
              options={chartOptions}
              data={{
                labels: metrics.network.map(d => d.time),
                datasets: [{
                  label: 'Network Usage (MB/s)',
                  data: metrics.network.map(d => d.value),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 