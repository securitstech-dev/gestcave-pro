import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wine, ShoppingCart, TrendingUp, AlertTriangle, Users, 
  Settings, LogOut, ChevronRight, Package, CreditCard, Layout, LayoutDashboard
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// Les composants ERP legacy ont été remplacés par les nouvelles interfaces spécialisées
import InterfaceCaissier from './roles/InterfaceCaissier';
import InterfaceCuisine from './roles/InterfaceCuisine';
import GestionEmployes from './modules/GestionEmployes';
import GestionStocks from './modules/GestionStocks';
import GestionTables from './modules/GestionTables';
import PlanDeSalles from './modules/PlanDeSalles';
import GestionFinance from './modules/GestionFinance';
import GestionAchats from './modules/GestionAchats';
import { usePOSStore } from '../store/posStore';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

const TableauClient = () => {
  const { profil, deconnexion } = useAuthStore();
  const { initialiserTempsReel, arreterTempsReel } = usePOSStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (profil?.etablissement_id) {
      initialiserTempsReel(profil.etablissement_id);
    }
    return () => arreterTempsReel();
  }, [profil?.etablissement_id, initialiserTempsReel, arreterTempsReel]);

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
        
        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <ElementNavClient icon={<LayoutDashboard size={18} />} label="Accueil" actif={isActif('/tableau-de-bord')} onClick={() => navigate('/tableau-de-bord')} />
          <ElementNavClient icon={<Layout size={18} />} label="Plan des Salles" actif={isActif('/tableau-de-bord/plan-salles')} onClick={() => navigate('/tableau-de-bord/plan-salles')} />
          <ElementNavClient icon={<ShoppingCart size={18} />} label="Caisse & POS" actif={isActif('/tableau-de-bord/caisse')} onClick={() => navigate('/tableau-de-bord/caisse')} />
          <ElementNavClient icon={<Package size={18} />} label="Achats & Appro" actif={isActif('/tableau-de-bord/achats')} onClick={() => navigate('/tableau-de-bord/achats')} />
          <ElementNavClient icon={<Package size={18} />} label="Stock & Inventaire" actif={isActif('/tableau-de-bord/stocks')} onClick={() => navigate('/tableau-de-bord/stocks')} />
          <ElementNavClient icon={<Users size={18} />} label="Employés & RH" actif={isActif('/tableau-de-bord/rh')} onClick={() => navigate('/tableau-de-bord/rh')} />
          <ElementNavClient icon={<Settings size={18} />} label="Config. Tables" actif={isActif('/tableau-de-bord/tables')} onClick={() => navigate('/tableau-de-bord/tables')} />
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
      <main className="flex-1 ml-[19rem] p-8 pt-10 h-screen overflow-y-auto">
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
    </div>
  );
};

// Composant Accueil du Dashboard (ex-contenu principal)
const DashboardAccueil = ({ profil, navigate }: any) => {
  const { commandes, produits } = usePOSStore();
  const [lienCopie, setLienCopie] = React.useState(false);

  const copierLienPoste = () => {
    if (!profil?.etablissement_id) return;
    const lien = `${window.location.origin}/poste/${profil.etablissement_id}`;
    navigator.clipboard.writeText(lien);
    setLienCopie(true);
    toast.success('Lien copié ! Partagez-le avec votre personnel.', { icon: '🔗', duration: 4000 });
    setTimeout(() => setLienCopie(false), 3000);
  };

  return (
  <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold">Bonjour, {profil?.prenom || 'Propriétaire'} 👋</h1>
            <p className="text-slate-400 mt-1">Voici l'état de votre établissement aujourd'hui.</p>
          </div>
          
          <div className="flex gap-3 items-center">
             {/* Bouton Lien de Poste */}
             <button
               onClick={copierLienPoste}
               title="Générer le lien d'accès pour les tablettes du personnel"
               className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                 lienCopie 
                   ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                   : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
               }`}
             >
               {lienCopie ? '✓ Lien copié !' : '🔗 Lien Personnel'}
             </button>
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
            valeur={`${commandes.filter(c => c.statut === 'payee').reduce((acc, c) => acc + c.total, 0).toLocaleString()} F`} 
            tendance="+12%" 
          />
          <WidgetTableau 
            icone={<ShoppingCart className="text-accent" />} 
            label="Commandes actives" 
            valeur={commandes.length.toString()} 
          />
          <WidgetTableau 
            icone={<Users className="text-primary" />} 
            label="Couverts en cours" 
            valeur={commandes.reduce((acc, c) => acc + c.nombreCouverts, 0).toString()} 
          />
          <WidgetTableau 
            icone={<AlertTriangle className={produits.filter(p => p.stockTotal <= p.stockAlerte).length > 0 ? "text-red-500" : "text-emerald-500"} />} 
            label="Articles en alerte" 
            valeur={`${produits.filter(p => p.stockTotal <= p.stockAlerte).length} en rupture`} 
            urgent={produits.filter(p => p.stockTotal <= p.stockAlerte).length > 0} 
          />
        </div>

        {/* Grille principale Bento */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ventes récentes */}
          <div className="lg:col-span-2 bento-item overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Commandes Actives</h3>
              <button onClick={() => navigate('/tableau-de-bord/caisse')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                Accéder à la caisse <ChevronRight size={14} />
              </button>
            </div>
            <div className="p-6">
               <div className="space-y-4">
                  {commandes.length === 0 && (
                    <div className="text-center py-10 text-slate-500 italic">Aucune commande en cours</div>
                  )}
                  {commandes.slice(0, 5).map((commande, i) => (
                    <motion.div 
                      key={commande.id || i} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white border border-white/5 shadow-inner">
                          {commande.tableNom || 'A Emp.'}
                        </div>
                        <div>
                          <p className="font-bold flex items-center gap-2">
                             Commande #{commande.id.slice(-4).toUpperCase()}
                             <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">
                               {commande.statut}
                             </span>
                          </p>
                          <p className="text-xs text-slate-400">
                             Servi par <span className="text-white">{commande.serveurNom}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-xl text-emerald-400">{commande.total.toLocaleString()} F</span>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>

          {/* Colonne droite : Alertes */}
          <div className="space-y-6">
            <div className="bento-item p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                 Stock en alerte <AlertTriangle size={18} className="text-red-500" />
              </h4>
              <div className="space-y-3">
                {produits.filter(p => p.stockTotal <= p.stockAlerte).length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Tous les stocks sont normaux.</p>
                ) : (
                  produits.filter(p => p.stockTotal <= p.stockAlerte).slice(0, 5).map(p => (
                    <LigneStock key={p.id} label={p.nom} quantite={p.stockTotal} />
                  ))
                )}
              </div>
              <button onClick={() => navigate('/tableau-de-bord/achats')} className="mt-6 w-full btn-secondary text-sm py-2">Faire un approvisionnement</button>
            </div>
          </div>
        </div>
  </motion.div>
);
};

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
