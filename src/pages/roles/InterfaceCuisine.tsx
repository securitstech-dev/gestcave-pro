import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Clock, Bell, ChefHat, CheckCircle2, 
  Wine, LogOut, Zap, UtensilsCrossed, 
  Search, AlertCircle, Timer, ChevronRight, X, LayoutDashboard
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

  // Commandes actives
  const commandesActives = commandes.filter(c => 
    c.statut === 'envoyee' || c.statut === 'en_preparation'
  ).sort((a, b) => new Date(a.dateOuverture).getTime() - new Date(b.dateOuverture).getTime());

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  const urgence = (mins: number) => mins >= 20 ? 'critique' : mins >= 12 ? 'attention' : 'normal';

  const toutPretDansCommande = (commande: Commande) =>
    commande.lignes.filter(l => l.statut !== 'servi').every(l => l.statut === 'pret');

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header Cuisine Administratif */}
      <header className="h-24 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                  <ChefHat size={28} />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Poste de Production</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {commandesActives.length} BONS EN ATTENTE
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-4">
               <div className="bg-slate-100 px-6 py-2 rounded-xl border border-slate-200 text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temps Service</p>
                   <p className="text-xl font-bold text-slate-900 tracking-tighter">
                      {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                   </p>
               </div>
               <button onClick={() => navigate(-1)} className="p-4 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                   <LogOut size={20} />
               </button>
          </div>
      </header>

      {/* Barre de Filtres */}
      <div className="p-6 md:px-10 flex gap-4 bg-white border-b border-slate-100 flex-shrink-0">
          {[
            { id: 'tous', label: 'Toutes les catégories', icon: <LayoutDashboard size={14} /> },
            { id: 'cuisine', label: 'Cuisine (Plats)', icon: <UtensilsCrossed size={14} /> },
            { id: 'bar', label: 'Bar (Boissons)', icon: <Wine size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltreActif(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all border ${
                filtreActif === tab.id 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
      </div>

      {/* Zone des Bons */}
      <div className="flex-1 overflow-x-auto p-6 md:p-10 custom-scrollbar-admin bg-slate-100/30">
        <div className="flex gap-8 items-start min-w-max h-full">
            <AnimatePresence mode="popLayout">
                {commandesActives.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center pt-20">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-400 uppercase tracking-[0.3em]">Cuisine Prête</h2>
                    </div>
                ) : (
                    commandesActives.map(commande => {
                        const mins = minutesEcoulees(commande.dateOuverture);
                        const niv = urgence(mins);

                        return (
                            <motion.div
                                key={commande.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -50 }}
                                className={`w-[360px] bg-white rounded-3xl border-2 flex flex-col shadow-xl transition-all ${
                                    niv === 'critique' ? 'border-red-500 ring-4 ring-red-500/10' :
                                    niv === 'attention' ? 'border-amber-500' : 'border-slate-200'
                                }`}
                            >
                                {/* Header du Bon */}
                                <div className={`p-6 border-b flex justify-between items-start ${
                                    niv === 'critique' ? 'bg-red-50' :
                                    niv === 'attention' ? 'bg-amber-50' : 'bg-slate-50'
                                }`}>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{commande.tableNom}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Serveur: {commande.serveurNom}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${
                                        niv === 'critique' ? 'bg-red-500 text-white' :
                                        niv === 'attention' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {mins}'
                                    </div>
                                </div>

                                {/* Liste Articles */}
                                <div className="p-6 space-y-4 flex-1">
                                    {commande.lignes
                                        .filter(l => {
                                            if (filtreActif === 'tous') return true;
                                            const isBoisson = l.produitNom.toLowerCase().match(/bière|jus|vin|eau|soda|boisson|canette/);
                                            return filtreActif === 'bar' ? isBoisson : !isBoisson;
                                        })
                                        .map(ligne => (
                                            <div key={ligne.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                                ligne.statut === 'pret' ? 'bg-emerald-50 border-emerald-100 opacity-50' : 'bg-white border-slate-100 shadow-sm'
                                            }`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${
                                                    ligne.statut === 'pret' ? 'text-emerald-500' : 'text-slate-900 bg-slate-100'
                                                }`}>
                                                    {ligne.quantite}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-sm uppercase ${ligne.statut === 'pret' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{ligne.produitNom}</p>
                                                    {ligne.note && <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mt-1">{ligne.note}</p>}
                                                </div>
                                                <button 
                                                    onClick={() => marquerLignePrete(commande.id, ligne.id)}
                                                    disabled={ligne.statut === 'pret'}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                        ligne.statut === 'pret' ? 'text-emerald-500' : 'bg-slate-900 text-white hover:bg-emerald-600'
                                                    }`}
                                                >
                                                    {ligne.statut === 'pret' ? <CheckCircle2 size={24} /> : <Check size={20} />}
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                {/* Action Panthère (Service) */}
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            marquerCommandeServie(commande.id);
                                            toast.success(`${commande.tableNom} Prête !`);
                                        }}
                                        disabled={!toutPretDansCommande(commande)}
                                        className={`w-full py-5 rounded-2xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                            toutPretDansCommande(commande)
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 active:scale-95'
                                            : 'bg-white border border-slate-200 text-slate-300'
                                        }`}
                                    >
                                        <Bell size={18} /> Alerter le Serveur
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InterfaceCuisine;
