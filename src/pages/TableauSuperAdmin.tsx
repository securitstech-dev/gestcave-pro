import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, LayoutDashboard, LogOut, 
  Search, Building2, CreditCard, TrendingUp, Shield, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

type OngletActif = 'demandes' | 'paiements' | 'etablissements';

const TableauSuperAdmin = () => {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<'demandes' | 'paiements' | 'etablissements' | 'comptabilite'>('demandes');
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
      const demandesSnap = await getDocs(demandesRef);
      setDemandes(demandesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const etabsRef = collection(db, 'etablissements');
      const etabsSnap = await getDocs(etabsRef);
      setEtablissements(etabsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const paiementsRef = collection(db, 'paiements');
      const paiementsSnap = await getDocs(paiementsRef);
      setPaiements(paiementsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (erreur) {
      console.error('Erreur de chargement:', erreur);
    }
    setChargement(false);
  };

  const totalRevenus = etablissements.length * 25000; // CA potentiel

  const approuverDemande = async (demandeId: string, demande: any) => {
    const toastId = toast.loading('Approbation en cours...');
    try {
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: demande.nom_etablissement,
        adresse: demande.adresse_etablissement || 'N/A',
        telephone: demande.telephone_contact || 'N/A',
        contact_principal: demande.nom_contact,
        email_contact: demande.email_contact,
        subscription_plan: 'essai_gratuit',
        subscription_status: 'essai',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await updateDoc(doc(db, 'demandes_acces', demandeId), {
        statut: 'essai_actif',
        etablissement_id: etabRef.id,
      });

      toast.dismiss(toastId);
      toast.success(`Demande approuvée pour ${demande.nom_etablissement} !`);
      chargerDonnees();
    } catch (erreur: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${erreur.message}`);
    }
  };

  const validerPaiement = async (paiementId: string, etabId: string, montant: number) => {
    const toastId = toast.loading('Validation du paiement...');
    try {
      // 1. Marquer le paiement comme validé
      await updateDoc(doc(db, 'paiements', paiementId), {
        statut: 'valide',
        date_validation: new Date().toISOString()
      });

      // 2. Activer l'abonnement de l'établissement
      // On ajoute par exemple 30 jours (ou selon le montant)
      const jours = montant >= 150000 ? 365 : montant >= 40000 ? 90 : 30;
      await updateDoc(doc(db, 'etablissements', etabId), {
        subscription_status: 'actif',
        subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString()
      });

      toast.dismiss(toastId);
      toast.success('Abonnement activé avec succès !');
      chargerDonnees();
    } catch (erreur: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${erreur.message}`);
    }
  };


  const gererDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  const demandesFiltrees = demandes.filter(d => 
    d.nom_etablissement?.toLowerCase().includes(recherche.toLowerCase()) ||
    d.nom_contact?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      {/* Barre latérale - Floating Design */}
      <aside className="w-72 glass-panel m-6 rounded-[2rem] p-6 flex flex-col fixed h-[calc(100vh-3rem)] z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2.5 rounded-xl">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">SUPER ADMIN</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Securits Tech</p>
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
            icon={<Building2 size={18} />} 
            label="Établissements" 
            actif={onglet === 'etablissements'}
            badge={etablissements.length}
            onClick={() => setOnglet('etablissements')} 
          />
          <ElementNav 
            icon={<CreditCard size={18} />} 
            label="Paiements" 
            actif={onglet === 'paiements'} 
            badge={paiements.filter(p => p.statut === 'en_attente').length}
            onClick={() => setOnglet('paiements')} 
          />
          <ElementNav 
            icon={<TrendingUp size={18} />} 
            label="Comptabilité" 
            actif={onglet === 'comptabilite'}
            onClick={() => setOnglet('comptabilite')} 
          />
        </nav>

        
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
           <p className="text-[10px] text-slate-500 uppercase font-bold text-center mb-1">Support technique</p>
           <p className="text-white text-xs font-bold text-center italic">+242 05 302 8383</p>
        </div>

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
              {onglet === 'paiements' && 'Validation des Paiements'}
              {onglet === 'comptabilite' && 'Gestion Comptable'}
              {onglet === 'etablissements' && 'Portefeuille Clients'}
            </h1>
            <p className="text-slate-400 mt-1">
              {onglet === 'paiements' ? 'Vérifiez les captures d\'écran Mobile Money' :
               onglet === 'comptabilite' ? 'Suivi des revenus et abonnements validés' : 'Gérez les accès et les abonnements'}
            </p>

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
            label="Demandes" 
            valeur={demandes.filter(r => r.statut === 'en_attente').length} 
            icone={<Users className="text-yellow-500" size={20} />}
          />
          <CarteStats 
            label="Établissements" 
            valeur={etablissements.length} 
            icone={<Building2 className="text-indigo-400" size={20} />}
          />
          <CarteStats 
            label="Abonnés actifs" 
            valeur={etablissements.filter(e => e.subscription_status === 'actif').length} 
            icone={<CheckCircle className="text-emerald-400" size={20} />}
          />
          <CarteStats 
            label="CA Prévisionnel" 
            valeur={`${totalRevenus.toLocaleString()} F`}
            icone={<TrendingUp className="text-purple-400" size={20} />}
          />
        </div>

        {/* Vues détaillées */}
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
                <h3 className="text-xl font-bold text-white">Demandes en attente</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Établissement</th>
                      <th className="px-6 py-4 font-semibold">Contact</th>
                      <th className="px-6 py-4 font-semibold">Téléphone</th>
                      <th className="px-6 py-4 font-semibold">Plan</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {chargement ? (
                      <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-500">Chargement...</td></tr>
                    ) : demandesFiltrees.filter(d => d.statut === 'en_attente').length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic flex flex-col items-center gap-2">
                        <Users size={32} className="opacity-20" />
                        Aucune nouvelle demande
                      </td></tr>
                    ) : demandesFiltrees.filter(d => d.statut === 'en_attente').map((dem) => (
                      <tr key={dem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{dem.nom_etablissement}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{dem.adresse_etablissement}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">{dem.nom_contact}</div>
                          <div className="text-xs text-slate-500 italic">{dem.email_contact}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-indigo-400 font-bold">{dem.telephone_contact}</td>
                        <td className="px-6 py-4 text-xs font-bold text-emerald-400">ESSAI GRATUIT</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => approuverDemande(dem.id, dem)}
                              className="btn-primary accent p-2 rounded-lg"
                              title="Valider"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button className="p-2 hover:bg-white/10 text-slate-500 rounded-lg">
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {onglet === 'paiements' && (
            <motion.div
              key="paiements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bento-item overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white">Paiements à vérifier</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Structure ID</th>
                      <th className="px-6 py-4 font-semibold">Montant</th>
                      <th className="px-6 py-4 font-semibold">Preuve</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paiements.filter(p => p.statut === 'en_attente').map((paiement) => (
                      <tr key={paiement.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-slate-300 font-mono text-xs">{paiement.etablissement_id}</div>
                           <div className="text-[10px] text-slate-500">{new Date(paiement.date).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">{paiement.montant.toLocaleString()} F</td>
                        <td className="px-6 py-4">
                           <a href={paiement.preuve_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-xs flex items-center gap-1">
                             Voir capture <ArrowLeft className="rotate-180" size={12} />
                           </a>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => validerPaiement(paiement.id, paiement.etablissement_id, paiement.montant)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                          >
                            Valider & Activer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paiements.filter(p => p.statut === 'en_attente').length === 0 && (
                      <tr><td colSpan={4} className="p-10 text-center text-slate-500 italic">Aucun paiement en attente.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {onglet === 'etablissements' && (
            <motion.div
              key="etabs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bento-item overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white">Parc Clients GESTCAVE PRO</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Structure</th>
                      <th className="px-6 py-4 font-semibold">Propriétaire</th>
                      <th className="px-6 py-4 font-semibold">Statut</th>
                      <th className="px-6 py-4 font-semibold">Date d'Expiration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {etablissements.map((etab) => (
                      <tr key={etab.id} className="hover:bg-white/5 transition-colors text-sm">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white uppercase tracking-tighter">{etab.nom}</div>
                          <div className="text-[10px] text-slate-500">{etab.adresse}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-300">{etab.responsable}</div>
                          <div className="text-[10px] text-slate-500">{etab.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${etab.subscription_status === 'actif' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            {etab.subscription_status === 'essai' ? 'Essai Gratuit' : 'Abonnement Actif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {new Date(etab.subscription_end_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {onglet === 'comptabilite' && (
            <motion.div
              key="compta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-item p-8 bg-gradient-to-br from-indigo-600/10 to-transparent">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-6 tracking-widest">Récapitulatif de Facturation</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-slate-400">Total Abonnements Standards</span>
                      <span className="text-white font-bold">{etablissements.filter(e => e.subscription_status === 'actif').length}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-slate-400">Total Essais Gratuits</span>
                      <span className="text-white font-bold">{etablissements.filter(e => e.subscription_status === 'essai').length}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-slate-400">C.A Mensuel Potentiel</span>
                      <span className="text-emerald-400 font-black text-xl">{(etablissements.length * 25000).toLocaleString()} F CFA</span>
                    </div>
                  </div>
                </div>
                
                <div className="bento-item p-8 bg-white/5 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-600">
                      <TrendingUp size={32} />
                   </div>
                   <h3 className="text-white font-bold mb-2">Analyse de Performance</h3>
                   <p className="text-slate-500 text-sm max-w-xs">Le module de prédiction des revenus basé sur l'IA de Securits Tech sera disponible dans la prochaine version.</p>
                </div>
              </div>

              <div className="bento-item p-8">
                 <h3 className="text-white font-bold mb-6">Derniers Paiements Reçus</h3>
                 <div className="text-center py-10 opacity-30 italic text-slate-500">
                    En attente de nouvelles transactions...
                 </div>
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
      actif ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge > 0 && actif === false && (
      <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

const CarteStats = ({ label, valeur, icone }: any) => (
  <div className="bento-item p-6 bg-slate-900/40">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-white/5 shadow-inner">{icone}</div>
    </div>
    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{label}</p>
    <h4 className="text-2xl font-black text-white">{valeur}</h4>
  </div>
);

const BadgeStatut = ({ statut }: { statut: string }) => {
  const styles: Record<string, string> = {
    en_attente: 'bg-yellow-500/20 text-yellow-400',
    essai_actif: 'bg-green-500/20 text-green-400',
    actif: 'bg-green-500/20 text-green-400',
  };
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    essai_actif: 'Essai actif',
    actif: 'Actif',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${styles[statut] || 'bg-slate-500/20 text-slate-400'}`}>
      {labels[statut] || statut}
    </span>
  );
};

export default TableauSuperAdmin;
