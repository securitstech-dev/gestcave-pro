import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical,
  Bell, Search, Menu, X, PlusCircle, Globe, History as HistoryIcon, ArrowRight
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
        <div className="p-8 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
            <Wine size={26} className="text-white" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-lg tracking-tight text-slate-900 truncate max-w-[180px]">
              {profil?.nom?.toUpperCase() || 'GESTCAVE PRO'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connecté</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 custom-scrollbar pb-10">
          <div>
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navigation</p>
            <nav className="space-y-1">
              <ElementNavClient icon={<LayoutDashboard size={18} />} label="Vue d'ensemble" actif={location.pathname === '/tableau-de-bord' || location.pathname === '/tableau-de-bord/'} onClick={() => navigate('/tableau-de-bord')} />
              <ElementNavClient icon={<Layout size={18} />} label="Plan Interactif" actif={isActif('/tableau-de-bord/plan-salles')} onClick={() => navigate('/tableau-de-bord/plan-salles')} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Opérations</p>
            <nav className="space-y-1">
              <ElementNavClient icon={<ShoppingCart size={18} />} label="Caisse Centrale" actif={isActif('/tableau-de-bord/caisse')} onClick={() => navigate('/tableau-de-bord/caisse')} />
              <ElementNavClient icon={<Zap size={18} />} label="Service Cuisine" actif={isActif('/tableau-de-bord/cuisine')} onClick={() => navigate('/tableau-de-bord/cuisine')} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Gestion Logistique</p>
            <nav className="space-y-1">
              <ElementNavClient icon={<Package size={18} />} label="Stock & Inventaire" actif={isActif('/tableau-de-bord/stocks')} onClick={() => navigate('/tableau-de-bord/stocks')} />
              <ElementNavClient icon={<TrendingUp size={18} />} label="Flux d'Achats" actif={isActif('/tableau-de-bord/achats')} onClick={() => navigate('/tableau-de-bord/achats')} />
              <ElementNavClient icon={<Users size={18} />} label="Ressources Humaines" actif={isActif('/tableau-de-bord/rh')} onClick={() => navigate('/tableau-de-bord/rh')} />
            </nav>
          </div>
        </div>
        
        <div className="p-8 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => { deconnexion(); navigate('/connexion'); }}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-500 group-hover:text-red-600 transition-all">
                    <LogOut size={18} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">Quitter</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Bureau de gestion</p>
                </div>
              </div>
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-80 h-screen hidden lg:flex flex-col sticky top-0 z-50">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[70] lg:hidden flex flex-col border-r border-slate-200"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-slate-50 relative">
        {/* Top bar administrative */}
        <header className="sticky top-0 z-40 p-4 md:px-10 md:py-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200">
             <div className="flex items-center gap-4 flex-1">
                 <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200"
                 >
                    <Menu size={18} />
                 </button>
                 <div className="hidden md:flex items-center gap-3 bg-slate-100 border border-slate-200 px-6 py-2 rounded-xl w-full max-w-md group focus-within:border-blue-500/50 transition-all">
                    <Search size={16} className="text-slate-400 group-focus-within:text-blue-600" />
                    <input type="text" placeholder="Recherche administrative..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400" />
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl">
                    <Calendar size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                       {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                 </div>
                 <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 relative hover:bg-slate-50 transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                 </button>
                 <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-slate-900/20">
                    {profil?.prenom?.[0] || 'A'}
                 </div>
             </div>
        </header>
        <main className="p-4 md:p-10 max-w-[1600px] mx-auto">
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
            </Routes>
        </main>
      </main>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-2">TABLEAU DE BORD GÉNÉRAL</p>
          <h1 className="text-3xl md:text-4xl font-sans font-bold text-slate-900 tracking-tight">
            Bienvenue, {profil?.prenom || 'Administrateur'}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Surveillez les performances opérationnelles en temps réel.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <button
               onClick={copierLienPoste}
               className={`flex-1 md:flex-none py-3 px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 border ${
                 lienCopie ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
               }`}
             >
               {lienCopie ? <ShieldCheck size={16} /> : <Globe size={16} />}
               ACCÈS PERSONNEL
             </button>
             <button 
               onClick={() => navigate('/tableau-de-bord/achats')}
               className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-slate-900 font-bold text-[11px] text-white uppercase tracking-widest shadow-lg shadow-slate-950/10 hover:bg-slate-800 transition-all flex items-center gap-3"
             >
               <PlusCircle size={16} /> NOUVEL ACHAT
             </button>
        </div>
      </header>


      {/* Stats Administratrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Recettes du Jour" valeur={`${ventesDuJour.toLocaleString()}`} suffix="F" icon={<TrendingUp size={20} />} color="emerald" tendance="+12%" variant="admin" />
        <StatCard label="Service en Cours" valeur={commandes.length.toString()} subtext="Tables actives" icon={<Zap size={20} />} color="blue" variant="admin" />
        <StatCard label="Clients Servis" valeur={commandes.reduce((acc, c) => acc + c.nombreCouverts, 0).toString()} suffix=" PAX" icon={<Users size={20} />} color="indigo" variant="admin" />
        <StatCard label="Alertes Stock" valeur={produits.filter(p => p.stockTotal <= p.stockAlerte).length.toString()} subtext="Items en rupture" icon={<AlertTriangle size={20} />} color="red" variant="admin" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        {/* Liste des Commandes Professionnelle */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900">Journal des Opérations</h3>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Imprimer le rapport</button>
          </div>

          <div className="space-y-0 divide-y divide-slate-100">
            {commandes.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <HistoryIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Aucune activité enregistrée aujourd'hui.</p>
                </div>
            ) : (
                commandes.slice(0, 8).map((commande, i) => (
                    <motion.div 
                        key={commande.id || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-5 hover:bg-slate-50 transition-colors px-2 rounded-xl"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                {commande.tableNom?.slice(0, 3)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Bon Id: {commande.id.slice(-6).toUpperCase()}</h4>
                                <div className="flex items-center gap-3">
                                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Par {commande.serveurNom}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                                commande.statut === 'payee' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {commande.statut}
                            </span>
                            <p className="text-lg font-bold text-slate-900 w-24 text-right">{commande.total.toLocaleString()} F</p>
                        </div>
                    </motion.div>
                ))
            )}
          </div>
        </div>

        {/* Sidebar Administrative */}
        <div className="space-y-6">
             <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                         <AlertTriangle size={20} />
                     </div>
                     <h4 className="font-bold text-slate-900 text-sm">Contrôle des Stocks</h4>
                </div>
                <div className="space-y-4">
                    {produits.filter(p => p.stockTotal <= p.stockAlerte).length === 0 ? (
                      <div className="py-6 text-center">
                          <ShieldCheck size={32} className="mx-auto text-emerald-500/50 mb-2" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opérations optimales</p>
                      </div>
                    ) : (
                      produits.filter(p => p.stockTotal <= p.stockAlerte).slice(0, 5).map(p => (
                        <StockAlertLine key={p.id} nom={p.nom} stock={p.stockTotal} alerte={p.stockAlerte} />
                      ))
                    )}
                </div>
                <button onClick={() => navigate('/tableau-de-bord/achats')} className="mt-8 w-full py-4 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Ajuster les stocks
                </button>
             </div>

             <div className="bg-slate-900 rounded-3xl p-8 text-white">
                  <h4 className="font-bold text-sm mb-2">Centre de Support Administrateur</h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">Accédez à votre conseiller dédié pour toute question comptable ou technique.</p>
                  <button className="w-full py-4 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-all">
                      Aide Prioritaire
                  </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
};

// -- UI SUB-COMPONENTS --

interface ElementNavClientProps {
  icon: React.ReactNode;
  label: string;
  actif?: boolean;
  onClick: () => void;
}

const ElementNavClient = ({ icon, label, actif = false, onClick }: ElementNavClientProps) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all relative group ${
      actif 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    <div className={`transition-transform duration-300 ${actif ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
    </div>
    <span className="font-bold text-sm tracking-tight">{label}</span>
    {actif && <ArrowRight size={14} className="ml-auto opacity-40 text-white" />}
  </button>
);



interface StockAlertLineProps {
  nom: string;
  stock: number;
  alerte: number;
}

const StockAlertLine = ({ nom, stock, alerte }: StockAlertLineProps) => {
  const ratio = (stock / alerte) * 100;
  return (
    <div className="group space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-600 truncate max-w-[150px]">{nom}</span>
        <span className={`font-bold ${stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
            {stock <= 0 ? "RUPTURE" : `${stock} un.`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(ratio, 100)}%` }}
            className={`h-full rounded-full ${stock <= 0 ? 'bg-red-600' : 'bg-amber-500'}`}
         />
      </div>
    </div>
  );
};

export default TableauClient;
