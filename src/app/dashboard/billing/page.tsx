'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Clock,
  BarChart2,
  Calendar,
  HardDrive,
  Wifi,
  Server,
  Plus,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Download,
  Cpu,
  Activity,
  TrendingUp,
  Database,
  Zap,
  Clock4
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { BillingCard } from '../../../components/BillingCard';
import { CostOptimizationCard } from '../../../components/CostOptimizationCard';

// Sample data for charts
const usageData = [
  { name: 'Mon', compute: 45, storage: 30, egress: 20, network: 15 },
  { name: 'Tue', compute: 55, storage: 32, egress: 25, network: 18 },
  { name: 'Wed', compute: 65, storage: 35, egress: 30, network: 22 },
  { name: 'Thu', compute: 50, storage: 31, egress: 22, network: 16 },
  { name: 'Fri', compute: 70, storage: 38, egress: 35, network: 25 },
  { name: 'Sat', compute: 60, storage: 34, egress: 28, network: 20 },
  { name: 'Sun', compute: 75, storage: 40, egress: 38, network: 28 },
];

const monthlyTrend = [
  { name: 'Jan', actual: 1200, forecast: 1300 },
  { name: 'Feb', actual: 1400, forecast: 1450 },
  { name: 'Mar', actual: 1600, forecast: 1650 },
  { name: 'Apr', actual: 1300, forecast: 1400 },
  { name: 'May', actual: 1700, forecast: 1800 },
  { name: 'Jun', actual: 2000, forecast: 2100 },
];

const instanceUsage = [
  { name: 'ComfyUI', value: 400, hours: 120 },
  { name: 'Stable Diffusion', value: 300, hours: 90 },
  { name: 'TensorBoard', value: 200, hours: 60 },
  { name: 'Other', value: 100, hours: 30 },
];

const hourlyRates = [
  { hour: '00:00', rate: 0.8 },
  { hour: '04:00', rate: 0.6 },
  { hour: '08:00', rate: 1.2 },
  { hour: '12:00', rate: 1.5 },
  { hour: '16:00', rate: 1.8 },
  { hour: '20:00', rate: 1.0 },
];

const resourceUsage = [
  { name: 'GPU A100', used: 85, total: 100, cost: 450 },
  { name: 'GPU A10', used: 65, total: 100, cost: 280 },
  { name: 'Storage SSD', used: 400, total: 500, cost: 120 },
  { name: 'Network', used: 2.5, total: 5, cost: 75 },
];

const costBreakdown = [
  { name: 'Compute', value: 450, color: '#10b981' },
  { name: 'Storage', value: 120, color: '#6366f1' },
  { name: 'Network', value: 75, color: '#f59e0b' },
  { name: 'Other', value: 50, color: '#ef4444' },
];

const egressData = [
  { hour: '00:00', internal: 2.1, external: 1.4, cdn: 0.8 },
  { hour: '04:00', internal: 1.8, external: 1.2, cdn: 0.6 },
  { hour: '08:00', internal: 3.2, external: 2.5, cdn: 1.2 },
  { hour: '12:00', internal: 4.5, external: 3.8, cdn: 2.1 },
  { hour: '16:00', internal: 5.1, external: 4.2, cdn: 2.8 },
  { hour: '20:00', internal: 3.8, external: 2.9, cdn: 1.5 },
];

const instanceMetrics = [
  { hour: '00:00', gpu: 65, memory: 45, network: 30 },
  { hour: '04:00', gpu: 45, memory: 35, network: 25 },
  { hour: '08:00', gpu: 85, memory: 75, network: 60 },
  { hour: '12:00', gpu: 95, memory: 85, network: 70 },
  { hour: '16:00', gpu: 90, memory: 80, network: 65 },
  { hour: '20:00', gpu: 70, memory: 60, network: 40 },
];

const costOptimization = [
  { category: 'Idle Instances', potential: 120, priority: 'High' },
  { category: 'Oversized GPUs', potential: 85, priority: 'Medium' },
  { category: 'Unused Storage', potential: 45, priority: 'Low' },
  { category: 'Network Optimization', potential: 30, priority: 'Low' },
];

const regionUsage = [
  { region: 'US East', compute: 250, storage: 120, network: 80 },
  { region: 'US West', compute: 180, storage: 90, network: 60 },
  { region: 'EU Central', compute: 210, storage: 110, network: 70 },
  { region: 'Asia Pacific', compute: 160, storage: 80, network: 50 },
];

