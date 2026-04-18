import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck, Shield,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical, DollarSign,
  Bell, Search, Menu, X, PlusCircle, Globe, History, ArrowRight, ArrowLeft, Receipt, Clock,
  ChefHat, Flame, Timer, Wallet
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePOSStore } from '../store/posStore';
import { toast } from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Modules
import InterfaceCaissier from './roles/InterfaceCaissier';
import InterfaceCuisine from './roles/InterfaceCuisine';
import GestionEmployes from './modules/GestionEmployes';
import GestionStocks from './modules/GestionStocks';
import GestionTables from './modules/GestionTables';
import PlanDeSalles from './modules/PlanDeSalles';
import GestionFinance from './modules/GestionFinance';
import GestionAchats from './modules/GestionAchats';
import GestionEtablissement from './modules/GestionEtablissement';
import GestionSessions from './modules/GestionSessions';
import GestionPaie from './modules/GestionPaie';
import SimulationLab from '../components/SimulationLab';

const TableauClient = () => {
  const { profil, deconnexion, etablissementSimuleId } = useAuthStore();
  const { initialiserTempsReel, arreterTempsReel } = usePOSStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const etablissementId = etablissementSimuleId || profil?.etablissement_id;

  useEffect(() => {
    if (etablissementId) {
      initialiserTempsReel(etablissementId);
    }
    return () => arreterTempsReel();
  }, [etablissementId, initialiserTempsReel, arreterTempsReel]);

  // Fermer la sidebar mobile lors d'un changement de route
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const isActif = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const SidebarLink = ({ icon, label, path }: { icon: any, label: string, path: string }) => {
    const actif = isActif(path);
    return (
      <button 
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-[11px] ${
          actif ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <span className={actif ? 'text-white' : 'text-slate-400'}>{icon}</span>
        {label}
        {actif && <ChevronRight size={14} className="ml-auto opacity-50" />}
      </button>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 flex flex-col gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src="/logo_gestcave.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-slate-950/20" />
          <div>
            <h2 className="font-black text-slate-900 text-[10px] tracking-tight leading-tight uppercase">
              {profil?.etablissement_id?.slice(0, 8) || (etablissementSimuleId ? 'INSPECTION' : 'GESTCAVE')}
            </h2>
            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" /> {etablissementSimuleId ? 'Inspection' : 'Directeur'}
            </p>
          </div>
        </div>
        
        {etablissementSimuleId && (
          <button 
            onClick={() => {
              useAuthStore.getState().setEtablissementSimule(null);
              navigate('/super-admin');
            }}
            className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Shield size={10} /> Quitter l'inspection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        <div>
          <p className="px-3 text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Opérations</p>
          <div className="space-y-0.5">
            <SidebarLink icon={<LayoutDashboard size={14} />} label="Vue d'ensemble" path="/tableau-de-bord" />
            <SidebarLink icon={<Clock size={14} />} label="Sessions" path="/tableau-de-bord/sessions" />
            <SidebarLink icon={<Layout size={14} />} label="Plan de Salle" path="/tableau-de-bord/plan-salles" />
            <SidebarLink icon={<PlusCircle size={14} />} label="Config Tables" path="/tableau-de-bord/tables" />
          </div>
        </div>

        <div>
          <p className="px-3 text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Postes</p>
          <div className="space-y-0.5">
            <SidebarLink icon={<ShoppingCart size={14} />} label="Caisse" path="/tableau-de-bord/caisse" />
            <SidebarLink icon={<Zap size={14} />} label="Cuisine / Bar" path="/tableau-de-bord/cuisine" />
          </div>
        </div>

        <div>
          <p className="px-3 text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Management</p>
          <div className="space-y-0.5">
            <SidebarLink icon={<Package size={14} />} label="Inventaire" path="/tableau-de-bord/stocks" />
            <SidebarLink icon={<TrendingUp size={14} />} label="Achats" path="/tableau-de-bord/achats" />
            <SidebarLink icon={<DollarSign size={14} />} label="Finance" path="/tableau-de-bord/admin" />
            <SidebarLink icon={<Users size={14} />} label="Ressources Humaines" path="/tableau-de-bord/rh" />
            <SidebarLink icon={<Wallet size={14} />} label="Paie & Salaires" path="/tableau-de-bord/paie" />
            <SidebarLink icon={<Clock size={14} />} label="Terminal Pointage" path={`/pointage/${profil?.etablissement_id}`} />
            <SidebarLink icon={<Settings size={14} />} label="Paramètres" path="/tableau-de-bord/settings" />
          </div>
        </div>

        <div>
          <p className="px-3 text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Laboratoire</p>
          <div className="space-y-0.5">
            <SidebarLink icon={<Zap size={14} />} label="Simulation" path="/tableau-de-bord/simulation" />
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100">
        <button 
          onClick={() => { deconnexion(); navigate('/connexion'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 font-bold text-[11px] hover:bg-red-50 transition-all"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-display">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[160px] h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl"
            >
              <Sidebar />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-300 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-64">
              <Search size={14} />
              <input type="text" placeholder="Recherche..." className="bg-transparent border-none outline-none text-[10px] w-full text-slate-900 font-bold" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
               <Calendar size={12} />
               <span className="text-[8px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
               <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black text-slate-900 leading-none uppercase">{profil?.prenom || 'Admin'}</p>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Directeur Général</p>
               </div>
               <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-slate-950/20">
                  {profil?.prenom?.[0] || 'A'}
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar-admin no-scrollbar">
          <div className="max-w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardAccueil profil={profil} navigate={navigate} />} />
              <Route path="/plan-salles" element={<PlanDeSalles />} />
              <Route path="/caisse" element={<InterfaceCaissier />} />
              <Route path="/cuisine" element={<InterfaceCuisine />} />
              <Route path="/rh" element={<GestionEmployes />} />
              <Route path="/paie" element={<GestionPaie />} />
              <Route path="/stocks" element={<GestionStocks />} />
              <Route path="/achats" element={<GestionAchats />} />
              <Route path="/tables" element={<GestionTables />} />
              <Route path="/admin" element={<GestionFinance />} />
              <Route path="/sessions" element={<GestionSessions />} />
              <Route path="/settings" element={<GestionEtablissement />} />
              <Route path="/simulation" element={<SimulationLab />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardAccueil = ({ profil, navigate }: any) => {
  const { commandes, produits, tables } = usePOSStore();
  const [transactions, setTransactions] = React.useState<any[]>([]);

  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;

  React.useEffect(() => {
    if (!profil?.etablissement_id) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const q = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', today.toISOString())
    );
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [profil?.etablissement_id]);

  const ventesDuJour = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const dettes = transactions.filter(t => t.modePaiement === 'credit').reduce((acc, t) => acc + (t.montantRestant || 0), 0);
  const especes = transactions.filter(t => t.modePaiement === 'especes').reduce((acc, t) => acc + (t.total || 0), 0);

  const perfServeurs = useMemo(() => {
    const map: { [name: string]: number } = {};
    transactions.forEach(t => {
       const nom = t.serveurNom || 'Inconnu';
       map[nom] = (map[nom] || 0) + (t.total || 0);
    });
    return Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [transactions]);

  const { sessionActive } = usePOSStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded-full">Executive</span>
             <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Live Supervision</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Dashboard</h1>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             {sessionActive ? (
               <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <div>
                     <p className="text-[7px] font-black text-emerald-800 uppercase tracking-widest">Session Active</p>
                     <p className="text-[9px] font-black text-emerald-600 uppercase">{sessionActive.caissierNom}</p>
                  </div>
               </div>
             ) : (
               <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <div>
                     <p className="text-[7px] font-black text-rose-800 uppercase tracking-widest">Caisse Hors-Ligne</p>
                     <p className="text-[9px] font-black text-rose-600 uppercase">Ventes bloquées</p>
                  </div>
               </div>
             )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex items-center gap-2">
         <p className="px-2 text-[7px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">Outils</p>
         <button onClick={() => navigate('/tableau-de-bord/tables')} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[7px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5">
           <LayoutDashboard size={10} /> Tables
         </button>
         <a 
          href={`/pointage/${profil?.etablissement_id}`} 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-black text-[7px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-transparent shadow-none"
        >
          <Clock size={10} /> Pointage
         </a>
         <button onClick={() => navigate('/tableau-de-bord/stocks')} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-black text-[7px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-1.5">
           <Package size={10} /> Stocks
         </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-2">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Caisse Totale</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase">{ventesDuJour.toLocaleString()} <span className="text-[8px]">F</span></h3>
            <div className="mt-1.5 h-0.5 w-8 bg-indigo-500 rounded-full" />
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Espèces</p>
            <h3 className="text-lg font-black text-emerald-600 tracking-tighter uppercase">{especes.toLocaleString()} <span className="text-[8px]">F</span></h3>
            <div className="mt-1.5 h-0.5 w-8 bg-emerald-500 rounded-full" />
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Occupation</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase">{tablesOccupees} <span className="text-[8px]">Tables</span></h3>
            <div className="mt-1.5 h-0.5 w-8 bg-blue-500 rounded-full" />
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Dettes Clients</p>
            <h3 className="text-lg font-black text-rose-900 tracking-tighter uppercase">{dettes.toLocaleString()} <span className="text-[8px]">F</span></h3>
            <div className="mt-1.5 h-0.5 w-8 bg-rose-500 rounded-full" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Monitor Live */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center shadow-lg"><Activity size={16} /></div>
                   <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Monitor Live</h3>
                </div>
                <button onClick={() => navigate('/tableau-de-bord/plan-salles')} className="text-[7px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-100">
                   Plan complet
                </button>
             </div>

             <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                {tables.slice(0, 16).map(table => {
                   const cmd = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   return (
                      <div key={table.id} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${
                         table.statut === 'occupee' ? 'bg-rose-50 border-rose-100' : 
                         table.statut === 'en_attente_paiement' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-transparent'
                      }`}>
                         <span className={`text-[8px] font-black ${table.statut === 'occupee' ? 'text-rose-600' : table.statut === 'en_attente_paiement' ? 'text-amber-600' : 'text-slate-400'}`}>{table.nom.split(' ')[1] || table.nom}</span>
                         {cmd && <span className="text-[6px] font-black text-slate-900">{cmd.total.toLocaleString()}</span>}
                      </div>
                   )
                })}
             </div>
          </div>

          <PerformanceCuisine commandes={commandes} />

          {/* Journal POS */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm"><Receipt size={16} /></div>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Journal des ventes</h3>
               </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto no-scrollbar">
              {transactions.length === 0 ? (
                  <div className="py-10 text-center text-slate-300 text-[10px] font-black uppercase">Aucune vente enregistrée</div>
              ) : (
                  transactions.slice(0, 10).map((transaction, i) => (
                      <div key={transaction.id || i} className="flex items-center justify-between p-3 hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[7px] uppercase tracking-tighter">
                                  {transaction.modePaiement === 'mobile' ? 'MOBI' : 'CASH'}
                              </div>
                              <div>
                                  <h4 className="font-black text-slate-900 text-[9px] uppercase">#{transaction.commandeId?.slice(-6).toUpperCase() || 'SYS'}</h4>
                                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{new Date(transaction.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})} • {transaction.serveurNom || 'Admin'}</p>
                              </div>
                          </div>
                          <p className="text-xs font-black text-slate-950 tracking-tighter">{transaction.total?.toLocaleString() || 0} F</p>
                      </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
             {/* Classement */}
             <div className="bg-slate-900 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <h4 className="font-black text-[9px] uppercase tracking-widest">Performances Serveurs</h4>
                </div>
                <div className="space-y-3">
                   {perfServeurs.map(([nom, val], idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                         <div className="flex justify-between items-end">
                            <p className="text-[8px] font-black uppercase text-slate-400">{nom}</p>
                            <p className="text-[9px] font-black text-white">{val.toLocaleString()} F</p>
                         </div>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(val / (perfServeurs[0][1] || 1)) * 100}%` }} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Stock Critique */}
             <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                     <AlertTriangle size={16} className="text-rose-600" />
                     <h4 className="font-black text-slate-900 text-[9px] uppercase tracking-widest">Stocks Critiques</h4>
                </div>
                <div className="space-y-4">
                    {produits.filter(p => p.stockTotal <= (p.stockAlerte || 0)).slice(0, 4).map(p => (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                          <span className="text-slate-600 truncate max-w-[120px]">{p.nom}</span>
                          <span className={p.stockTotal <= 0 ? 'text-red-600' : 'text-orange-600'}>{p.stockTotal} U.</span>
                        </div>
                        <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${p.stockTotal <= 0 ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (p.stockTotal/(p.stockAlerte || 1))*100)}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
                <button onClick={() => navigate('/tableau-de-bord/stocks')} className="mt-6 w-full py-3 rounded-xl bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                    Voir Inventaire
                </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
};

const PerformanceCuisine = ({ commandes }: { commandes: any[] }) => {
  const stats = useMemo(() => {
    const data: Record<string, { totalTime: number, count: number }> = {};
    let totalGlobalTime = 0;
    let totalGlobalCount = 0;
    
    commandes.forEach(c => {
      c.lignes.forEach(l => {
        if (l.datePreparationStart && l.datePret) {
          const start = new Date(l.datePreparationStart).getTime();
          const end = new Date(l.datePret).getTime();
          const diff = Math.max(1, Math.floor((end - start) / 60000));
          
          const cat = l.produitCategorie || 'AUTRES';
          if (!data[cat]) data[cat] = { totalTime: 0, count: 0 };
          data[cat].totalTime += diff;
          data[cat].count += 1;
          
          totalGlobalTime += diff;
          totalGlobalCount += 1;
        }
      });
    });
    
    const categories = Object.entries(data).map(([cat, s]) => ({
      name: cat,
      avg: Math.round(s.totalTime / s.count),
      count: s.count
    })).sort((a, b) => b.count - a.count);

    return {
        categories,
        avgGlobal: totalGlobalCount > 0 ? Math.round(totalGlobalTime / totalGlobalCount) : 0,
        totalCount: totalGlobalCount
    };
  }, [commandes]);

  return (
     <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg"><ChefHat size={16} /></div>
                <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Cuisine Performance</h3>
            </div>
            <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Global</p>
                <p className="text-sm font-black text-indigo-600 tracking-tighter uppercase">{stats.avgGlobal} MIN</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            {stats.categories.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] ${
                            cat.avg > 15 ? 'bg-rose-100 text-rose-600' : 
                            cat.avg > 8 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            {cat.avg}'
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-[8px] uppercase tracking-tight truncate max-w-[60px]">{cat.name}</h4>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} Plats</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
     </div>
  );
};

export default TableauClient;
