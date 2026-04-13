import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PointDeVente from './erp/PointDeVente';
import GestionStocks from './erp/GestionStocks';
import CuisineBar from './erp/CuisineBar';
import RessourcesHumaines from './erp/RessourcesHumaines';
import AdministratifTaxes from './erp/AdministratifTaxes';

const TableauClient = () => {
  const { profil, deconnexion } = useAuthStore();
  const navigate = useNavigate();

  const gererDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  const pathname = useLocation().pathname;
  const isActif = (path: string) => pathname === path || pathname === path + '/';

  return (
    <div className="flex min-h-screen">
      {/* Barre latérale client - Floating Design */}
      <aside className="w-64 glass-panel m-6 rounded-[2rem] p-6 flex flex-col fixed h-[calc(100vh-3rem)] z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary p-2 rounded-lg">
            <Wine size={20} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-lg truncate">{profil?.nom || 'Mon Établissement'}</h2>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <ElementNavClient icon={<TrendingUp size={18} />} label="Vue d'ensemble" actif={isActif('/tableau-de-bord')} onClick={() => navigate('/tableau-de-bord')} />
          <ElementNavClient icon={<ShoppingCart size={18} />} label="Caisse (POS)" actif={isActif('/tableau-de-bord/caisse')} onClick={() => navigate('/tableau-de-bord/caisse')} />
          <ElementNavClient icon={<Package size={18} />} label="Stocks" actif={isActif('/tableau-de-bord/stocks')} onClick={() => navigate('/tableau-de-bord/stocks')} />
          <ElementNavClient icon={<Wine size={18} />} label="Cuisine & Bar" actif={isActif('/tableau-de-bord/cuisine')} onClick={() => navigate('/tableau-de-bord/cuisine')} />
          <ElementNavClient icon={<Users size={18} />} label="Employés & RH" actif={isActif('/tableau-de-bord/rh')} onClick={() => navigate('/tableau-de-bord/rh')} />
          <ElementNavClient icon={<Settings size={18} />} label="Taxes & Admin" actif={isActif('/tableau-de-bord/admin')} onClick={() => navigate('/tableau-de-bord/admin')} />
          <ElementNavClient icon={<CreditCard size={18} />} label="Abonnement" onClick={() => navigate('/abonnement')} />
        </nav>
        
        <button 
          onClick={gererDeconnexion}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors px-4 py-3 rounded-xl hover:bg-red-500/10 mt-auto"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>

      {/* Zone de contenu dynamique */}
      <main className="flex-1 ml-[19rem] p-8 pt-10">
        <Routes>
          <Route path="/" element={<DashboardAccueil profil={profil} navigate={navigate} />} />
          <Route path="/caisse" element={<PointDeVente />} />
          <Route path="/stocks" element={<GestionStocks />} />
          <Route path="/cuisine" element={<CuisineBar />} />
          <Route path="/rh" element={<RessourcesHumaines />} />
          <Route path="/admin" element={<AdministratifTaxes />} />
        </Routes>
      </main>
    </div>
  );
};

// Composant Accueil du Dashboard (ex-contenu principal)
const DashboardAccueil = ({ profil, navigate }: any) => (
  <>
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold">Bonjour, {profil?.prenom || 'Propriétaire'} 👋</h1>
            <p className="text-slate-400 mt-1">Voici l'état de votre établissement aujourd'hui.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="glass-card px-4 py-2 flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>Essai Gratuit : 12 jours restants</span>
             </div>
             <button 
               onClick={() => navigate('/abonnement')}
               className="btn-primary py-2 text-sm"
             >
               Renouveler l'accès
             </button>
          </div>
        </header>

        {/* Widgets statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <WidgetTableau 
            icone={<TrendingUp className="text-primary" />} 
            label="Recettes du jour" 
            valeur="84 500 F" 
            tendance="+12%" 
          />
          <WidgetTableau 
            icone={<ShoppingCart className="text-accent" />} 
            label="Commandes" 
            valeur="42" 
            tendance="+5%" 
          />
          <WidgetTableau 
            icone={<Users className="text-primary" />} 
            label="Clients servis" 
            valeur="128" 
          />
          <WidgetTableau 
            icone={<AlertTriangle className="text-yellow-500" />} 
            label="Alertes stock" 
            valeur="3 articles" 
            urgent 
          />
        </div>

        {/* Grille principale Bento */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ventes récentes */}
          <div className="lg:col-span-2 bento-item overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Ventes récentes</h3>
              <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                Voir tout <ChevronRight size={14} />
              </button>
            </div>
            <div className="p-6">
               <div className="space-y-4">
                  {ventesRecentes.map((vente, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                          {vente.emoji}
                        </div>
                        <div>
                          <p className="font-medium">{vente.nom}</p>
                          <p className="text-xs text-slate-500">Il y a {vente.minutes} min</p>
                        </div>
                      </div>
                      <span className="font-bold text-accent">{vente.prix}</span>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>

          {/* Colonne droite : Alertes */}
          <div className="space-y-6">
            <div className="bento-item p-6 border-l-4 border-l-indigo-500">
               <h4 className="font-bold mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} className="text-primary" />
                 Alerte de caisse
               </h4>
               <p className="text-sm text-slate-400 mb-4">
                 Votre caisse n'a pas été clôturée hier soir. Veuillez régulariser pour accéder aux rapports complets.
               </p>
               <button className="btn-primary w-full text-sm py-2">Clôturer la caisse</button>
            </div>
            
            <div className="bento-item p-6">
              <h4 className="font-bold mb-4">Stock en alerte 🔴</h4>
              <div className="space-y-3">
                <LigneStock label="Bière Blonde 33cl" quantite={12} />
                <LigneStock label="Coca Cola 1.5L" quantite={5} />
                <LigneStock label="Whisky Label 5" quantite={2} />
              </div>
            </div>
          </div>
        </div>
  </>
);

// -- Données de démonstration --
const ventesRecentes = [
  { emoji: '🍺', nom: 'Bière Primus x3', minutes: 5, prix: '4 500 F' },
  { emoji: '🍷', nom: 'Vin Rouge (bouteille)', minutes: 12, prix: '8 000 F' },
  { emoji: '🥃', nom: 'Whisky Black Label', minutes: 18, prix: '15 000 F' },
  { emoji: '🍺', nom: 'Bière Ngok x6', minutes: 25, prix: '6 000 F' },
];

// -- Composants utilitaires --

const ElementNavClient = ({ icon, label, actif = false, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      actif ? 'bg-primary/20 text-primary border border-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const WidgetTableau = ({ icone, label, valeur, tendance, urgent = false }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bento-item p-6 flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-lg bg-white/5">{icone}</div>
      {tendance && (
        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">{tendance}</span>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <h4 className={`text-2xl font-bold ${urgent ? 'text-yellow-500' : 'text-white'}`}>{valeur}</h4>
    </div>
  </motion.div>
);

const LigneStock = ({ label, quantite }: { label: string, quantite: number }) => {
  const couleur = quantite <= 5 ? 'red' : quantite <= 15 ? 'yellow' : 'green';
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold px-2 py-0.5 rounded text-xs bg-${couleur}-500/10 text-${couleur}-500`}>
        {quantite} restants
      </span>
    </div>
  );
};

export default TableauClient;
