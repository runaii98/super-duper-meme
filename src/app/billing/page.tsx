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
  Download
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
  Cell
} from 'recharts';

// Sample data for charts
const usageData = [
  { name: 'Mon', compute: 45, storage: 30, egress: 20 },
  { name: 'Tue', compute: 55, storage: 32, egress: 25 },
  { name: 'Wed', compute: 65, storage: 35, egress: 30 },
  { name: 'Thu', compute: 50, storage: 31, egress: 22 },
  { name: 'Fri', compute: 70, storage: 38, egress: 35 },
  { name: 'Sat', compute: 60, storage: 34, egress: 28 },
  { name: 'Sun', compute: 75, storage: 40, egress: 38 },
];

const monthlyTrend = [
  { name: 'Jan', amount: 1200 },
  { name: 'Feb', amount: 1400 },
  { name: 'Mar', amount: 1600 },
  { name: 'Apr', amount: 1300 },
  { name: 'May', amount: 1700 },
  { name: 'Jun', amount: 2000 },
];

const instanceUsage = [
  { name: 'ComfyUI', value: 400 },
  { name: 'Stable Diffusion', value: 300 },
  { name: 'TensorBoard', value: 200 },
  { name: 'Other', value: 100 },
];

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

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

const BillingPage = () => {
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

  const BillingCard = ({ title, amount, icon, trend, trendType }: { 
    title: string;
    amount: number;
    icon: React.ReactNode;
    trend?: number;
    trendType?: 'up' | 'down';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10 hover:border-emerald-500/20 transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
            {icon}
          </div>
          <h3 className="text-gray-400 font-medium">{title}</h3>
        </div>
        {trend && (
          <div className={`text-sm ${trendType === 'up' ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1`}>
            {trendType === 'up' ? '↑' : '↓'} {trend}%
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-white">${amount.toFixed(2)}</p>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full" 
            style={{ width: `${Math.min((amount / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );

  const PeriodSelector = () => (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-lg rounded-lg p-1 border border-emerald-500/10">
      {['daily', 'weekly', 'monthly'].map((period) => (
        <button
          key={period}
          onClick={() => setSelectedPeriod(period)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedPeriod === period
              ? 'bg-emerald-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </button>
      ))}
    </div>
  );

  const ViewSelector = () => (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-lg rounded-lg p-1 border border-emerald-500/10">
      {['overview', 'instances', 'payment'].map((view) => (
        <button
          key={view}
          onClick={() => setSelectedView(view)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedView === view
              ? 'bg-emerald-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2">Billing & Usage</h1>
        <p className="text-gray-400">Monitor your spending and manage payment methods</p>
      </div>

      {/* View Selector */}
      <div className="flex justify-between items-center mb-8">
        <ViewSelector />
        <PeriodSelector />
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

          {/* Usage Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
            >
              <h3 className="text-lg font-medium text-white mb-6">Cost Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                    <XAxis dataKey="name" stroke="#6ee7b7" />
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
                      dataKey="compute"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="storage"
                      stackId="1"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="egress"
                      stackId="1"
                      stroke="#047857"
                      fill="#047857"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Instance Usage Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
            >
              <h3 className="text-lg font-medium text-white mb-6">Instance Usage Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={instanceUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {instanceUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`rgb(16, 185, 129, ${1 - index * 0.2})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '0.5rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {instanceUsage.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `rgb(16, 185, 129, ${1 - index * 0.2})` }}
                    />
                    <span className="text-sm text-gray-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10 mb-8"
          >
            <h3 className="text-lg font-medium text-white mb-6">Monthly Spending Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                  <XAxis dataKey="name" stroke="#6ee7b7" />
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
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
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
                <div className={`px-3 py-1 rounded-full text-sm ${
                  instance.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
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
};

export default BillingPage; 