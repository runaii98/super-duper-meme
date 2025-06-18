import { motion } from 'framer-motion';
import React from 'react';

interface Recommendation {
  title: string;
  description: string;
  savingsAmount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CostOptimizationCardProps {
  recommendations: Recommendation[];
}

export const CostOptimizationCard: React.FC<CostOptimizationCardProps> = ({ recommendations }) => {
  const getDifficultyColor = (difficulty: Recommendation['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-400';
      case 'medium':
        return 'text-amber-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/10"
    >
      <h3 className="text-xl font-semibold text-white mb-4">Cost Optimization</h3>
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-black/40 rounded-lg border border-emerald-500/10 hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{rec.title}</h4>
              <span className="text-emerald-400 font-medium">
                ${rec.savingsAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-2">{rec.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Difficulty:</span>
              <span className={`text-xs ${getDifficultyColor(rec.difficulty)} capitalize`}>
                {rec.difficulty}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 