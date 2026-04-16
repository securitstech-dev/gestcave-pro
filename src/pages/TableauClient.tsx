import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, 
  Layout, LayoutDashboard, Zap, Activity, ShieldCheck,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical,
  Bell, Search, Menu, X, PlusCircle, Globe
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

  useEffect(() => {
    if (profil?.etablissement_id) {
      initialiserTempsReel(profil.etablissement_id);
    }
    return () => arreterTempsReel();
  }, [profil?.etablissement_id, initialiserTempsReel, arreterTempsReel]);

  const isActif = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar - Premium Glassmorphism */}
      <aside className="w-80 h-screen hidden lg:flex flex-col border-r border-white/5 bg-[#030712]/50 backdrop-blur-3xl sticky top-0 z-50">
        <div className="p-8 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wine size={26} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl tracking-tighter text-white truncate max-w-[180px]">
              {profil?.nom?.toUpperCase() || 'GESTCAVE PRO'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connecté</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 custom-scrollbar pb-10">
          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50">Menu Principal</p>
            <nav className="space-y-2">
              <ElementNavClient icon={<LayoutDashboard size={20} />} label="Vue d'ensemble" actif={location.pathname === '/tableau-de-bord' || location.pathname === '/tableau-de-bord/'} onClick={() => navigate('/tableau-de-bord')} />
              <ElementNavClient icon={<Layout size={20} />} label="Plan Interactif" actif={isActif('/tableau-de-bord/plan-salles')} onClick={() => navigate('/tableau-de-bord/plan-salles')} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50">Opérations Live</p>
            <nav className="space-y-2">
              <ElementNavClient icon={<ShoppingCart size={20} />} label="Caisse & Ventes" actif={isActif('/tableau-de-bord/caisse')} onClick={() => navigate('/tableau-de-bord/caisse')} />
              <ElementNavClient icon={<Zap size={20} />} label="Production Cuisine" actif={isActif('/tableau-de-bord/cuisine')} onClick={() => navigate('/tableau-de-bord/cuisine')} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50">Logistique & RH</p>
            <nav className="space-y-2">
              <ElementNavClient icon={<Package size={20} />} label="Approvisionnement" actif={isActif('/tableau-de-bord/achats')} onClick={() => navigate('/tableau-de-bord/achats')} />
              <ElementNavClient icon={<TrendingUp size={20} />} label="Stocks & Inventaires" actif={isActif('/tableau-de-bord/stocks')} onClick={() => navigate('/tableau-de-bord/stocks')} />
              <ElementNavClient icon={<Users size={20} />} label="Équipe & Personnel" actif={isActif('/tableau-de-bord/rh')} onClick={() => navigate('/tableau-de-bord/rh')} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50">Paramètres</p>
            <nav className="space-y-2">
              <ElementNavClient icon={<Settings size={20} />} label="Configuration Salles" actif={isActif('/tableau-de-bord/tables')} onClick={() => navigate('/tableau-de-bord/tables')} />
              <ElementNavClient icon={<Settings size={20} />} label="Finances & Taxes" actif={isActif('/tableau-de-bord/admin')} onClick={() => navigate('/tableau-de-bord/admin')} />
              <ElementNavClient icon={<CreditCard size={20} />} label="Mon Abonnement" actif={false} onClick={() => navigate('/abonnement')} />
            </nav>
          </div>
        </div>
        
        <div className="p-8 border-t border-white/5 bg-slate-900/30">
            <button 
              onClick={() => { deconnexion(); navigate('/connexion'); }}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all">
                    <LogOut size={18} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">Déconnexion</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bureau Principal</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-red-400" />
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-[#020617] relative">
        {/* Top Floating bar (Mobile & Search) */}
        <header className="sticky top-0 z-40 p-6 flex justify-between items-center bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
             <div className="flex items-center gap-4 flex-1">
                 <button className="lg:hidden w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Menu size={20} />
                 </button>
                 <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl w-full max-w-md group focus-within:border-indigo-500/50 transition-all">
                    <Search size={18} className="text-slate-500 group-focus-within:text-indigo-500" />
                    <input type="text" placeholder="Rechercher une vente, un produit, un employé..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600" />
                    <span className="text-[10px] font-black text-slate-700 border border-white/10 px-1.5 py-0.5 rounded uppercase">CRTL+K</span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                    <Calendar size={16} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                       {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                 </div>
                 <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020617]" />
                 </button>
                 <div className="w-12 h-12 rounded-2xl border-2 border-indigo-500/30 p-1 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-sm">
                        {profil?.prenom?.[0] || 'A'}
                    </div>
                 </div>
             </div>
        </header>

        <div className="p-8 md:p-12">
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
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
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
    toast.success('Lien copié pour le personnel !', { position: 'top-center' });
    setTimeout(() => setLienCopie(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <p className="text-indigo-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-3 flex items-center gap-2">
             <Activity size={14} /> LIVE DASHBOARD
          </p>
          <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
            HELLO, {profil?.prenom?.toUpperCase() || 'MANAGER'}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-3 uppercase tracking-widest">Performance stabilisée · 9 connexions actives</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
             <button
               onClick={copierLienPoste}
               className={`h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border ${
                 lienCopie 
                   ? 'bg-emerald-500 border-transparent text-white shadow-xl shadow-emerald-500/20' 
                   : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
               }`}
             >
               {lienCopie ? <ShieldCheck size={18} /> : <Globe size={18} />}
               {lienCopie ? 'LIEN PERSONNEL COPIÉ' : 'ACCÈS STAFF CLOUD'}
             </button>
             <button 
               onClick={() => navigate('/abonnement')}
               className="h-14 px-8 rounded-2xl bg-indigo-600 font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-3"
             >
               <PlusCircle size={18} /> GÉRER ABONNEMENT
             </button>
        </div>
      </header>

      {/* Main Stats - Ultra Modern Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Chiffre du Jour" 
            valeur={`${ventesDuJour.toLocaleString()}`} 
            suffix="F"
            subtext="Encaissés à 100%"
            icon={<TrendingUp size={20} className="text-emerald-400" />}
            color="emerald"
            tendance="+24.5%"
            variant="large"
        />
        <StatCard 
            label="Bons en Cours" 
            valeur={commandes.length.toString()} 
            subtext="En attente service"
            icon={<Zap size={20} className="text-orange-400" />}
            color="orange"
            variant="large"
        />
        <StatCard 
            label="Affluence" 
            valeur={commandes.reduce((acc, c) => acc + c.nombreCouverts, 0).toString()} 
            suffix=" PAX"
            subtext="Tables occupées"
            icon={<Users size={20} className="text-indigo-400" />}
            color="indigo"
            variant="large"
        />
        <StatCard 
            label="Alertes Stock" 
            valeur={produits.filter(p => p.stockTotal <= p.stockAlerte).length.toString()} 
            subtext="Items en rupture"
            icon={<AlertTriangle size={20} className="text-rose-400" />}
            color="rose"
            important={produits.filter(p => p.stockTotal <= p.stockAlerte).length > 0}
            variant="large"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-10">
          <div className="flex justify-between items-center mb-10 px-2">
            <div>
                 <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase">Flux Opérationnel</h3>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Dernières commandes temps réel</p>
            </div>
            <button onClick={() => navigate('/tableau-de-bord/caisse')} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all border border-white/5">
                Voir tout le journal
            </button>
          </div>

          <div className="space-y-4">
            {commandes.length === 0 ? (
                <div className="py-20 text-center text-slate-700 bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                    <History size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-xs">Aucun mouvement détecté</p>
                </div>
            ) : (
                commandes.slice(0, 8).map((commande, i) => (
                    <motion.div 
                        key={commande.id || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex items-center justify-between p-5 bg-white/[0.01] hover:bg-white/[0.03] rounded-3xl border border-transparent hover:border-white/5 transition-all"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center font-display font-black text-indigo-400 text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                {commande.tableNom?.slice(0, 3) || 'DIR'}
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm uppercase tracking-tight mb-1">Bon #{commande.id.slice(-4).toUpperCase()}</h4>
                                <div className="flex items-center gap-3">
                                     <span className="text-[10px] font-black text-slate-600 tracking-tighter uppercase whitespace-nowrap">Serveur: {commande.serveurNom}</span>
                                     <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                         commande.statut === 'payee' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                                     }`}>
                                         {commande.statut}
                                     </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-2xl font-display font-black text-white leading-none">{commande.total.toLocaleString()}</p>
                             <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Francs CFA</p>
                        </div>
                    </motion.div>
                ))
            )}
          </div>
        </div>

        {/* Right Sidebar Widget */}
        <div className="space-y-8">
             {/* Stock Status Widget */}
             <div className="bg-gradient-to-br from-rose-600/10 to-[#020617] border border-rose-500/10 rounded-[3rem] p-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                         <AlertTriangle size={24} />
                     </div>
                     <div>
                         <h4 className="font-display font-black text-white uppercase tracking-tight">Focus Stock</h4>
                         <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mt-1">Seuils d'alerte atteints</p>
                     </div>
                </div>

                <div className="space-y-4">
                    {produits.filter(p => p.stockTotal <= p.stockAlerte).length === 0 ? (
                      <div className="py-10 text-center">
                          <ShieldCheck size={40} className="mx-auto text-emerald-500/20 mb-4" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opérations optimales</p>
                      </div>
                    ) : (
                      produits.filter(p => p.stockTotal <= p.stockAlerte).slice(0, 6).map(p => (
                        <StockAlertLine key={p.id} nom={p.nom} stock={p.stockTotal} alerte={p.stockAlerte} />
                      ))
                    )}
                </div>

                <button 
                    onClick={() => navigate('/tableau-de-bord/achats')} 
                    className="mt-10 w-full py-5 rounded-2xl bg-rose-600 font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    PASSER COMMANDE <ArrowUpRight size={16} />
                </button>
             </div>

             {/* Quick Actions / Integration */}
             <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-4">Besoin d'aide ?</h4>
                  <p className="text-sm font-bold text-white mb-6">Assistance technique ultra-prioritaire 24/7</p>
                  <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                      CONTACTER MON AGENT
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
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${
      actif 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98]' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
    }`}
  >
    {actif && (
        <motion.div layoutId="nav-active" className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />
    )}
    <div className={`transition-transform duration-300 ${actif ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
    </div>
    <span className="font-bold text-[13px] tracking-tight">{label}</span>
    {actif && <ArrowRight size={14} className="ml-auto opacity-40" />}
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
      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
        <span className="text-slate-400 group-hover:text-white transition-colors">{nom}</span>
        <span className={stock <= 0 ? "text-rose-500" : "text-amber-500"}>
            {stock <= 0 ? "RUPTURE" : `${stock} restant(s)`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(ratio, 100)}%` }}
            className={`h-full rounded-full ${stock <= 0 ? 'bg-rose-600' : 'bg-rose-500 opacity-60'}`}
         />
      </div>
    </div>
  );
};

export default TableauClient;
