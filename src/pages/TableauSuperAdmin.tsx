import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, LayoutDashboard, LogOut, 
  Search, Building2, CreditCard, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

type OngletActif = 'demandes' | 'paiements' | 'etablissements';

const TableauSuperAdmin = () => {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<OngletActif>('demandes');
  const [recherche, setRecherche] = useState('');
  const navigate = useNavigate();
  const { deconnexion } = useAuthStore();

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const demandesRef = collection(db, 'demandes_acces');
      // Pour utiliser orderBy il faut parfois créer un index Firebase, pour ne pas bloquer le client on s'en passe
      const demandesSnap = await getDocs(demandesRef);
      setDemandes(demandesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const paiementsRef = collection(db, 'paiements');
      const paiementsSnap = await getDocs(paiementsRef);
      setPaiements(paiementsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (erreur) {
      console.error('Erreur de chargement:', erreur);
    }
    setChargement(false);
  };

  const approuverDemande = async (demandeId: string, demande: any) => {
    const toastId = toast.loading('Approbation en cours...');
    try {
      // 1. Créer l'établissement
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: demande.nom_etablissement,
        subscription_plan: 'essai_gratuit',
        subscription_status: 'actif',
        subscription_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 2. Noter la demande comme approuvée
      await updateDoc(doc(db, 'demandes_acces', demandeId), {
        statut: 'essai_actif',
        etablissement_id: etabRef.id,
      });

      toast.dismiss(toastId);
      toast.success(`Demande approuvée pour ${demande.nom_etablissement} ! (Configurez leur compte dans Auth Firebase manuellement pour le moment)`, { duration: 6000 });
      chargerDonnees();
    } catch (erreur: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${erreur.message}`);
    }
  };

  const refuserDemande = async (demandeId: string) => {
    try {
      await updateDoc(doc(db, 'demandes_acces', demandeId), { statut: 'refuse' });
      toast.success('Demande refusée');
      chargerDonnees();
    } catch {
      toast.error('Erreur lors du refus');
    }
  };

  const validerPaiement = async (paiementId: string, etablissementId: string) => {
    const toastId = toast.loading('Validation du paiement...');
    try {
      await updateDoc(doc(db, 'paiements', paiementId), { statut: 'valide' });
      
      if (etablissementId) {
        await updateDoc(doc(db, 'etablissements', etablissementId), {
          subscription_status: 'actif',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      toast.dismiss(toastId);
      toast.success('Paiement validé et abonnement prolongé !');
      chargerDonnees();
    } catch {
      toast.dismiss(toastId);
      toast.error('Erreur lors de la validation');
    }
  };

  const gererDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  // Filtrage par recherche
  const demandesFiltrees = demandes.filter(d => 
    d.nom_etablissement?.toLowerCase().includes(recherche.toLowerCase()) ||
    d.nom_contact?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      {/* Barre latérale - Floating Design */}
      <aside className="w-72 glass-panel m-6 rounded-[2rem] p-6 flex flex-col fixed h-[calc(100vh-3rem)] z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary p-2.5 rounded-xl">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Panneau Admin</h2>
            <p className="text-xs text-slate-500">Super Administrateur</p>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <ElementNav 
            icon={<Users size={18} />} 
            label="Demandes d'accès" 
            actif={onglet === 'demandes'} 
            badge={demandes.filter(d => d.statut === 'en_attente').length}
            onClick={() => setOnglet('demandes')} 
          />
          <ElementNav 
            icon={<CreditCard size={18} />} 
            label="Paiements" 
            actif={onglet === 'paiements'}
            badge={paiements.filter(p => p.statut === 'en_attente').length}
            onClick={() => setOnglet('paiements')} 
          />
          <ElementNav 
            icon={<Building2 size={18} />} 
            label="Établissements" 
            actif={onglet === 'etablissements'}
            onClick={() => setOnglet('etablissements')} 
          />
        </nav>
        
        <button 
          onClick={gererDeconnexion}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors px-4 py-3 rounded-xl hover:bg-red-500/10"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 ml-[21rem] p-8 pt-10 overflow-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {onglet === 'demandes' && 'Demandes d\'accès'}
              {onglet === 'paiements' && 'Validation des paiements'}
              {onglet === 'etablissements' && 'Établissements'}
            </h1>
            <p className="text-slate-400 mt-1">Gérez les accès et les abonnements de vos clients</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="glass-input pl-10 w-64 h-10" 
              />
            </div>
          </div>
        </header>

        {/* Grille de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <CarteStats 
            label="En attente" 
            valeur={demandes.filter(r => r.statut === 'en_attente').length} 
            icone={<Users className="text-yellow-500" size={20} />}
            couleur="yellow" 
          />
          <CarteStats 
            label="Essais actifs" 
            valeur={demandes.filter(r => r.statut === 'essai_actif').length} 
            icone={<CheckCircle className="text-accent" size={20} />}
            couleur="accent" 
          />
          <CarteStats 
            label="Paiements à vérifier" 
            valeur={paiements.filter(p => p.statut === 'en_attente').length} 
            icone={<CreditCard className="text-primary" size={20} />}
            couleur="primary" 
          />
          <CarteStats 
            label="Revenus validés" 
            valeur={`${paiements.filter(p => p.statut === 'valide').reduce((s: number, p: any) => s + (p.montant || 0), 0).toLocaleString()} F`}
            icone={<TrendingUp className="text-accent" size={20} />}
            couleur="accent" 
          />
        </div>

        {/* Onglet Demandes */}
        <AnimatePresence mode="wait">
          {onglet === 'demandes' && (
            <motion.div
              key="demandes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bento-item overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold">Demandes d'essai gratuit</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Établissement</th>
                      <th className="px-6 py-4 font-semibold">Contact</th>
                      <th className="px-6 py-4 font-semibold">Téléphone</th>
                      <th className="px-6 py-4 font-semibold">Statut</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {chargement ? (
                      <tr><td colSpan={6} className="p-10 text-center animate-pulse text-slate-500">Chargement des données...</td></tr>
                    ) : demandesFiltrees.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-slate-500">Aucune demande trouvée</td></tr>
                    ) : demandesFiltrees.map((dem) => (
                      <tr key={dem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium">{dem.nom_etablissement}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{dem.nom_contact}</div>
                          <div className="text-xs text-slate-500">{dem.email_contact}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{dem.telephone_contact || '—'}</td>
                        <td className="px-6 py-4">
                          <BadgeStatut statut={dem.statut} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {dem.statut === 'en_attente' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => approuverDemande(dem.id, dem)}
                                className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                                title="Approuver"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button 
                                onClick={() => refuserDemande(dem.id)}
                                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" 
                                title="Refuser"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// -- Composants utilitaires --
const ElementNav = ({ icon, label, actif = false, badge, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      actif ? 'bg-primary text-white shadow-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge > 0 && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
        actif ? 'bg-white/20' : 'bg-primary/20 text-primary'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

const CarteStats = ({ label, valeur, icone }: any) => (
  <div className="bento-item p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-white/5">{icone}</div>
    </div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <h4 className="text-2xl font-bold">{valeur}</h4>
  </div>
);

const BadgeStatut = ({ statut }: { statut: string }) => {
  const styles: Record<string, string> = {
    en_attente: 'bg-yellow-500/20 text-yellow-400',
    essai_actif: 'bg-green-500/20 text-green-400',
    actif: 'bg-green-500/20 text-green-400',
    refuse: 'bg-red-500/20 text-red-400',
    valide: 'bg-green-500/20 text-green-400',
    rejete: 'bg-red-500/20 text-red-400',
  };
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    essai_actif: 'Essai actif',
    actif: 'Actif',
    refuse: 'Refusé',
    valide: 'Validé',
    rejete: 'Rejeté',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${styles[statut] || 'bg-slate-500/20 text-slate-400'}`}>
      {labels[statut] || statut}
    </span>
  );
};

export default TableauSuperAdmin;
