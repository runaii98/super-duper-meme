'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { api } from '@/services/api';

interface ContainerStatus {
  status: 'running' | 'stopped' | 'loading' | 'starting' | 'stopping' | 'not_found' | 'booting';
  app_url?: string;
  message?: string;
  id?: string;
  name?: string;
  gpu?: {
    name: string;
    memory: string;
    usage: number;
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

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>({ 
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
  const [instances, setInstances] = useState<ContainerStatus[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);

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
      await api.register({ userId: user.userId, password: user.password });
      setUser(prev => ({ ...prev, isLoggedIn: true }));
      checkContainerStatus();
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#111111] border-r border-[#2a2a2a] p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold">ComfyUI</span>
        </div>

        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>Settings</span>
          </a>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => setUser(prev => ({ ...prev, isLoggedIn: false }))}
            className="w-full px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 11H7a1 1 0 100-2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.userId}</h1>
            <p className="text-gray-400 mt-1">Manage your ComfyUI instance</p>
          </div>
          
          <button className="px-4 py-2 rounded-lg bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] transition-colors flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Help</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            {/* Launch New App Section */}
            <div className="text-center mb-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-6 transform rotate-45 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white -rotate-45" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Launch your New App</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">Start your ComfyUI instance and begin creating amazing AI-powered experiences</p>
              <button
                onClick={() => setShowNewInstanceModal(true)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Launch Instance</span>
              </button>
            </div>

            {/* Feature Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Image Generation Box */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transform transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/50">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Image Generation</h3>
                <p className="text-gray-400 text-sm mb-4">Create stunning AI-generated images with advanced models and customizable workflows</p>
                <div className="flex items-center text-pink-400 text-sm">
                  <span>Learn more</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Video Generation Box */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transform transition-all duration-300 hover:scale-[1.02] hover:border-green-500/50">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Video Generation</h3>
                <p className="text-gray-400 text-sm mb-4">Transform your ideas into captivating videos with AI-powered animation and effects</p>
                <div className="flex items-center text-green-400 text-sm">
                  <span>Coming soon</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Cloud Deployment Box */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] transform transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Cloud Deployment</h3>
                <p className="text-gray-400 text-sm mb-4">Deploy your models to the cloud with one click and scale automatically based on demand</p>
                <div className="flex items-center text-purple-400 text-sm">
                  <span>Explore features</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Existing grid of instances code
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Instance Card */}
            <div 
              onClick={() => setShowNewInstanceModal(true)}
              className="bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-[#1f1f1f] transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Launch New Instance</h3>
              <p className="text-gray-400 text-sm text-center">Create a new ComfyUI instance</p>
            </div>

            {/* Instance Cards */}
            {instances.map((instance, index) => (
              <div key={instance.id || index} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 7H7v6h6V7z" />
                          <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{instance.name || `Instance ${index + 1}`}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${
                            instance.status === 'running' ? 'bg-green-400 animate-[pulse_1s_ease-in-out_infinite]' :
                            instance.status === 'starting' || instance.status === 'booting' ? 'bg-yellow-400 animate-[pulse_1s_ease-in-out_infinite]' :
                            'bg-red-400'
                          }`} />
                          <span className={`text-sm ${
                            instance.status === 'running' ? 'text-green-400' :
                            instance.status === 'starting' || instance.status === 'booting' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {getStatusDisplay(instance.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* GPU Status */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        <span>{instance.gpu?.name || 'NVIDIA T4'}</span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <div className="h-1.5 w-24 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                            style={{ width: `${instance.gpu?.usage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{instance.gpu?.memory || '16GB'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {instance.status === 'running' && instance.app_url && (
                      <a
                        href={instance.app_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        <span className="truncate">{instance.app_url}</span>
                      </a>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartContainer(instance.id);
                        }}
                        disabled={isLoading || instance.status === 'running' || instance.status === 'starting' || instance.status === 'booting'}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>Start</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopContainer(instance.id);
                        }}
                        disabled={isLoading || instance.status === 'stopped' || instance.status === 'stopping'}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Instance Modal */}
      {showNewInstanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Launch New Instance</h3>
              <p className="text-gray-400">Create a new ComfyUI instance</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Instance Name</label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] focus:border-blue-500 text-white transition-all duration-300"
                  placeholder="Enter instance name"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewInstanceModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleStartContainer();
                    setShowNewInstanceModal(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all duration-300"
                >
                  Launch Instance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Sequence Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mx-auto flex items-center justify-center mb-4">
                {launchStages[currentStage].icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{launchStages[currentStage].message}</h3>
              <p className="text-gray-400">{launchStages[currentStage].description}</p>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-3 gap-4">
              {launchStages.map((stage, index) => (
                <div 
                  key={stage.message}
                  className={`p-4 rounded-lg border ${
                    index === currentStage ? 'border-blue-500/50 bg-blue-500/10' :
                    progress >= ((index + 1) * 33.33) ? 'border-green-500/50 bg-green-500/10' :
                    'border-[#2a2a2a] bg-[#222]'
                  } transition-all duration-300`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {progress >= ((index + 1) * 33.33) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : index === currentStage ? (
                      <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-[#2a2a2a]" />
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-400">{stage.message}</p>
                </div>
              ))}
            </div>

            {launchComplete && (
              <div className="mt-6 text-center">
                <p className="text-green-400 mb-2">Launch Complete!</p>
                <p className="text-sm text-gray-400">Redirecting to your instance...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 