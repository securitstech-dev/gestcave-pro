import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Check, Clock, Bell, ChefHat, CheckCircle2, 
  Wine, LogOut, Zap, UtensilsCrossed, 
  Search, AlertCircle, Timer, ChevronRight, X, LayoutDashboard,
  Flame, History, Play, CheckCircle, MoreHorizontal, Info,
  Volume2, VolumeX, Printer, RotateCcw, Filter, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Commande, LigneCommande } from '../../store/posStore';

const InterfaceCuisine = () => {
  const { 
    commandes, 
    marquerLignePrete, 
    marquerLigneEnPreparation, 
    marquerCommandeServie 
  } = usePOSStore();
  const { nomEmploye, quitterPoste } = usePosteSession();
  const navigate = useNavigate();
  
  // Configuration du Poste (persistance locale)
  const [posteId, setPosteId] = useState<string | null>(localStorage.getItem('kds_poste') || null);
  const [showPosteSelector, setShowPosteSelector] = useState(!posteId);
  const [sonActif, setSonActif] = useState(true);
  
  const [view, setView] = useState<'kds' | 'historique'>('kds');
  const [now, setNow] = useState(Date.now());
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const prevCommandesCount = useRef(0);

  // Rafraîchir le temps
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Alerte sonore (uniquement pour les articles du poste)
  useEffect(() => {
    const activeCmdsForStation = commandes.filter(c => 
      (c.statut === 'envoyee' || c.statut === 'en_preparation') && 
      c.lignes.some(l => filterLigne(l) && l.statut === 'en_attente')
    );
    
    if (activeCmdsForStation.length > prevCommandesCount.current && sonActif) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio block:", e));
        toast.success("Nouveau bon reçu !", { 
            icon: '🔔', 
            style: { background: '#1e293b', color: '#fff', fontWeight: 'bold' } 
        });
    }
    prevCommandesCount.current = activeCmdsForStation.length;
  }, [commandes, sonActif, posteId]);

  const selectPoste = (id: string) => {
    setPosteId(id);
    localStorage.setItem('kds_poste', id);
    setShowPosteSelector(false);
  };

  // Filtrage des lignes selon le poste configuré
  const filterLigne = (l: LigneCommande) => {
    if (!posteId || posteId === 'tous') return true;
    return l.destination === posteId;
  };

  // Commandes actives pour le KDS
  const commandesKDS = useMemo(() => {
    return commandes.filter(c => {
        // La commande doit être envoyée ou en prep
        const isStatutOk = c.statut === 'envoyee' || c.statut === 'en_preparation';
        // Et avoir au moins une ligne destinée à ce poste qui n'est pas encore servie
        const hasLinesForPoste = c.lignes.some(l => filterLigne(l) && l.statut !== 'servi');
        return isStatutOk && hasLinesForPoste;
    }).sort((a, b) => new Date(a.dateOuverture).getTime() - new Date(b.dateOuverture).getTime());
  }, [commandes, posteId]);

  const historiqueCommandes = useMemo(() => {
    return commandes.filter(c => c.statut === 'servie')
      .sort((a, b) => new Date(b.dateOuverture).getTime() - new Date(a.dateOuverture).getTime())
      .slice(0, 30);
  }, [commandes]);

  const minutesEcoulees = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 60000);

  // Récapitulatif global
  const recapItems = useMemo(() => {
    const counts: Record<string, number> = {};
    commandesKDS.forEach(c => {
      c.lignes.forEach(l => {
        if (l.statut !== 'pret' && l.statut !== 'servi' && filterLigne(l)) {
          counts[l.produitNom] = (counts[l.produitNom] || 0) + l.quantite;
        }
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [commandesKDS, posteId]);

  // Simulation d'impression du bon
  const imprimerBon = (cmd: Commande) => {
    toast.success(`Impression du bon ${cmd.tableNom} lancée...`, { icon: '🖨️' });
  };

  if (showPosteSelector) {
    return (
      <div className="h-screen bg-[#0f1117] flex items-center justify-center p-6 font-outfit">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full bg-[#161922] p-12 rounded-[3rem] border border-slate-800 shadow-2xl text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <ChefHat size={40} />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase italic">Configuration Station</h2>
            <p className="text-slate-500 font-bold mb-10 uppercase text-xs tracking-widest">Sélectionnez le poste de production pour cette tablette</p>
            
            <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cuisine', label: 'Cuisine Centrale', icon: <Utensils size={24} /> },
                  { id: 'bar', label: 'Bar & Comptoir', icon: <Wine size={24} /> },
                  { id: 'pizzeria', label: 'Pizzeria / Four', icon: <Flame size={24} /> },
                  { id: 'grill', label: 'Grillades / BBQ', icon: <UtensilsCrossed size={24} /> },
                  { id: 'chicha', label: 'Espace Chicha', icon: <Zap size={24} /> },
                  { id: 'tous', label: 'Vue Globale', icon: <LayoutDashboard size={24} /> },
                ].map(p => (
                  <button 
                    key={p.id}
                    onClick={() => selectPoste(p.id)}
                    className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-white transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="group-hover:scale-110 transition-transform">{p.icon}</div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">{p.label}</span>
                  </button>
                ))}
            </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f1117] text-slate-200 flex flex-col overflow-hidden font-outfit">
      {/* Header KDS Professionnel */}
      <header className="h-20 bg-[#161922] border-b border-slate-800/50 px-8 flex items-center justify-between flex-shrink-0 z-20 shadow-2xl">
          <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowPosteSelector(true)}
                className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
              >
                  <ChefHat size={24} />
              </button>
              <div>
                  <h1 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    KDS <span className="text-indigo-500">PRO</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] border border-indigo-500/20 font-black">STATION: {posteId?.toUpperCase()}</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {commandesKDS.length} BONS EN ATTENTE
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{nomEmploye || 'CHEF DE PARTIE'}</span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
               {/* Buzzer Toggle */}
               <button 
                onClick={() => setSonActif(!sonActif)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${sonActif ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}
               >
                  {sonActif ? <Volume2 size={18} /> : <VolumeX size={18} />}
               </button>

               {/* Toggle Vue */}
               <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 mx-2">
                  <button 
                    onClick={() => setView('kds')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'kds' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutDashboard size={14} /> LIVE KDS
                  </button>
                  <button 
                    onClick={() => setView('historique')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'historique' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <History size={14} /> HISTORIQUE
                  </button>
               </div>

               <div className="bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 mr-4">
                    <Clock size={16} className="text-indigo-500" />
                    <span className="text-lg font-bold text-white tracking-tighter">
                      {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
               </div>
               
               <button onClick={quitterPoste} className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                   <LogOut size={18} />
               </button>
          </div>
      </header>

      {/* Recapitulatif Interactif */}
      <div className="bg-[#161922] border-b border-slate-800/30 flex-shrink-0">
          <div className="px-8 py-4 flex items-center gap-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 flex-shrink-0">
                  <Flame size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Production</span>
              </div>
              <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar mask-fade-right">
                  {recapItems.length === 0 ? (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest py-1.5">Aucun article à produire pour l'instant</span>
                  ) : recapItems.map(([nom, qte]) => (
                    <button 
                      key={nom} 
                      onClick={() => setHighlightItem(highlightItem === nom ? null : nom)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                        highlightItem === nom 
                          ? 'bg-indigo-600 border-indigo-400 text-white' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                        <span className={`font-black ${highlightItem === nom ? 'text-white' : 'text-indigo-400'}`}>{qte}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">{nom}</span>
                    </button>
                  ))}
              </div>
          </div>
      </div>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'kds' ? (
            <motion.div 
              key="kds" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex gap-1 p-1"
            >
              {/* Colonne 1: A Préparer */}
              <KDSColumn 
                title="A Préparer" 
                subtitle="Nouveaux bons entrants"
                count={commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_attente' && filterLigne(l))).length}
                color="border-indigo-500/30"
                bg="bg-indigo-500/5"
              >
                {commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_attente' && filterLigne(l))).map(cmd => (
                   <KDSTicket 
                    key={cmd.id} 
                    commande={cmd} 
                    filterLigne={filterLigne} 
                    minutes={minutesEcoulees(cmd.dateOuverture)}
                    highlightItem={highlightItem}
                    onPrint={() => imprimerBon(cmd)}
                   />
                ))}
              </KDSColumn>

              {/* Colonne 2: Au Feu */}
              <KDSColumn 
                title="Au Feu" 
                subtitle="En cours de traitement"
                count={commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_preparation' && filterLigne(l))).length}
                color="border-amber-500/30"
                bg="bg-amber-500/5"
              >
                {commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_preparation' && filterLigne(l))).map(cmd => (
                   <KDSTicket 
                    key={cmd.id} 
                    commande={cmd} 
                    filterLigne={filterLigne} 
                    minutes={minutesEcoulees(cmd.dateOuverture)}
                    highlightItem={highlightItem}
                    onPrint={() => imprimerBon(cmd)}
                   />
                ))}
              </KDSColumn>

              {/* Colonne 3: Prêt / Ramasse */}
              <KDSColumn 
                title="Prêt / Ramasse" 
                subtitle="A appeler serveur"
                count={commandesKDS.filter(c => c.lignes.every(l => (l.statut === 'pret' || !filterLigne(l))) && c.lignes.some(l => l.statut === 'pret' && filterLigne(l))).length}
                color="border-emerald-500/30"
                bg="bg-emerald-500/5"
              >
                {commandesKDS.filter(c => c.lignes.every(l => (l.statut === 'pret' || !filterLigne(l))) && c.lignes.some(l => l.statut === 'pret' && filterLigne(l))).map(cmd => (
                   <KDSTicket 
                    key={cmd.id} 
                    commande={cmd} 
                    filterLigne={filterLigne} 
                    minutes={minutesEcoulees(cmd.dateOuverture)}
                    highlightItem={highlightItem}
                    onPrint={() => imprimerBon(cmd)}
                   />
                ))}
              </KDSColumn>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="h-full p-8 overflow-y-auto custom-scrollbar-admin"
            >
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Historique de Service</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Dernières commandes servies (30 dernières)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {historiqueCommandes.map(cmd => (
                    <div key={cmd.id} className="bg-[#161922] border border-slate-800 p-8 rounded-[2rem] flex items-center justify-between group hover:border-slate-700 hover:bg-[#1a1d27] transition-all shadow-xl">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-emerald-500">
                          <CheckCircle size={28} />
                          <span className="text-[8px] font-black mt-1 uppercase">SERVI</span>
                        </div>
                        <div>
                          <h4 className="font-black text-white text-2xl italic tracking-tighter uppercase">{cmd.tableNom}</h4>
                          <div className="flex items-center gap-3 mt-1.5">
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Par {cmd.serveurNom}</p>
                             <span className="text-slate-800">•</span>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(cmd.dateOuverture).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex gap-2 ml-12 overflow-x-auto no-scrollbar">
                        {cmd.lignes.filter(filterLigne).map(l => (
                          <div key={l.id} className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-2 whitespace-nowrap">
                            <span className="font-black text-indigo-400 text-xs">{l.quantite}x</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">{l.produitNom}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 ml-8">
                         <button 
                          onClick={() => {
                            toast.success(`Commande ${cmd.tableNom} rappelée (Simulé)`);
                          }}
                          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all group/btn"
                         >
                            <RotateCcw size={20} className="group-hover/btn:rotate-[-45deg] transition-all" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const KDSColumn = ({ title, subtitle, count, children, color, bg }: any) => (
  <div className={`flex-1 flex flex-col min-w-[400px] rounded-[2.5rem] border-2 ${color} ${bg} m-2 overflow-hidden shadow-2xl relative`}>
    <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-950/20">
      <div>
        <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">{title}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic opacity-70">{subtitle}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-sm border border-white/5">
        {count}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar-admin">
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
);

const KDSTicket = ({ commande, filterLigne, minutes, highlightItem, onPrint }: any) => {
  const { marquerLignePrete, marquerLigneEnPreparation, marquerCommandeServie } = usePOSStore();
  
  const lignesFiltrees = commande.lignes.filter(filterLigne);
  const toutPret = lignesFiltrees.every(l => l.statut === 'pret');
  
  const urgenceClass = minutes >= 20 ? 'border-rose-500 shadow-rose-500/20' : minutes >= 12 ? 'border-amber-500 shadow-amber-500/20' : 'border-slate-800 shadow-xl';
  const headerBg = minutes >= 20 ? 'bg-rose-500/20' : minutes >= 12 ? 'bg-amber-500/20' : 'bg-slate-900/80';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-[#1c212c] rounded-[2rem] border-2 overflow-hidden flex flex-col transition-all duration-500 ${urgenceClass}`}
    >
      {/* Header du Ticket */}
      <div className={`p-5 flex justify-between items-start border-b border-white/5 ${headerBg}`}>
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic">{commande.tableNom}</h4>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${commande.type === 'a_emporter' ? 'bg-amber-500 text-slate-900' : 'bg-indigo-600 text-white'}`}>
              {commande.type === 'a_emporter' ? 'A EMPORTER' : 'DINE-IN'}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5 opacity-60">Ticket #{commande.id.slice(-6).toUpperCase()} • Serveur: {commande.serveurNom}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-black text-sm border shadow-lg ${
                minutes >= 20 ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : 
                minutes >= 12 ? 'bg-amber-500 border-amber-400 text-white' : 
                'bg-slate-900 border-slate-700 text-slate-300'
            }`}>
              <Timer size={16} /> {minutes}'
            </div>
            <button 
                onClick={onPrint}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white transition-all"
            >
                <Printer size={14} />
            </button>
        </div>
      </div>

      {/* Lignes du Ticket */}
      <div className="p-5 space-y-2.5">
        {lignesFiltrees.map((ligne: any) => {
          const isHighlighted = highlightItem === ligne.produitNom;
          
          return (
            <div key={ligne.id} className={`p-4 rounded-[1.25rem] border-2 flex items-center gap-4 transition-all duration-300 ${
              ligne.statut === 'pret' ? 'bg-emerald-500/10 border-emerald-500/10 opacity-40' : 
              ligne.statut === 'en_preparation' ? 'bg-amber-500/10 border-amber-500/30' : 
              isHighlighted ? 'bg-indigo-600 border-indigo-400 shadow-lg scale-[1.02]' : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all ${
                 ligne.statut === 'pret' ? 'text-emerald-500 bg-emerald-500/10' : 
                 ligne.statut === 'en_preparation' ? 'text-amber-500 bg-amber-500/10' : 
                 isHighlighted ? 'text-white bg-indigo-500' : 'text-white bg-slate-800 border border-slate-700'
              }`}>
                {ligne.quantite}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm uppercase tracking-tight truncate ${
                    ligne.statut === 'pret' ? 'line-through text-slate-600' : 
                    isHighlighted ? 'text-white' : 'text-slate-200'
                }`}>
                  {ligne.produitNom}
                </p>
                {ligne.note && (
                  <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md w-fit ${isHighlighted ? 'bg-white/10 text-white' : 'bg-rose-500/10 text-rose-400'}`}>
                    <Info size={10} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{ligne.note}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                {ligne.statut === 'en_attente' && (
                  <button 
                    onClick={() => marquerLigneEnPreparation(commande.id, ligne.id)}
                    className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                )}
                {ligne.statut !== 'pret' && (
                  <button 
                    onClick={() => marquerLignePrete(commande.id, ligne.id)}
                    className="w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-emerald-600 flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20 active:scale-90"
                  >
                    <Check size={20} strokeWidth={4} />
                  </button>
                )}
                {ligne.statut === 'pret' && (
                  <div className="w-10 h-10 flex items-center justify-center text-emerald-500">
                     <CheckCircle2 size={24} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Action de Sortie */}
      <div className="p-5 mt-auto bg-slate-950/20 border-t border-white/5">
        <button
          onClick={() => {
            marquerCommandeServie(commande.id);
            toast.success(`${commande.tableNom} ENVOYÉ !`, {
              style: { background: '#10b981', color: '#fff', fontWeight: 'black', borderRadius: '1rem' }
            });
          }}
          disabled={!toutPret}
          className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-500 ${
            toutPret 
              ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 hover:bg-emerald-500' 
              : 'bg-slate-900/50 text-slate-700 border border-slate-800 cursor-not-allowed grayscale'
          }`}
        >
          {toutPret ? <><Bell size={18} className="animate-bounce" /> COMMANDÉ PRÊTE</> : 'PREPARATION EN COURS...'}
        </button>
      </div>
    </motion.div>
  );
};

export default InterfaceCuisine;
