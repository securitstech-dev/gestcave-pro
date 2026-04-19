import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  label: string;
  valeur: string | number;
  suffix?: string;
  subtext?: string;
  icon?: React.ReactNode;
  color: 'emerald' | 'blue' | 'indigo' | 'red' | 'rose' | 'orange' | 'slate';
  tendance?: string;
  important?: boolean;
}

const colorStyles = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100'
};

const StatCard = ({ label, valeur, suffix = "", subtext, icon, color, tendance, important = false }: StatCardProps) => {
  const styles = colorStyles[color] || colorStyles.slate;
  const isPositive = tendance?.includes('+');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-sovereign p-6 transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div className={`p-3 border-none bg-white text-primary-sovereign group-hover:bg-surface-highest transition-colors duration-300`}>
            {icon}
          </div>
        )}
        {tendance && (
          <div className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold ${
            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-highest text-slate-600'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {tendance}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
          <h4 className={`text-2xl font-bold tracking-tight ${important ? 'text-accent-sovereign' : 'text-primary-sovereign'}`}>
            {valeur}
          </h4>
          {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
        </div>
        {subtext && <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
