import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, LogOut, 
  Search, Building2, CreditCard, TrendingUp, Shield,
  ArrowUpRight, AlertTriangle, Loader2, ExternalLink, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';

type Onglet = 'demandes' | 'paiements' | 'etablissements' | 'comptabilite';

const TableauSuperAdmin = () => {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('demandes');
  const [recherche, setRecherche] = useState('');
  const navigate = useNavigate();
  const { deconnexion } = useAuthStore();

  // Modals
  const [modalRefus, setModalRefus] = useState<{ id: string; nom: string } | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [modalPaiement, setModalPaiement] = useState<any | null>(null);

  // ✅ FIX 1 : onSnapshot — temps réel sur toutes les collections
  useEffect(() => {
    setChargement(true);

    const unsubDemandes = onSnapshot(
      query(collection(db, 'demandes_acces'), orderBy('date_demande', 'desc')),
      (snap) => {
        setDemandes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setChargement(false);
      },
      (err) => { console.error('demandes_acces error:', err); setChargement(false); }
    );

    const unsubEtabs = onSnapshot(
      collection(db, 'etablissements'),
      (snap) => setEtablissements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubPaiements = onSnapshot(
      query(collection(db, 'paiements'), orderBy('date', 'desc')),
      (snap) => setPaiements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubDemandes(); unsubEtabs(); unsubPaiements(); };
  }, []);

  // ✅ FIX 2 : MRR réel depuis les paiements validés ce mois
  const maintenant = new Date();
  const mrrReel = paiements
    .filter(p => {
      if (p.statut !== 'valide') return false;
      const d = new Date(p.date_validation || p.date || '');
      return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear();
    })
    .reduce((acc, p) => acc + (p.montant || 0), 0);

  // ✅ FIX 3 : Noms d'établissements dans la vue Paiements (lookup)
  const nomEtab = (etabId: string) => {
    const etab = etablissements.find(e => e.id === etabId);
    return etab?.nom || etab?.contact_principal || `...${etabId?.slice(-6)}`;
  };

  // Approuver une demande
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
      toast.success(`✅ Essai activé pour ${demande.nom_etablissement} !`);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${err.message}`);
    }
  };

  // ✅ FIX 4 : Refus fonctionnel avec motif
  const refuserDemande = async () => {
    if (!modalRefus) return;
    const toastId = toast.loading('Refus en cours...');
    try {
      await updateDoc(doc(db, 'demandes_acces', modalRefus.id), {
        statut: 'refuse',
        motif_refus: motifRefus || 'Demande non éligible.',
        date_refus: new Date().toISOString(),
      });
      toast.dismiss(toastId);
      toast.success(`Demande de ${modalRefus.nom} refusée.`);
      setModalRefus(null);
      setMotifRefus('');
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${err.message}`);
    }
  };

  // Valider un paiement
  const validerPaiement = async (paiementId: string, etabId: string, montant: number) => {
    const toastId = toast.loading('Validation du paiement...');
    try {
      await updateDoc(doc(db, 'paiements', paiementId), {
        statut: 'valide',
        date_validation: new Date().toISOString(),
      });
      const jours = montant >= 150000 ? 365 : montant >= 40000 ? 90 : 30;
      await updateDoc(doc(db, 'etablissements', etabId), {
        subscription_status: 'actif',
        subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.dismiss(toastId);
      toast.success('💳 Abonnement activé avec succès !');
      setModalPaiement(null);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${err.message}`);
    }
  };

  // ✅ FIX 5 : Rejeter un paiement
  const rejeterPaiement = async (paiementId: string) => {
    const toastId = toast.loading('Rejet du paiement...');
    try {
      await updateDoc(doc(db, 'paiements', paiementId), {
        statut: 'rejete',
        date_rejet: new Date().toISOString(),
      });
      toast.dismiss(toastId);
      toast.success('Paiement rejeté. Le client devra renvoyer sa preuve.');
      setModalPaiement(null);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const gererDeconnexion = () => { deconnexion(); navigate('/connexion'); };

  const demandesFiltrees = demandes.filter(d =>
    d.nom_etablissement?.toLowerCase().includes(recherche.toLowerCase()) ||
    d.nom_contact?.toLowerCase().includes(recherche.toLowerCase())
  );

  const etabsFiltres = etablissements.filter(e =>
    e.nom?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
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
      <main className="flex-1 ml-[21rem] p-8 pt-10 overflow-auto h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {onglet === 'demandes' && "Demandes d'accès"}
              {onglet === 'paiements' && 'Validation des Paiements'}
              {onglet === 'comptabilite' && 'Gestion Comptable'}
              {onglet === 'etablissements' && 'Portefeuille Clients'}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Synchronisation en temps réel
            </p>
          </div>
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
        </header>

        {/* Cartes de stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <CarteStats
            label="En attente"
            valeur={demandes.filter(r => r.statut === 'en_attente').length}
            icone={<Users className="text-yellow-500" size={20} />}
            couleur="yellow"
          />
          <CarteStats
            label="Établissements"
            valeur={etablissements.length}
            icone={<Building2 className="text-indigo-400" size={20} />}
            couleur="indigo"
          />
          <CarteStats
            label="Abonnés actifs"
            valeur={etablissements.filter(e => e.subscription_status === 'actif').length}
            icone={<CheckCircle className="text-emerald-400" size={20} />}
            couleur="emerald"
          />
          {/* ✅ FIX 2 : MRR réel */}
          <CarteStats
            label="MRR réel (ce mois)"
            valeur={`${mrrReel.toLocaleString()} F`}
            icone={<TrendingUp className="text-purple-400" size={20} />}
            couleur="purple"
          />
        </div>

        {/* Vues */}
        <AnimatePresence mode="wait">

          {/* ── DEMANDES ── */}
          {onglet === 'demandes' && (
            <motion.div key="demandes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bento-item overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold">Demandes en attente</h3>
                <span className="text-xs text-slate-500">{demandesFiltrees.filter(d => d.statut === 'en_attente').length} en attente · {demandesFiltrees.filter(d => d.statut === 'essai_actif').length} approuvées · {demandesFiltrees.filter(d => d.statut === 'refuse').length} refusées</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Établissement</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Téléphone</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {chargement ? (
                      <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-500" /></td></tr>
                    ) : demandesFiltrees.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Aucune demande.</td></tr>
                    ) : demandesFiltrees.map((dem) => (
                      <tr key={dem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{dem.nom_etablissement}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[180px]">{dem.adresse_etablissement}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">{dem.nom_contact}</div>
                          <div className="text-xs text-slate-500 italic">{dem.email_contact}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-indigo-400 font-bold">{dem.telephone_contact}</td>
                        <td className="px-6 py-4">
                          <BadgeStatut statut={dem.statut} />
                          {dem.motif_refus && <div className="text-[10px] text-red-400/70 mt-1 italic max-w-[150px]">{dem.motif_refus}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {dem.statut === 'en_attente' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => approuverDemande(dem.id, dem)}
                                className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all"
                                title="Approuver l'essai"
                              >
                                <CheckCircle size={18} />
                              </button>
                              {/* ✅ FIX 4 : Refus fonctionnel */}
                              <button
                                onClick={() => setModalRefus({ id: dem.id, nom: dem.nom_etablissement })}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all"
                                title="Refuser la demande"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                          {dem.statut !== 'en_attente' && <span className="text-slate-600 text-xs italic">Traité</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── PAIEMENTS ── */}
          {onglet === 'paiements' && (
            <motion.div key="paiements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bento-item overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold">Paiements à vérifier</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      {/* ✅ FIX 3 : Nom de l'établissement */}
                      <th className="px-6 py-4">Établissement</th>
                      <th className="px-6 py-4">Montant</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paiements.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Aucun paiement.</td></tr>
                    )}
                    {paiements.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(p.date).toLocaleDateString('fr-FR')}<br />
                          <span className="text-slate-600">{new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        {/* ✅ Nom de l'établissement lisible */}
                        <td className="px-6 py-4 font-bold text-white">{nomEtab(p.etablissement_id)}</td>
                        <td className="px-6 py-4 font-black text-emerald-400 text-lg">{(p.montant || 0).toLocaleString()} F</td>
                        <td className="px-6 py-4">
                          <BadgeStatut statut={p.statut} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.statut === 'en_attente' && (
                            <button
                              onClick={() => setModalPaiement(p)}
                              className="flex items-center gap-2 ml-auto bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-3 py-2 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all"
                            >
                              Examiner <ArrowUpRight size={14} />
                            </button>
                          )}
                          {p.preuve_url && p.statut !== 'en_attente' && (
                            <a href={p.preuve_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 text-xs underline flex items-center justify-end gap-1">
                              Voir preuve <ExternalLink size={11} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── ÉTABLISSEMENTS ── */}
          {onglet === 'etablissements' && (
            <motion.div key="etabs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bento-item overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold">Parc Clients GESTCAVE PRO</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Structure</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Expiration</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {etabsFiltres.map((etab) => {
                      const expiration = new Date(etab.subscription_end_date);
                      const joursRestants = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const expirationImminente = joursRestants <= 7 && joursRestants > 0;
                      const expire = joursRestants <= 0;
                      return (
                        <tr key={etab.id} className="hover:bg-white/5 transition-colors text-sm">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white uppercase tracking-tighter">{etab.nom}</div>
                            <div className="text-[10px] text-slate-500">{etab.adresse}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-300">{etab.contact_principal}</div>
                            <div className="text-[10px] text-slate-500">{etab.email_contact}</div>
                          </td>
                          <td className="px-6 py-4">
                            <BadgeStatut statut={etab.subscription_status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-mono text-sm ${expire ? 'text-red-500' : expirationImminente ? 'text-yellow-500' : 'text-slate-400'}`}>
                              {expiration.toLocaleDateString('fr-FR')}
                            </div>
                            {expirationImminente && <div className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertTriangle size={10} /> {joursRestants}j restants</div>}
                            {expire && <div className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> Expiré</div>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={`/poste/${etab.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Voir le lien de poste"
                              className="p-1.5 inline-flex hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── COMPTABILITÉ ── */}
          {onglet === 'comptabilite' && (
            <motion.div key="compta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-item p-8 bg-gradient-to-br from-indigo-600/10 to-transparent">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-6 tracking-widest">Récapitulatif de Facturation</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-slate-400">Abonnements actifs</span>
                      <span className="text-white font-bold">{etablissements.filter(e => e.subscription_status === 'actif').length}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-slate-400">Essais gratuits</span>
                      <span className="text-white font-bold">{etablissements.filter(e => e.subscription_status === 'essai').length}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-slate-400">Total paiements validés</span>
                      <span className="text-white font-bold">{paiements.filter(p => p.statut === 'valide').length}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-slate-400">MRR réel (ce mois)</span>
                      <span className="text-emerald-400 font-black text-xl">{mrrReel.toLocaleString()} F CFA</span>
                    </div>
                  </div>
                </div>

                <div className="bento-item p-8">
                  <h3 className="text-sm font-bold text-white uppercase mb-6 tracking-widest">Derniers paiements validés</h3>
                  <div className="space-y-3">
                    {paiements.filter(p => p.statut === 'valide').slice(0, 5).length === 0 && (
                      <p className="text-slate-500 italic text-sm">Aucun paiement validé pour l'instant.</p>
                    )}
                    {paiements.filter(p => p.statut === 'valide').slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5">
                        <div>
                          <div className="text-white text-sm font-medium">{nomEtab(p.etablissement_id)}</div>
                          <div className="text-xs text-slate-500">{new Date(p.date_validation || p.date).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <span className="text-emerald-400 font-bold">{(p.montant || 0).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── MODAL REFUS DEMANDE ── */}
      <AnimatePresence>
        {modalRefus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md glass-panel p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Refuser la demande</h3>
                  <p className="text-slate-400 text-sm mt-1">{modalRefus.nom}</p>
                </div>
                <button onClick={() => setModalRefus(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Motif du refus (optionnel)</label>
                <textarea
                  value={motifRefus}
                  onChange={e => setMotifRefus(e.target.value)}
                  rows={3}
                  placeholder="Ex: Informations incomplètes, zone non couverte..."
                  className="glass-input w-full resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setModalRefus(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-medium transition-all">Annuler</button>
                <button onClick={refuserDemande} className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl font-bold border border-red-500/30 transition-all">Confirmer le refus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL EXAMEN PAIEMENT ── */}
      <AnimatePresence>
        {modalPaiement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg glass-panel p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Examen du paiement</h3>
                  <p className="text-slate-400 text-sm">{nomEtab(modalPaiement.etablissement_id)}</p>
                </div>
                <button onClick={() => setModalPaiement(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
              </div>

              <div className="mb-6 p-4 bg-white/5 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Montant</span><span className="text-emerald-400 font-black text-lg">{(modalPaiement.montant || 0).toLocaleString()} F CFA</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-white">{new Date(modalPaiement.date).toLocaleString('fr-FR')}</span></div>
              </div>

              {/* Aperçu de la preuve */}
              {modalPaiement.preuve_url && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-400 mb-2">Capture d'écran de paiement :</p>
                  <a href={modalPaiement.preuve_url} target="_blank" rel="noreferrer">
                    <img
                      src={modalPaiement.preuve_url}
                      alt="Preuve de paiement"
                      className="w-full rounded-xl border border-white/10 max-h-56 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  </a>
                  <a href={modalPaiement.preuve_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-2">
                    Ouvrir en plein écran <ExternalLink size={11} />
                  </a>
                </div>
              )}

              <div className="flex gap-4">
                {/* ✅ FIX 5 : Rejeter paiement */}
                <button
                  onClick={() => rejeterPaiement(modalPaiement.id)}
                  className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl font-bold border border-red-500/20 transition-all"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => validerPaiement(modalPaiement.id, modalPaiement.etablissement_id, modalPaiement.montant)}
                  className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl font-bold border border-emerald-500/30 transition-all"
                >
                  ✅ Valider & Activer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Composants utilitaires ──
const ElementNav = ({ icon, label, actif = false, badge, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      actif ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">{icon}<span className="font-medium text-sm">{label}</span></div>
    {badge > 0 && !actif && (
      <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{badge}</span>
    )}
  </button>
);

const CarteStats = ({ label, valeur, icone, couleur }: any) => {
  const colors: Record<string, string> = {
    yellow: 'from-yellow-500/5 to-transparent border-yellow-500/10',
    indigo: 'from-indigo-500/5 to-transparent border-indigo-500/10',
    emerald: 'from-emerald-500/5 to-transparent border-emerald-500/10',
    purple: 'from-purple-500/5 to-transparent border-purple-500/10',
  };
  return (
    <div className={`bento-item p-6 bg-gradient-to-br ${colors[couleur] || ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-white/5">{icone}</div>
      </div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-white">{valeur}</h4>
    </div>
  );
};

const BadgeStatut = ({ statut }: { statut: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    en_attente:  { cls: 'bg-yellow-500/20 text-yellow-400', label: 'En attente' },
    essai_actif: { cls: 'bg-blue-500/20 text-blue-400',   label: 'Essai actif' },
    essai:       { cls: 'bg-blue-500/20 text-blue-400',   label: 'Essai' },
    actif:       { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Actif' },
    refuse:      { cls: 'bg-red-500/20 text-red-400',     label: 'Refusé' },
    valide:      { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Validé' },
    rejete:      { cls: 'bg-red-500/20 text-red-400',     label: 'Rejeté' },
  };
  const s = map[statut] || { cls: 'bg-slate-500/20 text-slate-400', label: statut };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${s.cls}`}>{s.label}</span>;
};

export default TableauSuperAdmin;