interface BillingInstance {
  id: string;
  name: string;
  usage: {
    compute: number;
    storage: number;
    egress: number;
  };
  totalCost: number;
  status: 'active' | 'stopped';
  lastBilled: string;
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export default function BillingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedView, setSelectedView] = useState('overview');
  const [instances] = useState<BillingInstance[]>([
    {
      id: '1',
      name: 'ComfyUI Instance',
      usage: {
        compute: 245.50,
        storage: 32.20,
        egress: 18.75
      },
      totalCost: 296.45,
      status: 'active',
      lastBilled: '2024-03-15 14:30:00'
    },
    {
      id: '2',
      name: 'Stable Diffusion WebUI',
      usage: {
        compute: 178.25,
        storage: 45.80,
        egress: 22.40
      },
      totalCost: 246.45,
      status: 'active',
      lastBilled: '2024-03-15 13:45:00'
    }
  ]);

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'mastercard',
      last4: '8888',
      expiry: '08/26',
      isDefault: false
    }
  ]);

  const balance = 750.00;
  const totalSpent = 542.90;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* View Selection */}
      <div className="flex items-center gap-4 mb-8">
        {['overview', 'instances', 'payment'].map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === view
                ? 'bg-emerald-500 text-black'
                : 'bg-black/20 text-gray-400 hover:text-white'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BillingCard
              title="Available Balance"
              amount={balance}
              icon={<DollarSign className="w-5 h-5" />}
              trend={12}
              trendType="up"
            />
            <BillingCard
              title="Total Spent"
              amount={totalSpent}
              icon={<BarChart2 className="w-5 h-5" />}
              trend={8}
              trendType="up"
            />
            <BillingCard
              title="Storage Cost"
              amount={78}
              icon={<HardDrive className="w-5 h-5" />}
              trend={5}
              trendType="down"
            />
            <BillingCard
              title="Egress Cost"
              amount={41.15}
              icon={<Wifi className="w-5 h-5" />}
              trend={15}
              trendType="up"
            />
          </div>

          {/* Egress Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Egress Analytics</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Total Today:</span>
                <span className="text-sm font-medium text-white">2.45 TB</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={egressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                  <XAxis dataKey="hour" stroke="#6ee7b7" />
                  <YAxis stroke="#6ee7b7" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="internal"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    name="Internal Traffic"
                  />
                  <Area
                    type="monotone"
                    dataKey="external"
                    stackId="1"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    name="External Traffic"
                  />
                  <Area
                    type="monotone"
                    dataKey="cdn"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    name="CDN Traffic"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Instance Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10 mb-8"
          >
            <h3 className="text-lg font-medium text-white mb-6">Instance Performance Metrics</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={instanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                  <XAxis dataKey="hour" stroke="#6ee7b7" />
                  <YAxis stroke="#6ee7b7" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpu"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="GPU Usage %"
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                    name="Memory Usage %"
                  />
                  <Line
                    type="monotone"
                    dataKey="network"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                    name="Network Usage %"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Cost Optimization & Regional Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost Optimization Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Cost Optimization</h3>
                <span className="text-sm text-emerald-400">Potential Savings: $280</span>
              </div>
              <CostOptimizationCard
                recommendations={[
                  {
                    title: "Idle Instances",
                    description: "Terminate or hibernate instances that have been idle for more than 48 hours",
                    savingsAmount: 120,
                    difficulty: "easy"
                  },
                  {
                    title: "Oversized GPUs",
                    description: "Consider downsizing GPUs for workloads with low utilization",
                    savingsAmount: 85,
                    difficulty: "medium"
                  },
                  {
                    title: "Unused Storage",
                    description: "Clean up or archive unused storage volumes",
                    savingsAmount: 45,
                    difficulty: "hard"
                  },
                  {
                    title: "Network Optimization",
                    description: "Optimize data transfer patterns to reduce egress costs",
                    savingsAmount: 30,
                    difficulty: "medium"
                  }
                ]}
              />
            </motion.div>

            {/* Regional Usage Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
            >
              <h3 className="text-lg font-medium text-white mb-6">Regional Usage</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                    <XAxis dataKey="region" stroke="#6ee7b7" />
                    <YAxis stroke="#6ee7b7" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Bar dataKey="compute" stackId="a" fill="#10b981" name="Compute" />
                    <Bar dataKey="storage" stackId="a" fill="#6366f1" name="Storage" />
                    <Bar dataKey="network" stackId="a" fill="#f59e0b" name="Network" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {selectedView === 'instances' && (
        <div className="space-y-6">
          {instances.map((instance) => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Server className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-medium text-white">{instance.name}</h3>
                    <p className="text-sm text-gray-400">Last billed: {instance.lastBilled}</p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    instance.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Compute Cost</p>
                  <p className="text-2xl font-bold text-white">${instance.usage.compute.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Storage Cost</p>
                  <p className="text-2xl font-bold text-white">${instance.usage.storage.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Egress Cost</p>
                  <p className="text-2xl font-bold text-white">${instance.usage.egress.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-white">${instance.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedView === 'payment' && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Payment Methods</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add New Card
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-emerald-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CreditCard className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {method.type.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-400">Expires {method.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {method.isDefault && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                        Default
                      </span>
                    )}
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
          >
            <h3 className="text-lg font-medium text-white mb-6">Billing History</h3>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-emerald-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Calendar className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">March 2024 Invoice</p>
                      <p className="text-sm text-gray-400">Processed on Mar 1, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">$299.99</span>
                    <button className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 