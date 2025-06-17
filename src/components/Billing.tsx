'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
}

const usageMetrics: UsageMetric[] = [
  {
    name: 'Compute Hours',
    current: 145,
    limit: 200,
    unit: 'hours'
  },
  {
    name: 'Storage Used',
    current: 420,
    limit: 500,
    unit: 'GB'
  },
  {
    name: 'Data Transfer',
    current: 890,
    limit: 1000,
    unit: 'GB'
  }
];

const recentInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    date: '2024-04-01',
    amount: '$199.00',
    status: 'paid'
  },
  {
    id: 'INV-2024-002',
    date: '2024-03-01',
    amount: '$189.50',
    status: 'paid'
  },
  {
    id: 'INV-2024-003',
    date: '2024-02-01',
    amount: '$205.75',
    status: 'paid'
  }
];

const Billing: React.FC = () => {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Usage</h1>
          <p className="text-gray-400">Manage your subscription and monitor resource usage</p>
        </div>

        {/* Current Plan */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Pro Plan</h2>
              <p className="text-gray-400">Your plan renews on May 1, 2024</p>
            </div>
            <button className="px-4 py-2 bg-[#1cfeba] text-black rounded-lg font-medium hover:bg-[#1cfeba]/90 transition-colors">
              Upgrade Plan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {usageMetrics.map((metric, index) => (
              <div key={index} className="bg-black/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">{metric.name}</span>
                  <span className="text-[#1cfeba]">
                    {metric.current}/{metric.limit} {metric.unit}
                  </span>
                </div>
                <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                  <div
                    className="bg-[#1cfeba] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metric.current / metric.limit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" fill="#1a1a1a"/>
                  <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <p className="text-white">Visa ending in 4242</p>
                <p className="text-gray-400 text-sm">Expires 12/25</p>
              </div>
            </div>
            <button className="text-[#1cfeba] hover:text-[#1cfeba]/80 transition-colors">
              Update
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#2a2a2a]">
                  <th className="pb-4 text-gray-400 font-medium">Invoice</th>
                  <th className="pb-4 text-gray-400 font-medium">Date</th>
                  <th className="pb-4 text-gray-400 font-medium">Amount</th>
                  <th className="pb-4 text-gray-400 font-medium">Status</th>
                  <th className="pb-4 text-gray-400 font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-4 text-white">{invoice.id}</td>
                    <td className="py-4 text-white">{invoice.date}</td>
                    <td className="py-4 text-white">{invoice.amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                        invoice.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-[#1cfeba] hover:text-[#1cfeba]/80 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing; 