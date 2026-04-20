import React, { useEffect, useState, useMemo } from 'react';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck, Shield, ShieldAlert,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical, DollarSign,
  Bell, Search, Menu, X, PlusCircle, Globe, History, ArrowRight, ArrowLeft, Receipt, Clock, Terminal,
  ChefHat, Flame, Timer, Wallet, Bot, Monitor, BookOpen
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePOSStore } from '../store/posStore';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

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
import GrandLivre from './modules/GrandLivre';
import IAIntelligence from './modules/IAIntelligence';
import ModuleDebug from './modules/ModuleDebug';
import SimulationLab from '../components/SimulationLab';

const TableauClient = () => {
  const { profil, deconnexion, etablissementSimuleId } = useAuthStore();
  const { initialiserTempsReel, arreterTempsReel, loading } = usePOSStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modulesActifs, setModulesActifs] = useState<string[]>(['pos', 'stock', 'hr', 'compta', 'kds', 'analytics']);

  const etablissementId = etablissementSimuleId || profil?.etablissement_id;

  // Listen to modules_actifs from Firestore in real-time
  useEffect(() => {
    if (!etablissementId) return;
    const unsub = onSnapshot(doc(db, 'etablissements', etablissementId), (snap) => {
      const data = snap.data();
      if (data?.modules_actifs) setModulesActifs(data.modules_actifs);
    });
    return () => unsub();
  }, [etablissementId]);

  const hasModule = (id: string) => modulesActifs.includes(id);

  useEffect(() => {
    if (etablissementId) {
      initialiserTempsReel(etablissementId);
    }
    return () => arreterTempsReel();
  }, [etablissementId, initialiserTempsReel, arreterTempsReel]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const isActif = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const SidebarLink = ({ icon, label, path, danger }: { icon: any, label: string, path: string, danger?: boolean }) => {
    const actif = isActif(path);
    return (
      <button 
        onClick={() => navigate(path)}
        className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all font-semibold text-sm ${
          actif 
            ? (danger ? 'bg-rose-50 text-rose-600 shadow-sm' : 'bg-blue-50 text-[#1E3A8A] shadow-sm shadow-blue-900/5') 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <span className={`${actif ? (danger ? 'text-rose-600' : 'text-[#1E3A8A]') : 'text-slate-400'}`}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {actif && <div className={`w-1.5 h-1.5 rounded-full ${danger ? 'bg-rose-600' : 'bg-[#FF7A00]'}`} />}
      </button>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-2">
          <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
          <div>
            <h2 className="text-xl font-extrabold text-[#1E3A8A] tracking-tight">
              {profil?.etablissement_nom || 'Ma Cave'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">Administration</p>
          </div>
        </div>
        
        {etablissementSimuleId && (
          <button 
            onClick={() => {
              useAuthStore.getState().setEtablissementSimule(null);
              navigate('/super-admin');
            }}
            className="w-full mt-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={14} /> Quitter le mode inspection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 no-scrollbar">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Activités</p>
          <div className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Vue d'ensemble" path="/tableau-de-bord" />
            <SidebarLink icon={<Clock size={18} />} label="Sessions de travail" path="/tableau-de-bord/sessions" />
            <SidebarLink icon={<Layout size={18} />} label="Plan des salles" path="/tableau-de-bord/plan-salles" />
            <SidebarLink icon={<PlusCircle size={18} />} label="Gestion des tables" path="/tableau-de-bord/tables" />
          </div>
        </div>

        {(hasModule('pos') || hasModule('kds')) && (
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Postes de travail</p>
          <div className="space-y-1">
            <SidebarLink icon={<Monitor size={18} />} label="Console Déploiement" path="/terminaux" />
            {hasModule('pos') && <SidebarLink icon={<ShoppingCart size={18} />} label="Point de Vente (Caisse)" path="/tableau-de-bord/caisse" />}
            {hasModule('kds') && <SidebarLink icon={<Zap size={18} />} label="Écran Cuisine" path="/tableau-de-bord/cuisine" />}
          </div>
        </div>
        )}

        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gestion Interne</p>
          <div className="space-y-1">
            {hasModule('stock') && <SidebarLink icon={<Package size={18} />} label="Inventaire & Stocks" path="/tableau-de-bord/stocks" />}
            {hasModule('stock') && <SidebarLink icon={<TrendingUp size={18} />} label="Achats Fournisseurs" path="/tableau-de-bord/achats" />}
            {hasModule('compta') && <SidebarLink icon={<DollarSign size={18} />} label="Comptabilité" path="/tableau-de-bord/admin" />}
            {hasModule('compta') && <SidebarLink icon={<BookOpen size={18} />} label="Grand Livre" path="/tableau-de-bord/grand-livre" />}
            {hasModule('hr') && <SidebarLink icon={<Users size={18} />} label="Équipe & Personnel" path="/tableau-de-bord/rh" />}
            {hasModule('hr') && <SidebarLink icon={<Wallet size={18} />} label="Paies & Salaires" path="/tableau-de-bord/paie" />}
            {hasModule('hr') && <SidebarLink icon={<Clock size={18} />} label="Borne de Pointage" path={`/pointage/${profil?.etablissement_id}`} />}
            <SidebarLink icon={<Settings size={18} />} label="Paramètres" path="/tableau-de-bord/settings" />
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-3">Intelligence & Lab</p>
          <div className="space-y-1 text-[#FF7A00]">
            <SidebarLink icon={<Bot size={18} />} label="Analyses Prédictives" path="/tableau-de-bord/ia" />
            <SidebarLink icon={<Terminal size={18} />} label="Diagnostic Système" path="/tableau-de-bord/debug" />

          </div>
        </div>
      </div>

      <div className="p-6 mt-auto">
        <button 
          onClick={() => { deconnexion(); navigate('/connexion'); }}
          className="w-full py-4 flex items-center justify-center gap-3 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-all group"
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-['Inter',sans-serif]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[300px] h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Alerte Validation */}
      {profil?.etablissement_status === 'en_attente_validation' && (
        <div className="mb-10 bg-orange-50 border-2 border-orange-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top duration-700 shadow-xl shadow-orange-900/5">
          <div className="w-20 h-20 bg-[#FF7A00] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-orange-200 shrink-0">
             <ShieldAlert size={40} />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
             <h3 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none">Compte en attente de validation</h3>
             <p className="text-slate-500 font-medium">Votre établissement est en cours de vérification par nos services. Certaines fonctionnalités de reporting global sont limitées jusqu'à l'activation complète.</p>
          </div>
          <button className="h-14 px-8 bg-[#1E3A8A] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-800 transition-all whitespace-nowrap">
            Contacter le support
          </button>
        </div>
      )}

      {/* Header Info */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0 z-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-slate-50 rounded-2xl px-5 h-12 w-[400px] border border-slate-100 group focus-within:border-blue-200 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-[#1E3A8A]" />
              <input type="text" placeholder="Rechercher une transaction, un employé..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 font-medium" />
            </div>
            
            {window.location.hostname === 'localhost' && (
              <div className="flex items-center gap-2 px-4 h-10 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-orange-500/20">
                <AlertTriangle size={14} /> Mode Test Local - Données Réelles
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 h-12 px-5 bg-blue-50/50 rounded-2xl text-[#1E3A8A] font-bold text-sm border border-blue-100/50">
               <Calendar size={18} className="text-[#FF7A00]" />
               <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            
            <div className="flex items-center gap-5 pl-8 border-l border-slate-100">
               <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session Propriétaire</p>
                  <p className="text-lg font-black text-[#1E3A8A] tracking-tighter leading-none">
                    Bienvenue, <span className="text-[#FF7A00]">{profil?.prenom || 'Monsieur'}</span> !
                  </p>
               </div>
               <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A] to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20 relative group cursor-pointer border-2 border-white">
                  <span className="font-black text-lg">{profil?.prenom?.[0] || 'A'}</span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* ── Routes libres (toujours accessibles) ── */}
              <Route path="/" element={<DashboardAccueil profil={profil} etablissementSimuleId={etablissementSimuleId} navigate={navigate} />} />
              <Route path="/plan-salles" element={<PlanDeSalles />} />
              <Route path="/tables" element={<GestionTables />} />
              <Route path="/sessions" element={<GestionSessions />} />
              <Route path="/settings" element={<GestionEtablissement />} />
              <Route path="/debug" element={<ModuleDebug />} />

              {/* ── POS ── */}
              <Route path="/caisse" element={
                <ModuleGuard module="pos" modulesActifs={modulesActifs} navigate={navigate}>
                  <InterfaceCaissier />
                </ModuleGuard>
              } />

              {/* ── KDS ── */}
              <Route path="/cuisine" element={
                <ModuleGuard module="kds" modulesActifs={modulesActifs} navigate={navigate}>
                  <InterfaceCuisine />
                </ModuleGuard>
              } />

              {/* ── RH ── */}
              <Route path="/rh" element={
                <ModuleGuard module="hr" modulesActifs={modulesActifs} navigate={navigate}>
                  <GestionEmployes />
                </ModuleGuard>
              } />
              <Route path="/paie" element={
                <ModuleGuard module="hr" modulesActifs={modulesActifs} navigate={navigate}>
                  <GestionPaie />
                </ModuleGuard>
              } />

              {/* ── STOCK ── */}
              <Route path="/stocks" element={
                <ModuleGuard module="stock" modulesActifs={modulesActifs} navigate={navigate}>
                  <GestionStocks />
                </ModuleGuard>
              } />
              <Route path="/achats" element={
                <ModuleGuard module="stock" modulesActifs={modulesActifs} navigate={navigate}>
                  <GestionAchats />
                </ModuleGuard>
              } />

              {/* ── COMPTA ── */}
              <Route path="/admin" element={
                <ModuleGuard module="compta" modulesActifs={modulesActifs} navigate={navigate}>
                  <GestionFinance />
                </ModuleGuard>
              } />
              <Route path="/grand-livre" element={
                <ModuleGuard module="compta" modulesActifs={modulesActifs} navigate={navigate}>
                  <GrandLivre />
                </ModuleGuard>
              } />

              {/* ── ANALYTICS ── */}
              <Route path="/ia" element={
                <ModuleGuard module="analytics" modulesActifs={modulesActifs} navigate={navigate}>
                  <IAIntelligence />
                </ModuleGuard>
              } />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardAccueil = ({ profil, etablissementSimuleId, navigate }: any) => {
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const { produits, tables, sessionActive, commandes, loading } = usePOSStore();
  const [transactions, setTransactions] = React.useState<any[]>([]);

  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;

  React.useEffect(() => {
    if (!etablissementId) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const q = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', today.toISOString())
    );
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [etablissementId]);

  const ventesDuJour = transactions.reduce((acc, t) => acc + (t.montant || 0), 0);
  const potentielSalle = commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + ((c.total || 0) - (c.montantPaye || 0)), 0);
  const dettes = transactions.filter(t => t.modePaiement === 'credit').reduce((acc, t) => acc + (t.montantRestant || 0), 0);
  const especes = transactions.filter(t => t.modePaiement === 'especes').reduce((acc, t) => acc + (t.montant || 0), 0);

  const perfServeurs = useMemo(() => {
    const map: { [name: string]: number } = {};
    transactions.forEach(t => {
       const nom = t.serveurNom || 'Inconnu';
       map[nom] = (map[nom] || 0) + (t.montant || 0);
    });
    return Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10 text-center md:text-left">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 bg-[#FF7A00] rounded-full animate-pulse" />
              Surveillance en direct
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Tableau de bord <span className="text-[#FF7A00]">Patron</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Bienvenue. Voici l'état actuel de votre établissement en temps réel.</p>
        </div>

        <div className="shrink-0 relative z-10">
             {loading ? (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-5 pr-10 shadow-sm animate-pulse">
                   <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center">
                      <Clock size={28} className="text-slate-400" />
                   </div>
                   <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Synchronisation...</p>
                      <p className="text-xl font-extrabold text-slate-300">Vérification caisse</p>
                   </div>
                </div>
             ) : sessionActive ? (
               <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-5 pr-10 shadow-sm">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                     <Activity size={28} />
                  </div>
                  <div>
                     <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Session Active</p>
                     <p className="text-xl font-extrabold text-slate-800">{sessionActive.caissierNom}</p>
                  </div>
               </div>
             ) : (
               <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-5 pr-10 shadow-sm">
                  <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                     <Shield size={28} />
                  </div>
                  <div>
                     <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mb-1">Système Hors-ligne</p>
                     <p className="text-xl font-extrabold text-slate-800">Caisse fermée</p>
                  </div>
               </div>
             )}
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="CA Encaissé" valeur={ventesDuJour} unit="XAF" icon={<Wallet className="text-[#1E3A8A]" />} />
        <MetricCard label="Potentiel (En salle)" valeur={potentielSalle} unit="XAF" icon={<Activity className="text-[#FF7A00]" />} />
        <MetricCard label="Encaissé (Espèces)" valeur={especes} unit="XAF" icon={<DollarSign className="text-emerald-500" />} />
        <MetricCard label="Dettes Clients" valeur={dettes} unit="XAF" icon={<AlertTriangle className="text-rose-500" />} trend="danger" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Suivi des Salles */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-sm"><Activity size={24} /></div>
                   <div>
                      <h3 className="text-xl font-bold text-[#1E3A8A]">Suivi des Salles</h3>
                      <p className="text-xs font-semibold text-slate-400">Occupation des tables en temps réel</p>
                   </div>
                </div>
                <button onClick={() => navigate('/tableau-de-bord/plan-salles')} className="text-xs font-bold text-[#1E3A8A] px-5 py-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
                   Voir le plan détaillé
                </button>
             </div>

             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {tables.slice(0, 24).map(table => {
                   const cmd = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   return (
                      <div key={table.id} className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                         table.statut === 'occupee' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-lg shadow-blue-900/10' : 
                         table.statut === 'en_attente_paiement' ? 'bg-[#FF7A00] text-white border-[#FF7A00] shadow-lg shadow-orange-900/10' : 'bg-white text-slate-300 border-slate-100'
                      }`}>
                         <span className="text-[10px] font-bold uppercase tracking-tight">{table.nom.split(' ')[1] || table.nom}</span>
                         {cmd && <span className="text-xs font-black">{(cmd.total || 0).toLocaleString()}</span>}
                      </div>
                   )
                })}
             </div>
          </div>

          <PerformanceCuisine commandes={commandes} />

          {/* Historique des Ventes */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white text-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-sm border border-slate-100"><Receipt size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1E3A8A]">Historique des Ventes</h3>
                    <p className="text-xs font-semibold text-slate-400">Derniers règlements enregistrés</p>
                  </div>
               </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto no-scrollbar">
              {transactions.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Receipt size={32} />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Aucune transaction aujourd'hui</p>
                  </div>
              ) : (
                  transactions.slice(0, 20).map((transaction, i) => (
                      <div key={transaction.id || i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-xs text-slate-500">
                                  {transaction.modePaiement?.slice(0, 4).toUpperCase() || 'SYS'}
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Note #{transaction.commandeId?.slice(-6).toUpperCase() || '...'}</h4>
                                  <p className="text-xs font-semibold text-slate-400 mt-1">{new Date(transaction.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})} • Serveur : {transaction.serveurNom || 'Système'}</p>
                              </div>
                          </div>
                          <p className="text-xl font-extrabold text-[#1E3A8A] tracking-tight">{transaction.total?.toLocaleString() || 0} <span className="text-xs font-bold opacity-40 ml-1">XAF</span></p>
                      </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
             {/* Performance Serveurs */}
             <div className="bg-[#1E3A8A] p-8 rounded-[2rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6 relative z-10">
                    <TrendingUp size={24} className="text-[#FF7A00]" />
                    <h4 className="font-bold text-sm uppercase tracking-widest">Performance Serveurs</h4>
                </div>
                <div className="space-y-8 relative z-10">
                   {perfServeurs.length === 0 ? (
                     <p className="text-blue-100/40 text-xs font-bold text-center py-10 uppercase tracking-widest">En attente de données</p>
                   ) : perfServeurs.map(([nom, val], idx) => (
                      <div key={idx} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <p className="text-xs font-bold text-blue-100/60">{nom}</p>
                            <p className="text-lg font-extrabold text-white tracking-tight">{val.toLocaleString()} <span className="text-[10px] opacity-40">XAF</span></p>
                         </div>
                         <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#FF7A00] to-orange-400 rounded-full" style={{ width: `${(val / (perfServeurs[0][1] || 1)) * 100}%` }} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Alertes Stock */}
             <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                     <div>
                        <h4 className="text-xl font-bold text-slate-800">Alertes Stock</h4>
                        <p className="text-xs font-semibold text-slate-400">Produits en rupture ou critique</p>
                     </div>
                </div>
                <div className="space-y-6">
                    {produits.filter(p => p.stockTotal <= (p.stockAlerte || 0)).length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 rounded-2xl">
                        <ShieldCheck size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock optimal</p>
                      </div>
                    ) : produits.filter(p => p.stockTotal <= (p.stockAlerte || 0)).slice(0, 6).map(p => (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 truncate max-w-[150px]">{p.nom}</span>
                          <span className={p.stockTotal <= 0 ? 'text-rose-600' : 'text-[#FF7A00]'}>{p.stockTotal} unités</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${p.stockTotal <= 0 ? 'bg-rose-600' : 'bg-[#FF7A00]'}`} style={{ width: `${Math.min(100, (p.stockTotal/(p.stockAlerte || 1))*100)}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
                <button onClick={() => navigate('/tableau-de-bord/stocks')} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-[#1E3A8A] transition-all flex items-center justify-center gap-3">
                    Gérer l'inventaire <ArrowRight size={16} />
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, valeur, unit, icon, trend }: any) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 group hover:scale-[1.02] transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
          {icon}
        </div>
        {trend === 'danger' && <div className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg">Alerte</div>}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
        {valeur.toLocaleString()} <span className="text-sm font-bold text-slate-400 ml-1">{unit}</span>
      </h3>
  </div>
);

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
          
          const cat = l.produitCategorie || 'Général';
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
     <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center"><ChefHat size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-[#1E3A8A]">Performance Cuisine</h3>
                  <p className="text-xs font-semibold text-slate-400">Temps de préparation par catégorie</p>
                </div>
            </div>
            <div className="text-right bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Moyenne Globale</p>
                <p className="text-2xl font-extrabold text-[#1E3A8A] tracking-tight">{stats.avgGlobal} <span className="text-sm font-bold opacity-40">min</span></p>
            </div>
        </div>

        {stats.categories.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">En attente de commandes préparées</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.categories.slice(0, 8).map((cat, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white transition-all">
                      <div className={`w-12 h-12 mb-4 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                          cat.avg > 15 ? 'bg-rose-500 text-white shadow-rose-200' : 
                          cat.avg > 8 ? 'bg-[#FF7A00] text-white shadow-orange-200' : 'bg-emerald-500 text-white shadow-emerald-200'
                      }`}>
                          {cat.avg}'
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{cat.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} plats</p>
                      </div>
                  </div>
              ))}
          </div>
        )}
     </div>
  );
};

const ModuleGuard = ({ module, modulesActifs, navigate, children }: any) => {
  const isAllowed = modulesActifs.includes(module);
  
  useEffect(() => {
    if (!isAllowed) {
      toast.error(`Le module "${module}" n'est pas activé pour votre établissement.`);
      navigate('/tableau-de-bord');
    }
  }, [isAllowed, module, navigate]);

  if (!isAllowed) return null;
  return children;
};

export default TableauClient;
