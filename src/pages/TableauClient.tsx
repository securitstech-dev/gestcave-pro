import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical, DollarSign,
  Bell, Search, Menu, X, PlusCircle, Globe, History, ArrowRight, Receipt
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePOSStore } from '../store/posStore';
import { toast } from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';

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
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-950/20">
          <Wine size={20} />
        </div>
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
              <Route path="/settings" element={<GestionEtablissement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardAccueil = ({ profil, navigate }: any) => {
  const { commandes, produits } = usePOSStore();
  const [lienCopie, setLienCopie] = React.useState(false);

  const ventesDuJour = commandes
    .filter(c => c.statut === 'payee')
    .reduce((acc, c) => acc + c.total, 0);

  const copierLienPoste = () => {
    if (!profil?.etablissement_id) return;
    const lien = `${window.location.origin}/poste/${profil.etablissement_id}`;
    navigator.clipboard.writeText(lien);
    setLienCopie(true);
    toast.success('Lien copié pour le personnel !');
    setTimeout(() => setLienCopie(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Bonjour, {profil?.prenom || 'Administrateur'}</h1>
          <p className="text-slate-500 font-medium mt-1">Résumé global de votre établissement pour aujourd'hui.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <button
               onClick={copierLienPoste}
               className={`flex-1 md:flex-none py-3.5 px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-sm ${
                 lienCopie ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
               }`}
             >
               {lienCopie ? <ShieldCheck size={16} /> : <Globe size={16} />}
               Ligne Serveurs
             </button>
             <button 
               onClick={() => navigate('/tableau-de-bord/achats')}
               className="flex-1 md:flex-none py-3.5 px-6 rounded-xl bg-slate-900 font-bold text-[11px] text-white uppercase tracking-widest shadow-xl shadow-slate-950/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
             >
               <PlusCircle size={16} /> Nouvel Achat
             </button>
        </div>
      </div>

      {/* Cartes de Stats Alpha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Recettes (F)" valeur={`${ventesDuJour.toLocaleString()}`} icon={<TrendingUp size={22} />} color="emerald" tendance="+8.4%" />
        <StatCard label="Commandes Actives" valeur={commandes.filter(c => c.statut !== 'payee').length} icon={<Zap size={22} />} color="blue" subtext="En salle" />
        <StatCard label="Dettes Clients" valeur={`${commandes.filter(c => c.statut === 'payee' && c.methodePaiement === 'credit').reduce((acc, c) => acc + (c.total - (c.montantPaye || 0)), 0).toLocaleString()}`} suffix="F" icon={<Users size={22} />} color="blue" subtext="À recouvrir" />
        <StatCard label="Items Critiques" valeur={produits.filter(p => p.stockTotal <= p.stockAlerte).length} icon={<AlertTriangle size={22} />} color="red" important={produits.filter(p => p.stockTotal <= p.stockAlerte).length > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Liste des Opérations */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                  <Receipt size={18} />
               </div>
               <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Journal des Opérations</h3>
            </div>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Voir Tout</button>
          </div>

          <div className="divide-y divide-slate-100">
            {commandes.length === 0 ? (
                <div className="py-24 text-center">
                    <History size={48} className="mx-auto mb-6 text-slate-200" />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Aucun mouvement aujourd'hui</p>
                </div>
            ) : (
                commandes.slice(0, 8).map((commande, i) => (
                    <div key={commande.id || i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-xs">
                                {commande.tableNom?.toUpperCase().slice(0, 3)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Tournée #{commande.id.slice(-6).toUpperCase()}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client {commande.serveurNom}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                                commande.statut === 'payee' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {commande.statut}
                            </span>
                            <p className="text-lg font-bold text-slate-900 w-24 text-right uppercase tracking-tighter">{commande.total.toLocaleString()} F</p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Sidebar d'alertes */}
        <div className="space-y-6">
             <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                         <AlertTriangle size={20} />
                     </div>
                     <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Ruptures & Alertes</h4>
                </div>
                <div className="space-y-6">
                    {produits.filter(p => p.stockTotal <= p.stockAlerte).length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-3" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stocks Verrouillés</p>
                      </div>
                    ) : (
                      produits.filter(p => p.stockTotal <= p.stockAlerte).slice(0, 5).map(p => (
                        <div key={p.id} className="space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                            <span className="text-slate-600 truncate max-w-[150px]">{p.nom}</span>
                            <span className={p.stockTotal <= 0 ? 'text-red-600' : 'text-orange-600'}>{p.stockTotal} un.</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full ${p.stockTotal <= 0 ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${(p.stockTotal/p.stockAlerte)*100}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                </div>
                <button onClick={() => navigate('/tableau-de-bord/stocks')} className="mt-8 w-full py-4 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-950/10">
                    Gérer Inventaire
                </button>
             </div>

             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="font-bold text-sm mb-2 uppercase tracking-tight">Support GESTCAVE</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">Besoin d'aide pour vos rapports ou d'un conseil technique ?</p>
                    <button className="w-full py-4 rounded-xl bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-all border border-white/10">
                        Assistance Immédiate
                    </button>
                  </div>
                  <Wine size={80} className="absolute -bottom-4 -right-4 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
             </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TableauClient;
