import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Clock, Bell, ChefHat, CheckCircle2, 
  Wine, LogOut, Zap, UtensilsCrossed, 
  Search, AlertCircle, Timer, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Commande } from '../../store/posStore';

const InterfaceCuisine = () => {
  const { commandes, marquerLignePrete, marquerCommandeServie } = usePOSStore();
  const { nomEmploye } = usePosteSession();
  const navigate = useNavigate();
  const [derniereNotif, setDerniereNotif] = useState<number>(0);
  const [filtreActif, setFiltreActif] = useState<'tous' | 'cuisine' | 'bar'>('tous');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Commandes actives
  const commandesActives = commandes.filter(c => 
    c.statut === 'envoyee' || c.statut === 'en_preparation'
  ).sort((a, b) => new Date(a.dateOuverture).getTime() - new Date(b.dateOuverture).getTime());

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  const urgence = (mins: number) => mins >= 20 ? 'critique' : mins >= 12 ? 'attention' : 'normal';

  // Alerte lors d'une nouvelle commande
  useEffect(() => {
    if (commandesActives.length > derniereNotif && derniereNotif !== 0) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-indigo-600 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-6`}>
           <div className="flex-1 w-0">
             <div className="flex items-start">
               <div className="flex-shrink-0 pt-0.5">
                 <Bell className="h-10 w-10 text-white animate-bounce" />
               </div>
               <div className="ml-5 flex-1">
                 <p className="text-sm font-black text-white uppercase tracking-widest">Nouveau Bon Arrivé !</p>
                 <p className="mt-1 text-sm text-indigo-100">Une nouvelle commande vient d'être envoyée par un serveur.</p>
               </div>
             </div>
           </div>
        </div>
      ), { duration: 5000 });
      
      // Simuler son de cloche (flash visuel pour l'instant)
      document.body.classList.add('bg-indigo-900');
      setTimeout(() => document.body.classList.remove('bg-indigo-900'), 300);
    }
    setDerniereNotif(commandesActives.length);
  }, [commandesActives.length]);

  const toutPretDansCommande = (commande: Commande) =>
    commande.lignes.filter(l => l.statut !== 'servi').every(l => l.statut === 'pret');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 lg:p-10 transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
          <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-orange-500/5 shadow-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-orange-500 opacity-20 animate-pulse" />
                  <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-orange-500 relative z-10" />
              </div>
              <div>
                  <h1 className="text-xl md:text-3xl font-display font-black tracking-tight uppercase leading-none">MONITEUR <span className="text-orange-500">PROD</span></h1>
                  <p className="text-slate-500 font-bold text-[9px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {commandesActives.length} BONS ACTIFS
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-slate-900 border border-white/5 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-between md:justify-start gap-4 shadow-inner">
                  <div className="text-left md:text-right">
                      <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Service</p>
                      <p className="text-sm md:text-xl font-display font-black tracking-tighter">
                          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                  </div>
                  <Clock className="w-[18px] h-[18px] md:w-6 md:h-6 text-slate-600" />
              </div>
              <button
                onClick={() => navigate(-1)}
                className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all border border-white/5"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
              </button>
          </div>
      </header>

      {/* Navigation entre sections de production */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-8 md:mb-10">
          {[
            { id: 'tous', label: 'Toutes', icon: <UtensilsCrossed className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />, color: 'indigo' },
            { id: 'cuisine', label: 'Cuisine', icon: <Zap className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />, color: 'orange' },
            { id: 'bar', label: 'Bar', icon: <Wine className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />, color: 'blue' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltreActif(tab.id as any)}
              className={`px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-2 md:gap-3 transition-all border ${
                filtreActif === tab.id 
                  ? `bg-${tab.color === 'indigo' ? 'indigo' : tab.color === 'orange' ? 'orange' : 'blue'}-600 border-transparent text-white shadow-xl shadow-${tab.color === 'indigo' ? 'indigo' : tab.color === 'orange' ? 'orange' : 'blue'}-500/20 scale-105` 
                  : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
      </div>

      {commandesActives.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-900/50 flex items-center justify-center mb-6 md:mb-10 border border-white/5"
          >
              <ChefHat className="w-12 h-12 md:w-16 md:h-16 opacity-10" />
          </motion.div>
          <h2 className="text-xl md:text-3xl font-display font-black text-slate-400 mb-2 uppercase">Zone calme</h2>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] md:text-[11px]">En attente de transmission WiFi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-start pb-20">
          <AnimatePresence mode="popLayout">
            {commandesActives.map(commande => {
              const mins = minutesEcoulees(commande.dateOuverture);
              const niv = urgence(mins);
              const estPret = toutPretDansCommande(commande);

              return (
                <motion.div
                  key={commande.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-slate-900 rounded-3xl md:rounded-[2.5rem] border-2 flex flex-col overflow-hidden transition-all duration-500 ${
                    niv === 'critique' ? 'border-rose-600 shadow-2xl shadow-rose-600/10' :
                    niv === 'attention' ? 'border-amber-500 shadow-2xl shadow-amber-500/10' :
                    'border-white/5'
                  }`}
                >
                  {/* Header du Bon */}
                  <div className={`p-4 md:p-6 border-b border-white/5 flex justify-between items-start ${
                    niv === 'critique' ? 'bg-rose-600/10' :
                    niv === 'attention' ? 'bg-amber-500/10' : 'bg-slate-800/20'
                  }`}>
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <h3 className="text-xl md:text-3xl font-display font-black text-white leading-none">{commande.tableNom}</h3>
                            {estPret && <CheckCircle2 className="text-emerald-500 animate-pulse w-[18px] h-[18px] md:w-6 md:h-6" />}
                        </div>
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {commande.serveurNom} · {commande.nombreCouverts}p
                        </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                        niv === 'critique' ? 'bg-rose-600 text-white' :
                        niv === 'attention' ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-300'
                    }`}>
                        <Timer className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="font-mono font-black text-sm md:text-base">{mins}'</span>
                    </div>
                  </div>

                  {/* Liste des items */}
                  <div className="p-3 md:p-6 space-y-2 md:space-y-4 flex-1">
                    {commande.lignes
                      .filter(l => {
                        if (filtreActif === 'tous') return true;
                        if (filtreActif === 'bar') return l.produitNom.toLowerCase().match(/bière|jus|vdp|vin|eau|soda|boisson|primus|mutzig|doppel|heineken|canette|castel/);
                        return !l.produitNom.toLowerCase().match(/bière|jus|vdp|vin|eau|soda|boisson|primus|mutzig|doppel|heineken|canette|castel/);
                      })
                      .map(ligne => (
                      <motion.div
                        key={ligne.id}
                        layout
                        className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all border ${
                          ligne.statut === 'pret' || ligne.statut === 'servi' 
                            ? 'bg-emerald-500/5 border-emerald-500/20 opacity-40' 
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className={`shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl shadow-inner ${
                            ligne.statut === 'pret' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-indigo-400'
                        }`}>
                          {ligne.quantite}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={`font-black text-[11px] md:text-sm uppercase leading-tight tracking-tight ${
                            ligne.statut === 'pret' || ligne.statut === 'servi' ? 'line-through text-slate-600' : 'text-white'
                          }`}>
                            {ligne.produitNom}
                          </p>
                          {ligne.note && (
                            <div className="mt-1 flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded w-fit uppercase">
                                <AlertCircle className="w-2 h-2 md:w-2.5 md:h-2.5" /> {ligne.note}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (ligne.statut === 'en_preparation') {
                              marquerLignePrete(commande.id, ligne.id);
                              toast.success(`${ligne.produitNom} : Validé !`, { position: 'top-center' });
                            }
                          }}
                          disabled={ligne.statut !== 'en_preparation'}
                          className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
                            ligne.statut === 'pret' || ligne.statut === 'servi'
                              ? 'bg-transparent text-emerald-500'
                              : 'bg-indigo-600 hover:bg-orange-500 text-white shadow-lg active:scale-95 border-transparent'
                          }`}
                        >
                          {ligne.statut === 'pret' || ligne.statut === 'servi' 
                            ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                            : <Check className="w-5 h-5 md:w-6 md:h-6" />
                          }
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Service */}
                  <div className="p-4 md:p-6 pt-0 mt-auto">
                    <button
                      onClick={() => {
                        marquerCommandeServie(commande.id);
                        toast.success(`${commande.tableNom} en route !`, { icon: '🏃' });
                      }}
                      disabled={!estPret}
                      className={`w-full py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all flex items-center justify-center gap-3 md:gap-4 border shadow-xl ${
                          estPret 
                          ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' 
                          : 'bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed opacity-30 shadow-none'
                      }`}
                    >
                      <Bell className="w-[18px] h-[18px] md:w-5 md:h-5" /> ALERTE SERVEUR
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default InterfaceCuisine;
