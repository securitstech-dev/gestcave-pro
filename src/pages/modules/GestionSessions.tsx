import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Lock, ShieldCheck, Clock, User, TrendingUp } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';
import { usePOSStore } from '../../store/posStore';

const GestionSessions = () => {
  const { profil } = useAuthStore();
  const { sessionActuelle, ouvrirJournee, fermerJournee } = useSessionStore();
  const { transactions } = usePOSStore() as any; // Temporary cast if type is missing
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);

  const handleOuverture = async () => {
    if (!profil) return;
    await ouvrirJournee(profil.etablissement_id, dateSelectionnee, profil.id);
  };

  const handleCloture = async () => {
    if (!sessionActuelle || !profil) return;
    const caTotal = 1000; // Calculez le CA réel ici
    await fermerJournee(sessionActuelle.id, profil.id, caTotal);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Sessions Journalières</h2>
        <p className="text-slate-500 font-medium mt-1">Ouvrez et fermez vos journées d'exploitation pour un suivi rigoureux.</p>
      </header>

      {!sessionActuelle ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Calendar size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Aucune session ouverte</h3>
          <p className="text-slate-500 mb-10 max-w-md mx-auto">Vous devez ouvrir une session avant de commencer les opérations de vente pour aujourd'hui.</p>
          
          <div className="max-w-xs mx-auto space-y-4">
            <input 
              type="date" 
              value={dateSelectionnee}
              onChange={(e) => setDateSelectionnee(e.target.value)}
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-indigo-600 transition-all font-bold text-slate-900"
            />
            <button 
              onClick={handleOuverture}
              className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play size={18} /> Ouvrir la journée
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Session en cours</span>
              </div>
              
              <h3 className="text-4xl font-display font-black mb-8 tracking-tighter uppercase">
                {new Date(sessionActuelle.dateAffaire).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ouvert le</p>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-slate-500" />
                    <span className="font-bold">{new Date(sessionActuelle.ouvertLe).toLocaleTimeString('fr-FR')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Par</p>
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-500" />
                    <span className="font-bold">{profil?.nom || 'Admin'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CA Session</p>
                    <p className="text-2xl font-black">0 F</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleCloture}
                  className="px-8 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 shadow-xl shadow-rose-600/20"
                >
                  <Lock size={18} /> Clôturer la journée
                </button>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
              <ShieldCheck size={200} />
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Actions Requises</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-xl">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  Vérifier les stocks critiques
                </li>
                <li className="flex items-center gap-4 text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Valider les fonds de caisse
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSessions;
