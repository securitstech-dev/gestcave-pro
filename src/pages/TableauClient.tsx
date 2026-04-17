import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical, DollarSign,
  Bell, Search, Menu, X, PlusCircle, Globe, History, ArrowRight, Receipt, Clock
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

const TableauClient = () => {
  const { profil, deconnexion } = useAuthStore();
  const { initialiserTempsReel, arreterTempsReel } = usePOSStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (profil?.etablissement_id) {
      initialiserTempsReel(profil.etablissement_id);
    }
    return () => arreterTempsReel();
  }, [profil?.etablissement_id, initialiserTempsReel, arreterTempsReel]);

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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
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
      <div className="p-8 flex items-center gap-4 border-b border-slate-100">
        <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-slate-950/20" />
        <div>

          <h2 className="font-bold text-slate-900 text-sm tracking-tight leading-tight uppercase">
            {profil?.etablissement_id?.slice(0, 8) || 'GESTCAVE'}
          </h2>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" /> Serveur Actif
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar-admin">
        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Vue Principale</p>
          <div className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Tableau de Bord" path="/tableau-de-bord" />
            <SidebarLink icon={<Clock size={18} />} label="Sessions Journalières" path="/tableau-de-bord/sessions" />
            <SidebarLink icon={<Layout size={18} />} label="Plan de Salle" path="/tableau-de-bord/plan-salles" />
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Postes de Service</p>
          <div className="space-y-1">
            <SidebarLink icon={<ShoppingCart size={18} />} label="Caisse Centrale" path="/tableau-de-bord/caisse" />
            <SidebarLink icon={<Zap size={18} />} label="Cuisine / Bar" path="/tableau-de-bord/cuisine" />
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Management & Finance</p>
          <div className="space-y-1">
            <SidebarLink icon={<Package size={18} />} label="Stock & Inventaire" path="/tableau-de-bord/stocks" />
            <SidebarLink icon={<TrendingUp size={18} />} label="Flux des Achats" path="/tableau-de-bord/achats" />
            <SidebarLink icon={<DollarSign size={18} />} label="Comptabilité & Finance" path="/tableau-de-bord/admin" />
            <SidebarLink icon={<Users size={18} />} label="Employés & RH" path="/tableau-de-bord/rh" />
            <SidebarLink icon={<Settings size={18} />} label="Configuration" path="/tableau-de-bord/settings" />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100">
        <button 
          onClick={() => { deconnexion(); navigate('/connexion'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-bold text-sm hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        >
          <LogOut size={18} /> Quitter la session
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full flex-shrink-0">
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
              className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl"
            >
              <Sidebar />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-80">
              <Search size={16} />
              <input type="text" placeholder="Recherche rapide..." className="bg-transparent border-none outline-none text-xs w-full text-slate-900" />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
               <Calendar size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
            <button className="p-2.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-xl relative hover:bg-slate-100 transition-all">
               <Bell size={18} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 md:pl-6">
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{profil?.prenom || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Administrateur</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-slate-950/20">
                  {profil?.prenom?.[0] || 'A'}
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar-admin">
          <div className="max-w-[1400px] mx-auto">
            <Routes>
              <Route path="/" element={<DashboardAccueil profil={profil} navigate={navigate} />} />
              <Route path="/plan-salles" element={<PlanDeSalles />} />
              <Route path="/caisse" element={<InterfaceCaissier />} />
              <Route path="/cuisine" element={<InterfaceCuisine />} />
              <Route path="/rh" element={<GestionEmployes />} />
              <Route path="/stocks" element={<GestionStocks />} />
              <Route path="/achats" element={<GestionAchats />} />
              <Route path="/tables" element={<GestionTables />} />
              <Route path="/admin" element={<GestionFinance />} />
              <Route path="/sessions" element={<GestionSessions />} />
              <Route path="/settings" element={<GestionEtablissement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardAccueil = ({ profil, navigate }: any) => {
  const { commandes, produits, tables } = usePOSStore();
  const [lienCopie, setLienCopie] = React.useState(false);
  const [transactions, setTransactions] = React.useState<any[]>([]);

  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const tablesAttente = tables.filter(t => t.statut === 'en_attente_paiement').length;

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
  const mobileMoney = transactions.filter(t => t.modePaiement === 'mobile').reduce((acc, t) => acc + (t.total || 0), 0);
  const especes = transactions.filter(t => t.modePaiement === 'especes').reduce((acc, t) => acc + (t.total || 0), 0);

  // Performance Serveurs
  const perfServeurs = useMemo(() => {
    const map: { [name: string]: number } = {};
    transactions.forEach(t => {
       const nom = t.serveurNom || 'Inconnu';
       map[nom] = (map[nom] || 0) + (t.total || 0);
    });
    return Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [transactions]);

  const copierLienPoste = () => {
    if (!profil?.etablissement_id) return;
    const lien = `${window.location.origin}/poste/${profil.etablissement_id}`;
    navigator.clipboard.writeText(lien);
    setLienCopie(true);
    toast.success('Lien copié pour le personnel !');
    setTimeout(() => setLienCopie(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Vue Patron</span>
             <span className="text-[10px] text-slate-400 font-bold">• Temps Réel Actif</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Tableau de Bord</h1>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <button
               onClick={copierLienPoste}
               className={`flex-1 md:flex-none py-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-sm ${
                 lienCopie ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
               }`}
             >
               {lienCopie ? <ShieldCheck size={18} /> : <Globe size={18} />}
               Accès Personnel
             </button>
             <button 
               onClick={() => navigate('/tableau-de-bord/achats')}
               className="flex-1 md:flex-none py-4 px-8 rounded-2xl bg-slate-900 font-black text-[10px] text-white uppercase tracking-widest shadow-xl shadow-slate-950/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
             >
               <PlusCircle size={18} /> Approvisionner
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={24} /></div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-full">+12.4%</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caisse Totale</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{ventesDuJour.toLocaleString()} <span className="text-xs">F</span></h3>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Zap size={24} /></div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded-full">LIVE</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activité Salles</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{tablesOccupees} <span className="text-xs">Occupées</span></h3>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={24} /></div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100/50 px-2 py-1 rounded-full">{tablesAttente} Notes</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encours Clients</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{commandes.filter(c => c.statut !== 'payee').length} <span className="text-xs">Cmds</span></h3>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><CreditCard size={24} /></div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dettes À Recouvrer</p>
                <h3 className="text-3xl font-black text-indigo-900 tracking-tighter uppercase">{dettes.toLocaleString()} <span className="text-xs">F</span></h3>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Situation des Salles (Live) */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-lg"><Activity size={24} /></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Monitor Live</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aperçu direct occupation</p>
                   </div>
                </div>
                <button onClick={() => navigate('/tableau-de-bord/plan-salles')} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all border border-indigo-100">
                   Plan Complet <ArrowRight size={14} />
                </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tables.slice(0, 8).map(table => {
                   const cmd = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   const duree = cmd?.dateOuverture ? Math.floor((Date.now() - new Date(cmd.dateOuverture).getTime()) / 60000) : 0;
                   
                   return (
                      <div key={table.id} className={`p-6 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 relative group ${
                         table.statut === 'occupee' ? 'bg-rose-50 border-rose-100 shadow-lg shadow-rose-500/5' : 
                         table.statut === 'en_attente_paiement' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-transparent'
                      }`}>
                         <span className={`text-2xl font-black ${table.statut === 'occupee' ? 'text-rose-600' : table.statut === 'en_attente_paiement' ? 'text-amber-600' : 'text-slate-400'}`}>{table.nom.split(' ')[1] || table.nom}</span>
                         {cmd && (
                           <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-black text-slate-900">{cmd.total.toLocaleString()} F</span>
                              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                                <Clock size={8} /> {duree}m
                              </div>
                           </div>
                         )}
                         {table.statut === 'libre' && <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Libre</span>}
                      </div>
                   )
                })}
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                    <Receipt size={22} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Journal Pos</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flux des ventes du jour</p>
                 </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                  <div className="py-24 text-center">
                      <History size={48} className="mx-auto mb-6 text-slate-200" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Rien à signaler pour l'instant</p>
                  </div>
              ) : (
                  transactions.slice(0, 8).map((transaction, i) => (
                      <div key={transaction.id || i} className="flex items-center justify-between p-8 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-sm tracking-tighter ${
                                 transaction.modePaiement === 'mobile' ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-900'
                              }`}>
                                  {transaction.modePaiement === 'mobile' ? 'MOBI' : 'CASH'}
                              </div>
                              <div>
                                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Ticket #{transaction.commandeId?.slice(-6).toUpperCase() || 'SYS'}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                     {transaction.serveurNom || 'Admin'} <span className="w-1 h-1 rounded-full bg-slate-200" /> {new Date(transaction.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-center gap-8">
                              <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border ${
                                  transaction.modePaiement === 'credit' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                  {transaction.modePaiement === 'credit' ? 'Note' : 'Encais'}
                              </span>
                              <p className="text-2xl font-black text-slate-950 w-32 text-right tracking-tighter uppercase">{transaction.total?.toLocaleString() || 0} F</p>
                          </div>
                      </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><TrendingUp size={20} className="text-emerald-400" /></div>
                    <h4 className="font-black text-sm uppercase tracking-widest">Force de Vente</h4>
                </div>
                <div className="space-y-6">
                   {perfServeurs.length === 0 ? (
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center py-6 border border-dashed border-white/5 rounded-2xl">Aucune donnée</p>
                   ) : (
                      perfServeurs.map(([nom, val], idx) => (
                         <div key={idx} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                               <p className="text-xs font-black uppercase text-slate-400">{nom}</p>
                               <p className="text-sm font-black text-white">{val.toLocaleString()} F</p>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(val / perfServeurs[0][1]) * 100}%` }} />
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                         <AlertTriangle size={24} />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Stock Critique</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attention immédiate</p>
                     </div>
                </div>
                <div className="space-y-8">
                    {produits.filter(p => p.stockTotal <= (p.stockAlerte || 0)).length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                          <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-3" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stocks Sécurisés</p>
                      </div>
                    ) : (
                      produits.filter(p => p.stockTotal <= (p.stockAlerte || 0)).slice(0, 5).map(p => (
                        <div key={p.id} className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-600 truncate max-w-[150px]">{p.nom}</span>
                            <span className={p.stockTotal <= 0 ? 'text-red-600' : 'text-orange-600 font-black'}>{p.stockTotal} UN.</span>
                          </div>
                          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${p.stockTotal <= 0 ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (p.stockTotal/(p.stockAlerte || 1))*100)}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                </div>
                <button onClick={() => navigate('/tableau-de-bord/stocks')} className="mt-10 w-full py-5 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-950/20 active:scale-95">
                    Inventaire Global
                </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TableauClient;
