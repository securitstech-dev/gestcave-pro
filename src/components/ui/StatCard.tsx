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
  variant?: 'default' | 'large';
}

const StatCard = ({ label, valeur, suffix = "", subtext, icon, color, tendance, important = false, variant = 'default' }: StatCardProps) => {
  const isLarge = variant === 'large';
  
  return (
    <motion.div 
      whileHover={{ y: -5, scale: isLarge ? 1.02 : 1 }}
      className={`${isLarge ? 'p-10 rounded-[3rem] h-[300px]' : 'p-8 glass-panel'} bg-white/[0.02] border border-white/5 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:border-white/10`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${!isLarge ? '-mr-12 -mt-12' : ''} bg-${color}-500/10 blur-[${isLarge ? '80px' : '40px'}] rounded-full group-hover:bg-${color}-500/20 group-hover:scale-150 transition-all duration-700`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-4 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
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
