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
      className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div className={`p-3 rounded-xl border ${styles} group-hover:scale-105 transition-transform duration-300`}>
            {icon}
          </div>
        )}
        {tendance && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {tendance}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <h4 className={`text-2xl font-bold tracking-tight ${important ? 'text-red-600' : 'text-slate-900'}`}>
            {valeur}
          </h4>
          {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
        </div>
        {subtext && <p className="text-[11px] font-medium text-slate-500 mt-1">{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
