import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, LogOut, 
  Search, Building2, CreditCard, TrendingUp, Shield,
  ArrowUpRight, AlertTriangle, Loader2, ExternalLink, X, Ban, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Database, AlertCircle, Info, Copy } from 'lucide-react';

type Onglet = 'demandes' | 'paiements' | 'etablissements' | 'comptabilite' | 'maintenance';

const TableauSuperAdmin = () => {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('demandes');
  const [recherche, setRecherche] = useState('');
  const navigate = useNavigate();
  const { deconnexion } = useAuthStore();

  const [modalRefus, setModalRefus] = useState<{ id: string; nom: string } | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  
  const [modalApprobation, setModalApprobation] = useState<{ demandeId: string; demande: any } | null>(null);
  const [planApprobation, setPlanApprobation] = useState<string>('demo');

  const [modalEtabDetails, setModalEtabDetails] = useState<any | null>(null);

  const [modalPaiement, setModalPaiement] = useState<any | null>(null);
  const [planPaiement, setPlanPaiement] = useState<'mensuel' | 'premium' | 'business'>('mensuel');
  
  const [lienActivation, setLienActivation] = useState<{ url: string; nom: string } | null>(null);

  const [prolongationMode, setProlongationMode] = useState(false);
  const [prolongationPlan, setProlongationPlan] = useState<'starter' | 'premium' | 'business'>('starter');
  const [prolongationDuree, setProlongationDuree] = useState<number>(30); // Jours




  useEffect(() => {
    setChargement(true);
    const unsubDemandes = onSnapshot(
      query(collection(db, 'demandes_acces'), orderBy('date_demande', 'desc')),
      (snap) => { setDemandes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setChargement(false); },
      (err) => { console.error(err); setChargement(false); }
    );
    const unsubEtabs = onSnapshot(collection(db, 'etablissements'), (snap) => setEtablissements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPaiements = onSnapshot(query(collection(db, 'paiements'), orderBy('date', 'desc')), (snap) => setPaiements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubDemandes(); unsubEtabs(); unsubPaiements(); };
  }, []);

  const maintenant = new Date();
  const mrrReel = paiements
    .filter(p => { if (p.statut !== 'valide') return false; const d = new Date(p.date_validation || p.date || ''); return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear(); })
    .reduce((acc, p) => acc + (p.montant || 0), 0);

  const nomEtab = (etabId: string) => { const etab = etablissements.find(e => e.id === etabId); return etab?.nom || etab?.contact_principal || `...${etabId?.slice(-6)}`; };

  const validerApprobation = async () => {
    if (!modalApprobation) return;
    const { demandeId, demande } = modalApprobation;
    const toastId = toast.loading('Approbation en cours...');
    
    let jours = 14;
    let typePlan = 'essai_gratuit';
    let statut = 'essai';
    
    if (planApprobation === 'demo') { jours = 14; typePlan = 'essai_gratuit'; statut = 'essai'; }
    if (planApprobation === 'mensuel') { jours = 30; typePlan = 'starter'; statut = 'actif'; }
    if (planApprobation === 'starter_annuel') { jours = 365; typePlan = 'starter'; statut = 'actif'; }
    if (planApprobation === 'premium') { jours = 30; typePlan = 'premium'; statut = 'actif'; }
    if (planApprobation === 'premium_annuel') { jours = 365; typePlan = 'premium'; statut = 'actif'; }
    if (planApprobation === 'business') { jours = 30; typePlan = 'business'; statut = 'actif'; }
    if (planApprobation === 'business_annuel') { jours = 365; typePlan = 'business'; statut = 'actif'; }

    try {
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: demande.nom_etablissement, adresse: demande.adresse_etablissement || 'N/A',
        telephone: demande.telephone_contact || 'N/A', contact_principal: demande.nom_contact,
        email_contact: demande.email_contact, subscription_plan: typePlan,
        subscription_status: statut, subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString(),
      });
      await updateDoc(doc(db, 'demandes_acces', demandeId), { statut: 'valide', etablissement_id: etabRef.id });
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'invitations'), { token: invitationToken, email: demande.email_contact, nom: demande.nom_contact, etablissement_id: etabRef.id, role: 'client_admin', date_creation: new Date().toISOString(), expire: Date.now() + (72 * 60 * 60 * 1000) });
      const urlComplete = `${window.location.origin}/activation?token=${invitationToken}`;
      setLienActivation({ url: urlComplete, nom: demande.nom_etablissement });
      setModalApprobation(null);
      toast.dismiss(toastId); toast.success(`Accès activé pour ${demande.nom_etablissement} !`);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur : ${err.message}`); }
  };

  const refuserDemande = async () => {
    if (!modalRefus) return;
    const toastId = toast.loading('Refus en cours...');
    try {
      await updateDoc(doc(db, 'demandes_acces', modalRefus.id), { statut: 'refuse', motif_refus: motifRefus || 'Non éligible.', date_refus: new Date().toISOString() });
      toast.dismiss(toastId); toast.success(`Demande de ${modalRefus.nom} refusée.`);
      setModalRefus(null); setMotifRefus('');
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur : ${err.message}`); }
  };

  const validerPaiementAction = async () => {
    if (!modalPaiement) return;
    const toastId = toast.loading('Validation...');
    
    // On récupère la période enregistrée dans le paiement (mensuel ou annuel)
    const estAnnuel = modalPaiement.periode === 'annuel';
    const jours = estAnnuel ? 365 : 30;
    
    try {
      await updateDoc(doc(db, 'paiements', modalPaiement.id), { 
        statut: 'valide', 
        date_validation: new Date().toISOString() 
      });
      
      await updateDoc(doc(db, 'etablissements', modalPaiement.etablissement_id), { 
          subscription_status: 'actif', 
          subscription_plan: planPaiement,
          subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString() 
      });
      
      toast.dismiss(toastId); 
      toast.success(`Abonnement ${estAnnuel ? 'ANNUEL' : 'MENSUEL'} activé avec succès !`); 
      setModalPaiement(null);
    } catch (err: any) { 
      toast.dismiss(toastId); 
      toast.error(`Erreur : ${err.message}`); 
    }
  };

  const rejeterPaiement = async (paiementId: string) => {
    const toastId = toast.loading('Rejet...');
    try {
      await updateDoc(doc(db, 'paiements', paiementId), { statut: 'rejete', date_rejet: new Date().toISOString() });
      toast.dismiss(toastId); toast.success('Paiement rejeté.'); setModalPaiement(null);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur : ${err.message}`); }
  };

  const suspendreEtablissement = async (etab: any) => {
    if (!window.confirm(`Suspendre ${etab.nom} ?`)) return;
    const toastId = toast.loading('Suspension...');
    try {
      await updateDoc(doc(db, 'etablissements', etab.id), { subscription_status: 'suspendu', subscription_end_date: new Date().toISOString() });
      toast.dismiss(toastId); toast.success(`${etab.nom} suspendu.`);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur : ${err.message}`); }
  };
  const prolongerEtablissement = async () => {
    if (!modalEtabDetails) return;
    const toastId = toast.loading('Calcul de la prolongation...');
    try {
      const etab = modalEtabDetails;
      const currentEndDate = new Date(etab.subscription_end_date || Date.now());
      // On s'assure qu'on part de la date actuelle si l'abonnement est déjà expiré
      const baseDate = currentEndDate.getTime() > Date.now() ? currentEndDate.getTime() : Date.now();
      const newEndDate = new Date(baseDate + prolongationDuree * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db, 'etablissements', etab.id), {
        subscription_status: 'actif',
        subscription_plan: prolongationPlan,
        subscription_end_date: newEndDate.toISOString()
      });
      
      toast.dismiss(toastId);
      const labelDuree = prolongationDuree === 365 ? '1 AN' : `${prolongationDuree / 30} MOIS`;
      toast.success(`Abonnement ${prolongationPlan.toUpperCase()} prolongé (${labelDuree}) pour ${etab.nom} !`);

      setModalEtabDetails(null);
      setProlongationMode(false);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const viderBase = async () => {
    if (!window.confirm("ATTENTION : Supprimer TOUTES LES DONNÉES ? Seul le Super Admin sera conservé.")) return;
    const collectionsAVider = ['demandes_acces', 'etablissements', 'invitations', 'tables', 'produits', 'commandes', 'transactions_pos', 'paiements', 'employes', 'achats', 'utilisateurs'];
    const toastId = toast.loading("Réinitialisation...");
    try {
      let total = 0;
      for (const colName of collectionsAVider) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) { if (colName === 'utilisateurs' && d.data().role === 'super_admin') continue; await deleteDoc(d.ref); total++; }
      }
      toast.success(`${total} documents supprimés.`, { id: toastId });
    } catch (error: any) { toast.error(error.message, { id: toastId }); }
  };

  const gererDeconnexion = () => { deconnexion(); navigate('/connexion'); };
  const demandesFiltrees = demandes.filter(d => d.nom_etablissement?.toLowerCase().includes(recherche.toLowerCase()) || d.nom_contact?.toLowerCase().includes(recherche.toLowerCase()));
  const etabsFiltres = etablissements.filter(e => e.nom?.toLowerCase().includes(recherche.toLowerCase()));

  const navItems = [
    { key: 'demandes', icon: <Users size={18} />, label: "Demandes d'accès", badge: demandes.filter(d => d.statut === 'en_attente').length },
    { key: 'etablissements', icon: <Building2 size={18} />, label: "Établissements", badge: etablissements.length },
    { key: 'paiements', icon: <CreditCard size={18} />, label: "Paiements", badge: paiements.filter(p => p.statut === 'en_attente').length },
    { key: 'comptabilite', icon: <TrendingUp size={18} />, label: "Comptabilité" },
    { key: 'maintenance', icon: <Database size={18} />, label: "Maintenance", danger: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── SIDEBAR ── */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-screen z-20 shadow-sm">
        <div className="flex items-center gap-3 px-8 py-8 border-b border-slate-100">
          <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-slate-900/10" />
          <div>

            <h2 className="font-bold text-slate-900 text-base tracking-tight">SUPER ADMIN</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Securits Tech</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setOnglet(item.key as Onglet)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group ${
                onglet === item.key
                  ? (item.danger ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20')
                  : (item.danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-300 ${onglet === item.key ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                  onglet === item.key 
                    ? 'bg-white/20 text-white' 
                    : (item.danger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600')
                }`}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 pb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center mb-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Support technique</p>
            <p className="text-slate-900 text-sm font-bold mt-1">+242 05 302 8383</p>
          </div>
          <button onClick={gererDeconnexion} className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors px-4 py-3 rounded-xl hover:bg-rose-50">
            <LogOut size={18} /> Déconnexion
          </button>
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center mt-4">Version 1.2.0 · Onboarding Auto</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 ml-72 p-8 min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {onglet === 'demandes' && "Demandes d'accès"}
              {onglet === 'paiements' && 'Validation des Paiements'}
              {onglet === 'comptabilite' && 'Gestion Comptable'}
              {onglet === 'etablissements' && 'Portefeuille Clients'}
              {onglet === 'maintenance' && 'Maintenance Système'}
            </h1>
            <p className="text-slate-400 font-medium mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> Synchronisation en temps réel
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 transition-all w-64 text-slate-900 font-medium" />
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'En attente', val: demandes.filter(r => r.statut === 'en_attente').length, color: 'text-amber-600 bg-amber-50' },
            { label: 'Établissements', val: etablissements.length, color: 'text-blue-600 bg-blue-50' },
            { label: 'Abonnés actifs', val: etablissements.filter(e => e.subscription_status === 'actif').length, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'MRR (ce mois)', val: `${mrrReel.toLocaleString()} F`, color: 'text-slate-700 bg-slate-100' },
          ].map(s => (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── DEMANDES ── */}
          {onglet === 'demandes' && (
            <motion.div key="demandes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Demandes en attente</h3>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {demandesFiltrees.filter(d => d.statut === 'en_attente').length} en attente · {demandesFiltrees.filter(d => d.statut === 'essai_actif').length} approuvées · {demandesFiltrees.filter(d => d.statut === 'refuse').length} refusées
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-5">Établissement</th>
                      <th className="px-6 py-5">Contact</th>
                      <th className="px-6 py-5">Téléphone</th>
                      <th className="px-6 py-5">Statut</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {chargement ? (
                      <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
                    ) : demandesFiltrees.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic text-sm">Aucune demande.</td></tr>
                    ) : demandesFiltrees.map((dem) => (
                      <tr key={dem.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900">{dem.nom_etablissement}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{dem.adresse_etablissement}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-slate-700">{dem.nom_contact}</div>
                          <div className="text-[11px] text-slate-400 italic">{dem.email_contact}</div>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900">{dem.telephone_contact}</td>
                        <td className="px-6 py-5">
                          <BadgeStatut statut={dem.statut} />
                          {dem.motif_refus && <div className="text-[10px] text-rose-400 mt-1 italic">{dem.motif_refus}</div>}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {dem.statut === 'en_attente' && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setModalApprobation({ demandeId: dem.id, demande: dem })} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-200 transition-all" title="Approuver">
                                <CheckCircle size={18} />
                              </button>
                              <button onClick={() => setModalRefus({ id: dem.id, nom: dem.nom_etablissement })} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-200 transition-all" title="Refuser">
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                          {dem.statut !== 'en_attente' && <span className="text-slate-400 text-xs italic font-medium">Traité</span>}
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
            <motion.div key="paiements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">Flux des Paiements</h3>
                    <p className="text-xs text-slate-400 font-medium">Suivi en temps réel des transactions entrantes</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      {paiements.filter(p => p.statut === 'en_attente').length} En attente
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                      <tr>
                        <th className="px-8 py-5">Date & Heure</th>
                        <th className="px-8 py-5">Établissement</th>
                        <th className="px-8 py-5">Pack / Période</th>
                        <th className="px-8 py-5">Montant</th>
                        <th className="px-8 py-5">Statut</th>
                        <th className="px-8 py-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paiements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-24">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border-2 border-dashed border-slate-100">
                                <CreditCard size={32} />
                              </div>
                              <h4 className="text-slate-900 font-bold">Aucune transaction</h4>
                              <p className="text-slate-400 text-sm max-w-[240px] mt-1 font-medium italic">Les demandes de paiement des établissements apparaîtront ici.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paiements.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">{new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{nomEtab(p.etablissement_id)}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{p.methode || 'DIRECT'}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Pack {p.plan_id || 'Premium'}</div>
                                <div className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">{p.periode || 'Mensuel'}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-lg font-display font-black text-slate-900 tracking-tighter italic">{(p.montant || 0).toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5">F</span></span>
                            </td>
                            <td className="px-8 py-6">
                                <BadgeStatut statut={p.statut} />
                            </td>
                            <td className="px-8 py-6 text-right">
                              {p.statut === 'en_attente' ? (
                                <button onClick={() => {
                                    setPlanPaiement(p.plan_id || 'premium');
                                    setModalPaiement(p);
                                }} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95">
                                  Examiner <ArrowUpRight size={14} />
                                </button>
                              ) : (
                                <div className="flex justify-end gap-2 opacity-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traité</span>
                                    {p.preuve_url && (
                                      <a href={p.preuve_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-600">
                                        <ExternalLink size={14} />
                                      </a>
                                    )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}


          {/* ── ÉTABLISSEMENTS ── */}
          {onglet === 'etablissements' && (
            <motion.div key="etabs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">Parc Clients GESTCAVE PRO</h3>
              </div>
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-5">Structure</th>
                    <th className="px-6 py-5">Contact</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5">Expiration</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {etabsFiltres.map((etab) => {
                    const expiration = new Date(etab.subscription_end_date);
                    const joursRestants = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const expirationImminente = joursRestants <= 7 && joursRestants > 0;
                    const expire = joursRestants <= 0;
                    return (
                      <tr key={etab.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 uppercase tracking-tight">{etab.nom}</div>
                          <div className="text-[11px] text-slate-400">{etab.adresse}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-slate-700 font-medium">{etab.contact_principal}</div>
                          <div className="text-[11px] text-slate-400">{etab.email_contact}</div>
                        </td>
                        <td className="px-6 py-5"><BadgeStatut statut={etab.subscription_status} /></td>
                        <td className="px-6 py-5">
                          <div className={`font-mono text-sm font-bold ${expire ? 'text-rose-500' : expirationImminente ? 'text-amber-500' : 'text-slate-500'}`}>
                            {expiration.toLocaleDateString('fr-FR')}
                          </div>
                          {expirationImminente && <div className="text-[10px] text-amber-500 flex items-center gap-1 font-bold"><AlertTriangle size={10} /> {joursRestants}j restants</div>}
                          {expire && <div className="text-[10px] text-rose-500 flex items-center gap-1 font-bold"><AlertTriangle size={10} /> Expiré</div>}
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => setModalEtabDetails(etab)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors border border-slate-200" title="Informations Clients">
                            <Info size={14} />
                          </button>
                          {etab.subscription_status !== 'suspendu' && (
                            <button onClick={() => suspendreEtablissement(etab)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-200 transition-colors" title="Suspendre">
                              <Ban size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* ── COMPTABILITÉ ── */}
          {onglet === 'comptabilite' && (
            <motion.div key="compta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Récapitulatif Facturation</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Abonnements actifs', val: etablissements.filter(e => e.subscription_status === 'actif').length },
                      { label: 'Essais gratuits', val: etablissements.filter(e => e.subscription_status === 'essai').length },
                      { label: 'Paiements validés', val: paiements.filter(p => p.statut === 'valide').length },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">{row.label}</span>
                        <span className="font-bold text-slate-900">{row.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3">
                      <span className="text-slate-500 font-medium">MRR réel (ce mois)</span>
                      <span className="text-emerald-600 font-black text-xl">{mrrReel.toLocaleString()} F</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Derniers paiements validés</h3>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {paiements.filter(p => p.statut === 'valide').slice(0, 5).length === 0 && <p className="text-slate-400 italic text-sm">Aucun paiement validé.</p>}
                    {paiements.filter(p => p.statut === 'valide').slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{nomEtab(p.etablissement_id)}</div>
                          <div className="text-[11px] text-slate-400">{new Date(p.date_validation || p.date).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <span className="text-emerald-600 font-bold">{(p.montant || 0).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity size={20} className="text-slate-400" /> Évolution Volume Mensuel</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(() => {
                      const statsMap: Record<string, number> = {};
                      paiements.filter(p => p.statut === 'valide').forEach(p => {
                        const d = new Date(p.date_validation || p.date);
                        const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        statsMap[mois] = (statsMap[mois] || 0) + (p.montant || 0);
                      });
                      return Array.from({length: 6}, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5-i)); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return { name: d.toLocaleDateString('fr-FR', {month:'short', year:'2-digit'}), Revenus: statsMap[k] || 0 }; });
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => [`${v.toLocaleString()} F`, 'Revenus']} />
                      <Line type="monotone" dataKey="Revenus" stroke="#0f172a" strokeWidth={3} dot={{ fill: '#fff', stroke: '#0f172a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MAINTENANCE ── */}
          {onglet === 'maintenance' && (
            <motion.div key="maintenance" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="bg-white border-2 border-rose-100 rounded-3xl p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-10 text-rose-50"><AlertCircle size={120} /></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3"><Database className="text-rose-500" size={24} /> Zone de Maintenance</h3>
                  <p className="text-slate-500 font-medium max-w-xl mb-8">Accès aux commandes de réinitialisation critique. Utilisez cet outil uniquement pour nettoyer la plateforme avant une simulation.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-slate-600">
                      <p className="font-bold text-amber-600 uppercase text-[10px] tracking-widest mb-1">Avertissement</p>
                      Supprimera tous les documents dans : <code className="text-slate-900 font-mono font-bold ml-1">etablissements, demandes, tables, produits, commandes, transactions, paiements...</code>
                    </div>
                  </div>
                  <button onClick={viderBase} className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-rose-600/25">
                    <Trash2 size={20} /> Réinitialiser la Plateforme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Statut Système</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-900 font-bold text-sm">Services Firebase Opérationnels</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Protection Admin</h4>
                  <div className="flex items-center gap-3 text-slate-900">
                    <Shield size={18} />
                    <span className="text-sm font-bold">Bypass de suppression Super Admin actif</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── MODAL DETAILS ETABLISSEMENT ── */}
      <AnimatePresence>
        {modalEtabDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div><h3 className="text-xl font-bold text-slate-900">Fiche Client</h3><p className="text-slate-400 text-sm mt-1">{modalEtabDetails.nom}</p></div>
                <button onClick={() => setModalEtabDetails(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><XCircle size={20} /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ID Établissement</label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                     <span className="text-xs font-mono font-bold text-slate-700 truncate">{modalEtabDetails.id}</span>
                     <button onClick={() => { navigator.clipboard.writeText(modalEtabDetails.id); toast.success('ID copié !'); }} className="text-slate-400 hover:text-slate-600"><Copy size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact</label>
                     <p className="text-sm font-bold text-slate-900">{modalEtabDetails.contact_principal || 'N/A'}</p>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Téléphone</label>
                     <p className="text-sm font-bold text-slate-900">{modalEtabDetails.telephone || 'N/A'}</p>
                   </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                  <p className="text-sm font-bold text-slate-900">{modalEtabDetails.email_contact || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Adresse</label>
                  <p className="text-sm font-bold text-slate-900">{modalEtabDetails.adresse || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Plan</label>
                     <p className="text-sm font-bold text-slate-900 capitalize">{modalEtabDetails.subscription_plan?.replace('_', ' ') || 'N/A'}</p>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiration</label>
                     <p className="text-sm font-bold text-slate-900 italic">{modalEtabDetails.subscription_end_date ? new Date(modalEtabDetails.subscription_end_date).toLocaleDateString('fr-FR') : 'N/A'}</p>
                   </div>
                </div>
              </div>

              {!prolongationMode ? (
                <div className="flex gap-4">
                  <button onClick={() => setModalEtabDetails(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">Fermer</button>
                  <button onClick={() => { setProlongationPlan(modalEtabDetails.subscription_plan || 'starter'); setProlongationMode(true); }} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                    <TrendingUp size={16} /> Prolonger l'abonnement
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Pack</label>
                        <select 
                           value={prolongationPlan} 
                           onChange={(e: any) => setProlongationPlan(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-700 appearance-none text-xs"
                        >
                           <option value="starter">STARTER</option>
                           <option value="premium">PREMIUM</option>
                           <option value="business">BUSINESS</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Durée</label>
                        <select 
                           value={prolongationDuree} 
                           onChange={(e: any) => setProlongationDuree(Number(e.target.value))}
                           className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-700 appearance-none text-xs"
                        >
                           <option value={30}>1 Mois</option>
                           <option value={90}>3 Mois</option>
                           <option value={180}>6 Mois</option>
                           <option value={365}>1 An</option>
                        </select>
                      </div>
                   </div>
                   <div className="flex gap-2 pt-2">
                      <button onClick={() => setProlongationMode(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Annuler</button>
                      <button onClick={prolongerEtablissement} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all">Confirmer l'extension</button>
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ── MODAL REFUS ── */}
      <AnimatePresence>
        {modalRefus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-xl font-bold text-slate-900">Refuser la demande</h3><p className="text-slate-400 text-sm mt-1">{modalRefus.nom}</p></div>
                <button onClick={() => setModalRefus(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Motif du refus</label>
                <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)} rows={3} placeholder="Ex: Informations incomplètes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-medium text-slate-700 resize-none" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setModalRefus(null)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition-all">Annuler</button>
                <button onClick={refuserDemande} className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold border border-rose-200 transition-all">Confirmer le refus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL APPROBATION DEMANDE ── */}
      <AnimatePresence>
        {modalApprobation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-xl font-bold text-slate-900">Approuver la demande</h3><p className="text-slate-400 text-sm mt-1">{modalApprobation.demande.nom_etablissement}</p></div>
                <button onClick={() => setModalApprobation(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Choisir le plan à attribuer</label>
                <select 
                   value={planApprobation} 
                   onChange={(e: any) => setPlanApprobation(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 appearance-none"
                >
                    <option value="demo">Essai Gratuit (14 jours)</option>
                    <option value="mensuel">SaaS STARTER (1 mois)</option>
                    <option value="starter_annuel">SaaS STARTER (1 an)</option>
                    <option value="premium">SaaS PREMIUM (1 mois)</option>
                    <option value="premium_annuel">SaaS PREMIUM (1 an)</option>
                    <option value="business">SaaS BUSINESS (1 mois)</option>
                    <option value="business_annuel">SaaS BUSINESS (1 an)</option>
                 </select>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setModalApprobation(null)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition-all">Annuler</button>
                <button onClick={validerApprobation} className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold border border-emerald-200 transition-all">Activer le compte</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL PAIEMENT ── */}
      <AnimatePresence>
        {modalPaiement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-xl font-bold text-slate-900">Examen du paiement</h3><p className="text-slate-400 text-sm">{nomEtab(modalPaiement.etablissement_id)}</p></div>
                <button onClick={() => setModalPaiement(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Montant</span><span className="text-emerald-600 font-black text-xl">{(modalPaiement.montant || 0).toLocaleString()} F CFA</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Période</span><span className="font-bold text-slate-900 uppercase tracking-widest text-[10px] bg-slate-200 px-2 py-1 rounded-md">{modalPaiement.periode || 'mensuel'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Méthode</span><span className="font-bold text-indigo-600 uppercase tracking-widest text-[10px] border border-indigo-200 px-2 py-1 rounded-md">{modalPaiement.methode || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold text-slate-900">{new Date(modalPaiement.date).toLocaleString('fr-FR')}</span></div>
              </div>
              
              {modalPaiement.preuve_url && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preuve de paiement (cliquez pour agrandir)</p>
                  <a href={modalPaiement.preuve_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border border-slate-200">
                    <img src={modalPaiement.preuve_url} alt="Preuve" className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" onError={(e: any) => { e.target.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs">VOIR EN PLEIN ÉCRAN</div>
                  </a>
                </div>
              )}
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valider comme abonnement</label>
                <select 
                   value={planPaiement} 
                   onChange={(e: any) => setPlanPaiement(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 appearance-none"
                >
                   <option value="starter">SaaS STARTER (15 000 FCFA)</option>
                   <option value="premium">SaaS PREMIUM (30 000 FCFA)</option>
                   <option value="business">SaaS BUSINESS (60 000 FCFA)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button onClick={() => rejeterPaiement(modalPaiement.id)} className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold border border-rose-200 transition-all">Rejeter</button>
                <button onClick={validerPaiementAction} className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition-all">✅ Valider & Activer</button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL LIEN ACTIVATION ── */}
      <AnimatePresence>
        {lienActivation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-3xl p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"><CheckCircle size={40} /></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Accès activé !</h3>
              <p className="text-slate-400 text-sm mb-8">Copiez ce lien et envoyez-le à <span className="font-bold text-slate-900">{lienActivation.nom}</span>.</p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center gap-3">
                <input readOnly value={lienActivation.url} className="bg-transparent border-none text-xs text-slate-600 w-full outline-none font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(lienActivation.url); toast.success("Lien copié !"); }} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all"><ExternalLink size={18} /></button>
              </div>
              <button onClick={() => setLienActivation(null)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all">Terminé</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Composant Badge
const BadgeStatut = ({ statut }: { statut: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    en_attente:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',    label: 'En attente' },
    essai_actif: { cls: 'bg-blue-50 text-blue-700 border border-blue-200',       label: 'Essai actif' },
    essai:       { cls: 'bg-blue-50 text-blue-700 border border-blue-200',       label: 'Essai' },
    actif:       { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Actif' },
    refuse:      { cls: 'bg-rose-50 text-rose-700 border border-rose-200',       label: 'Refusé' },
    valide:      { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Validé' },
    rejete:      { cls: 'bg-rose-50 text-rose-700 border border-rose-200',       label: 'Rejeté' },
    suspendu:    { cls: 'bg-slate-100 text-slate-600 border border-slate-200',   label: 'Suspendu' },
  };
  const s = map[statut] || { cls: 'bg-slate-100 text-slate-500 border border-slate-200', label: statut };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${s.cls}`}>{s.label}</span>;
};

export default TableauSuperAdmin;
