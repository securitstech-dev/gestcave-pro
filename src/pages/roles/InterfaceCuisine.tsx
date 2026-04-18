import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Check, Clock, Bell, ChefHat, CheckCircle2, 
  Wine, LogOut, Zap, UtensilsCrossed, 
  Search, AlertCircle, Timer, ChevronRight, X, LayoutDashboard,
  Flame, History, Play, CheckCircle, MoreHorizontal, Info,
  Volume2, VolumeX, Printer, RotateCcw, Filter, Utensils,
  User, Hash, MapPin, Scissors
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
  const [activePrintCmd, setActivePrintCmd] = useState<Commande | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
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

  // Fonction d'impression
  const imprimerBon = (cmd: Commande) => {
    setActivePrintCmd(cmd);
    setTimeout(() => {
        window.print();
        setActivePrintCmd(null);
    }, 500);
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
    <div className="h-screen bg-[#fbfbfb] text-slate-900 flex flex-col overflow-hidden font-outfit">
      <header className="h-8 bg-white border-b border-slate-200 px-3 flex items-center justify-between flex-shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
              <button onClick={() => setShowPosteSelector(true)} className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <ChefHat size={16} />
              </button>
              <h1 className="text-[11px] font-black text-slate-950 uppercase tracking-tighter flex items-center gap-2">
                KDS <span className="text-indigo-600">PRO</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-black border border-indigo-100">{posteId?.toUpperCase()}</span>
              </h1>
          </div>
          <div className="flex items-center gap-2">
               <button onClick={() => setSonActif(!sonActif)} className={`w-8 h-8 flex items-center justify-center rounded-lg border ${sonActif ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  {sonActif ? <Volume2 size={14} /> : <VolumeX size={14} />}
               </button>
               <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button onClick={() => setView('kds')} className={`px-3 py-1 rounded text-[8px] font-black uppercase ${view === 'kds' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>LIVE</button>
                  <button onClick={() => setView('historique')} className={`px-3 py-1 rounded text-[8px] font-black uppercase ${view === 'historique' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>HISTO</button>
               </div>
               <button onClick={quitterPoste} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                   <LogOut size={14} />
               </button>
          </div>
      </header>

      <main className="flex-1 overflow-hidden p-0 bg-slate-100">
        <div className="h-full flex gap-0.5">
          <KDSColumn title="À Préparer" count={commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_attente' && filterLigne(l))).length} color="bg-rose-500">
            {commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_attente' && filterLigne(l))).map(cmd => (
               <KDSTicket key={cmd.id} commande={cmd} filterLigne={filterLigne} minutes={minutesEcoulees(cmd.dateOuverture)} highlightItem={highlightItem} onPrint={() => imprimerBon(cmd)} posteId={posteId} />
            ))}
          </KDSColumn>
          <KDSColumn title="En Cuisine" count={commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_preparation' && filterLigne(l))).length} color="bg-amber-500">
            {commandesKDS.filter(c => c.lignes.some(l => l.statut === 'en_preparation' && filterLigne(l))).map(cmd => (
               <KDSTicket key={cmd.id} commande={cmd} filterLigne={filterLigne} minutes={minutesEcoulees(cmd.dateOuverture)} highlightItem={highlightItem} onPrint={() => imprimerBon(cmd)} posteId={posteId} />
            ))}
          </KDSColumn>
          <KDSColumn title="Prêt" count={commandesKDS.filter(c => c.lignes.every(l => (l.statut === 'pret' || !filterLigne(l))) && c.lignes.some(l => l.statut === 'pret' && filterLigne(l))).length} color="bg-emerald-500">
            {commandesKDS.filter(c => c.lignes.every(l => (l.statut === 'pret' || !filterLigne(l))) && c.lignes.some(l => l.statut === 'pret' && filterLigne(l))).map(cmd => (
               <KDSTicket key={cmd.id} commande={cmd} filterLigne={filterLigne} minutes={minutesEcoulees(cmd.dateOuverture)} highlightItem={highlightItem} onPrint={() => imprimerBon(cmd)} posteId={posteId} />
            ))}
          </KDSColumn>
        </div>
      </main>
    </div>
  );
};

const KDSColumn = ({ title, count, children, color }: any) => (
  <div className="flex-1 flex flex-col min-w-[240px] bg-white rounded-lg overflow-hidden border border-slate-200">
    <div className="p-2 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-[9px] font-black text-slate-950 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-black text-slate-500">{count}</div>
    </div>
    <div className="flex-1 overflow-y-auto p-1.5 space-y-2 bg-slate-50/50">
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
);

const KDSTicket = ({ commande, filterLigne, minutes, highlightItem, onPrint, posteId }: any) => {
  const { marquerLignePrete, marquerLigneEnPreparation, marquerToutesLignesPretes, marquerToutesLignesEnPreparation, marquerCommandeServie } = usePOSStore();
  const lignesFiltrees = commande.lignes.filter(filterLigne);
  const categories = useMemo(() => {
    const groups: Record<string, any[]> = {};
    lignesFiltrees.forEach(l => {
      const cat = l.produitCategorie || 'AUTRES';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(l);
    });
    return groups;
  }, [lignesFiltrees]);

  const toutPret = lignesFiltrees.every(l => l.statut === 'pret');
  const aPreparer = lignesFiltrees.some(l => l.statut === 'en_attente');
  const enPrep = lignesFiltrees.some(l => l.statut === 'en_preparation');
  const isLate = minutes >= 15;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white rounded-xl border ${isLate ? 'border-rose-200 shadow-rose-100' : 'border-slate-200'} shadow-sm overflow-hidden`}>
      <div className="p-2 flex justify-between items-center bg-slate-50 border-b border-slate-100">
        <div>
          <h4 className="text-[11px] font-black text-slate-950 uppercase">{commande.tableNom}</h4>
          <p className="text-[7px] text-slate-400 font-bold uppercase">{commande.serveurNom}</p>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-black ${isLate ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{minutes}m</div>
      </div>

      <div className="p-2 space-y-2">
        {Object.entries(categories).map(([cat, lignes]) => (
          <div key={cat} className="space-y-1">
            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{cat}</div>
            {lignes.map((l: any) => (
              <div key={l.id} onClick={() => l.statut === 'en_attente' ? marquerLigneEnPreparation(commande.id, l.id) : marquerLignePrete(commande.id, l.id)} className={`flex items-center gap-2 p-1.5 rounded-lg border ${l.statut === 'pret' ? 'bg-emerald-50 border-emerald-100 opacity-50' : 'bg-slate-50 border-slate-100'}`}>
                <div className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-[9px] font-black">{l.quantite}</div>
                <span className={`text-[10px] font-bold uppercase ${l.statut === 'pret' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{l.produitNom}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

    </motion.div>
  );
};

// Composant pour l'impression thermique (80mm)
const PrintableBon = ({ commande, posteId }: { commande: Commande, posteId: string | null }) => {
    const lignes = commande.lignes.filter(l => posteId === 'tous' || l.destination === posteId);
    
    // Groupement par catégorie
    const categories: Record<string, LigneCommande[]> = {};
    lignes.forEach(l => {
        const cat = l.produitCategorie || 'AUTRES';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(l);
    });

    return (
        <div className="text-black font-mono">
            <div className="text-center border-b-2 border-black pb-2 mb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest">BON DE COMMANDE</h2>
                <div className="text-[10px] mt-1">
                    {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="flex justify-between mb-2 text-sm font-bold">
                <span>TABLE: {commande.tableNom?.toUpperCase()}</span>
                <span>#{commande.id.slice(-4).toUpperCase()}</span>
            </div>

            <div className="text-[10px] mb-4 border-b border-black pb-2">
                <div>SERVEUR: {commande.serveurNom.toUpperCase()}</div>
                <div>STATION: {posteId?.toUpperCase()}</div>
                <div>TYPE: {commande.type.toUpperCase()}</div>
            </div>

            <div className="space-y-4">
                {Object.entries(categories).map(([cat, lines]) => (
                    <div key={cat}>
                        <div className="text-[10px] font-bold border-b border-black/20 mb-1">{cat}</div>
                        {lines.map(l => (
                            <div key={l.id} className="mb-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-lg font-bold mr-2">{l.quantite}x</span>
                                    <span className="flex-1 text-sm font-bold">{l.produitNom.toUpperCase()}</span>
                                </div>
                                {l.note && (
                                    <div className="ml-8 text-[10px] italic font-bold">
                                        *** NOTE: {l.note.toUpperCase()} ***
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-2 border-t-2 border-black text-center text-[8px] font-bold">
                GESTCAVE PRO - SYSTÈME KDS
            </div>
        </div>
    );
};

export default InterfaceCuisine;
