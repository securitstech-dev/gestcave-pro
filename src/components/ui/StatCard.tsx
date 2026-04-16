import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  valeur: string | number;
  suffix?: string;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
  tendance?: string;
  important?: boolean;
  variant?: 'default' | 'large' | 'admin';
}

const colorMap: Record<string, any> = {
  emerald: {
    adminBg: 'bg-emerald-100', adminText: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20', iconText: 'text-emerald-400',
    blob: 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
  },
  blue: {
    adminBg: 'bg-blue-100', adminText: 'text-blue-600',
    iconBg: 'bg-blue-500/10', iconBorder: 'border-blue-500/20', iconText: 'text-blue-400',
    blob: 'bg-blue-500/10 group-hover:bg-blue-500/20'
  },
  indigo: {
    adminBg: 'bg-indigo-100', adminText: 'text-indigo-600',
    iconBg: 'bg-indigo-500/10', iconBorder: 'border-indigo-500/20', iconText: 'text-indigo-400',
    blob: 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
  },
  red: {
    adminBg: 'bg-red-100', adminText: 'text-red-600',
    iconBg: 'bg-red-500/10', iconBorder: 'border-red-500/20', iconText: 'text-red-400',
    blob: 'bg-red-500/10 group-hover:bg-red-500/20'
  },
  rose: {
    adminBg: 'bg-rose-100', adminText: 'text-rose-600',
    iconBg: 'bg-rose-500/10', iconBorder: 'border-rose-500/20', iconText: 'text-rose-400',
    blob: 'bg-rose-500/10 group-hover:bg-rose-500/20'
  },
  orange: {
    adminBg: 'bg-orange-100', adminText: 'text-orange-600',
    iconBg: 'bg-orange-500/10', iconBorder: 'border-orange-500/20', iconText: 'text-orange-400',
    blob: 'bg-orange-500/10 group-hover:bg-orange-500/20'
  }
};

const StatCard = ({ label, valeur, suffix = "", subtext, icon, color, tendance, important = false, variant = 'default' }: StatCardProps) => {
  const isLarge = variant === 'large';
  const isAdmin = variant === 'admin';
  const styles = colorMap[color] || colorMap['indigo'];
  
  if (isAdmin) {
    return (
      <div className={`p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group`}>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`p-3 rounded-xl ${styles.adminBg} ${styles.adminText}`}>
            {icon}
          </div>
          {tendance ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest ${
                tendance.includes('+') 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
                <ArrowUpRight size={12} /> {tendance}
            </div>
          ) : null}
        </div>
        <div className="relative z-10 mt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
              <h4 className={`text-2xl font-bold ${important ? 'text-red-600' : 'text-slate-900'}`}>
                {valeur}
              </h4>
              {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
          </div>
          {subtext && <p className="text-xs font-medium text-slate-500 mt-1">{subtext}</p>}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -5, scale: isLarge ? 1.02 : 1 }}
      className={`${isLarge ? 'p-10 rounded-3xl h-[300px]' : 'p-8 glass-panel'} bg-white/5 border border-white/10 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:border-white/20`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${!isLarge ? '-mr-12 -mt-12' : ''} ${styles.blob} ${isLarge ? 'blur-3xl' : 'blur-2xl'} rounded-full group-hover:scale-150 transition-all duration-700`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-4 rounded-3xl ${styles.iconBg} border ${styles.iconBorder} ${styles.iconText} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {tendance ? (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-tighter ${
              tendance.includes('+') 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-white/10 border border-white/10 text-white'
          }`}>
              <ArrowUpRight size={12} /> {tendance}
          </div>
        ) : (
          <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase">Snapshot</div>
        )}
      </div>

      <div className="relative z-10 mt-auto pt-4">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
            <h4 className={`${isLarge ? 'text-5xl' : 'text-3xl lg:text-4xl'} font-display font-black tracking-tighter ${important ? 'text-rose-500' : 'text-white'}`}>
              {valeur}
            </h4>
            {suffix && <span className="text-xl font-black text-slate-700">{suffix}</span>}
        </div>
        {subtext && <p className="text-xs font-bold text-slate-500 mt-1">{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
