import { motion } from 'framer-motion';
import React from 'react';

interface BillingCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  trend?: number;
  trendType?: 'up' | 'down';
}

export const BillingCard: React.FC<BillingCardProps> = ({ title, amount, icon, trend, trendType }) => (
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