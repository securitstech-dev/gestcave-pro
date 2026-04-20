import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle, XCircle, LogOut, 
  Search, Building2, CreditCard, TrendingUp, Shield,
  ArrowUpRight, AlertTriangle, Loader2, ExternalLink, X, Ban, Activity,
  Trash2, Database, AlertCircle, Info, Copy, Key, ArrowRight, ShieldCheck,
  Globe, Landmark, Cpu, Sparkles, BarChart3, Settings, ZapOff, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [modalAjoutEtab, setModalAjoutEtab] = useState(false);
  const [nouvelEtab, setNouvelEtab] = useState({ nom: '', contact: '', email: '', plan: 'premium' });

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
    const toastId = toast.loading('Création du compte...');
    
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
      toast.dismiss(toastId); toast.success(`Accès accordé pour ${demande.nom_etablissement}`);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur: ${err.message}`); }
  };

  const refuserDemande = async () => {
    if (!modalRefus) return;
    const toastId = toast.loading('Refus en cours...');
    try {
      await updateDoc(doc(db, 'demandes_acces', modalRefus.id), { statut: 'refuse', motif_refus: motifRefus || 'Non éligible.', date_refus: new Date().toISOString() });
      toast.dismiss(toastId); toast.success(`Demande refusée.`);
      setModalRefus(null); setMotifRefus('');
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur: ${err.message}`); }
  };

  const validerPaiementAction = async () => {
    if (!modalPaiement) return;
    const toastId = toast.loading('Validation du paiement...');
    const estAnnuel = modalPaiement.periode === 'annuel';
    const jours = estAnnuel ? 365 : 30;
    
    try {
      await updateDoc(doc(db, 'paiements', modalPaiement.id), { statut: 'valide', date_validation: new Date().toISOString() });
      await updateDoc(doc(db, 'etablissements', modalPaiement.etablissement_id), { 
          subscription_status: 'actif', 
          subscription_plan: planPaiement,
          subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString() 
      });
      toast.dismiss(toastId); toast.success(`Paiement validé avec succès.`); setModalPaiement(null);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur: ${err.message}`); }
  };

  const rejeterPaiement = async (paiementId: string) => {
    const toastId = toast.loading('Rejet du paiement...');
    try {
      await updateDoc(doc(db, 'paiements', paiementId), { statut: 'rejete', date_rejet: new Date().toISOString() });
      toast.dismiss(toastId); toast.success('Paiement rejeté.'); setModalPaiement(null);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur: ${err.message}`); }
  };

  const ajouterEtabAction = async () => {
    if (!nouvelEtab.nom || !nouvelEtab.email) return toast.error("Nom et Email requis");
    const toastId = toast.loading('Création...');
    try {
      // 1. Création de l'établissement
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: nouvelEtab.nom,
        contact_principal: nouvelEtab.contact || 'Administrateur',
        email_contact: nouvelEtab.email,
        subscription_plan: nouvelEtab.plan,
        subscription_status: 'actif',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 2. Création de l'invitation pour que le gérant puisse s'inscrire
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'invitations'), { 
        token: invitationToken, 
        email: nouvelEtab.email, 
        nom: nouvelEtab.contact || 'Gérant', 
        etablissement_id: etabRef.id, 
        role: 'client_admin', 
        date_creation: new Date().toISOString(), 
        expire: Date.now() + (72 * 60 * 60 * 1000) 
      });

      const urlComplete = `${window.location.origin}/activation?token=${invitationToken}`;
      setLienActivation({ url: urlComplete, nom: nouvelEtab.nom });

      toast.success("Établissement créé et invitation générée !", { id: toastId });
      setModalAjoutEtab(false);
      setNouvelEtab({ nom: '', contact: '', email: '', plan: 'premium' });
    } catch (err: any) { 
      toast.error(err.message, { id: toastId }); 
    }
  };

  const reactiverEtablissement = async (etabId: string) => {
    const toastId = toast.loading('Réactivation...');
    try {
      await updateDoc(doc(db, 'etablissements', etabId), { 
        subscription_status: 'actif',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast.success("Établissement réactivé !", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const suspendreEtablissement = async (etab: any) => {
    if (!window.confirm(`Suspendre définitivement ${etab.nom} ?`)) return;
    const toastId = toast.loading('Suspension...');
    try {
      await updateDoc(doc(db, 'etablissements', etab.id), { subscription_status: 'suspendu', subscription_end_date: new Date().toISOString() });
      toast.dismiss(toastId); toast.success(`${etab.nom} a été suspendu.`);
    } catch (err: any) { toast.dismiss(toastId); toast.error(`Erreur: ${err.message}`); }
  };

  const viderBase = async () => {
    const confirmation = window.prompt("⚠️ ACTION CRITIQUE : Pour confirmer la suppression de TOUTE la plateforme, tapez 'PURGE' ci-dessous :");
    if (confirmation !== 'PURGE') return;

    const collectionsAVider = [
      'demandes_acces', 'etablissements', 'invitations', 'tables', 
      'produits', 'commandes', 'transactions', 'paiements', 
      'employes', 'achats', 'utilisateurs', 'sessions', 'charges_fixes'
    ];
    
    const toastId = toast.loading("Purge de la base en cours...");
    try {
      let total = 0;
      for (const colName of collectionsAVider) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) { 
          // On ne supprime pas le compte Super Admin actuel pour ne pas être déconnecté
          if (colName === 'utilisateurs' && d.data().role === 'super_admin') continue; 
          await deleteDoc(d.ref); 
          total++; 
        }
      }
      toast.success(`Plateforme réinitialisée. ${total} documents supprimés.`, { id: toastId });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) { 
      toast.error(error.message, { id: toastId }); 
    }
  };

  const gererDeconnexion = () => { deconnexion(); navigate('/connexion'); };
  const demandesFiltrees = demandes.filter(d => d.nom_etablissement?.toLowerCase().includes(recherche.toLowerCase()) || d.nom_contact?.toLowerCase().includes(recherche.toLowerCase()));
  const etabsFiltres = etablissements.filter(e => e.nom?.toLowerCase().includes(recherche.toLowerCase()));

  const navItems = [
    { key: 'demandes', icon: <Users size={20} />, label: "Demandes d'accès", badge: demandes.filter(d => d.statut === 'en_attente').length },
    { key: 'etablissements', icon: <Building2 size={20} />, label: "Établissements", badge: etablissements.length },
    { key: 'paiements', icon: <CreditCard size={20} />, label: "Paiements & Abonnements", badge: paiements.filter(p => p.statut === 'en_attente').length },
    { key: 'comptabilite', icon: <TrendingUp size={20} />, label: "Comptabilité Globale" },
    { key: 'maintenance', icon: <Database size={20} />, label: "Maintenance", danger: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-['Inter',sans-serif] text-slate-800">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col fixed h-screen z-50 shadow-xl shadow-blue-900/5">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A] to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/10">
                <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none">Console</h2>
              <p className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mt-1">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 no-scrollbar overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Administration</p>
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setOnglet(item.key as Onglet)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all font-bold text-sm ${
                onglet === item.key
                  ? (item.danger ? 'bg-rose-50 text-rose-600 shadow-sm' : 'bg-blue-50 text-[#1E3A8A] shadow-sm shadow-blue-900/5')
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`${onglet === item.key ? (item.danger ? 'text-rose-600' : 'text-[#1E3A8A]') : 'text-slate-400'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                  onglet === item.key ? 'bg-blue-200/50 text-[#1E3A8A]' : 'bg-slate-100 text-slate-400'
                }`}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-50">
          <button onClick={gererDeconnexion} className="w-full flex items-center justify-center gap-3 h-14 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm group">
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-8 md:p-12 overflow-y-auto">
        <header className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-12">
          <div className="space-y-4">
              <div className="inline-flex items-center gap-4">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest">
                    <Landmark size={14} />
                    GestCave Global Core
                 </div>
                 {window.location.hostname === 'localhost' && (
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-orange-500/20">
                     <AlertTriangle size={14} /> Mode Test Local
                   </div>
                 )}
              </div>
             <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tight leading-none">
              {onglet === 'demandes' && "Demandes d'accès"}
              {onglet === 'paiements' && 'Paiements & Abonnements'}
              {onglet === 'comptabilite' && 'Comptabilité Globale'}
              {onglet === 'etablissements' && 'Gestion des Établissements'}
              {onglet === 'maintenance' && 'Maintenance du Système'}
             </h1>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher une entité..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="w-full h-16 pl-14 pr-6 bg-white border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm shadow-xl shadow-blue-900/5" />
          </div>
        </header>

        {/* Vital Metrics Ledger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Demandes en attente', val: demandes.filter(r => r.statut === 'en_attente').length, icon: <Users size={24} />, color: 'text-blue-500' },
            { label: 'Établissements Inscrits', val: etablissements.length, icon: <Building2 size={24} />, color: 'text-blue-600' },
            { label: 'Abonnements Actifs', val: etablissements.filter(e => e.subscription_status === 'actif').length, icon: <Activity size={24} />, color: 'text-emerald-500' },
            { label: 'Revenus (Ce mois)', val: `${mrrReel.toLocaleString()} XAF`, icon: <TrendingUp size={24} />, color: 'text-orange-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-white group-hover:shadow-md transition-all text-slate-400 group-hover:text-[#1E3A8A]">
                        {s.icon}
                    </div>
                    {i === 3 && <div className="px-3 py-1 bg-orange-50 text-[#FF7A00] text-[10px] font-black rounded-lg uppercase tracking-widest">Live</div>}
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{s.label}</p>
                <p className={`text-3xl font-black tracking-tight ${s.color.includes('emerald') ? 'text-emerald-600' : s.color.includes('orange') ? 'text-[#FF7A00]' : 'text-[#1E3A8A]'}`}>
                  {s.val}
                </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden min-h-[600px] animate-in fade-in duration-500">
          {/* ── DEMANDES ── */}
          {onglet === 'demandes' && (
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                    {chargement ? (
                      <div className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-[#1E3A8A]" size={48} /></div>
                    ) : demandesFiltrees.length === 0 ? (
                      <div className="p-40 text-center">
                        <Users size={64} className="mx-auto text-slate-100 mb-6" />
                        <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Aucune demande en attente.</p>
                      </div>
                    ) : demandesFiltrees.map((dem) => (
                      <div key={dem.id} className="bg-white rounded-[2rem] border border-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-blue-100 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:bg-blue-50 transition-colors">
                              🏢
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-3">{dem.nom_etablissement}</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg tracking-widest uppercase border border-slate-200">{dem.nom_contact}</span>
                                <span className="text-[10px] font-bold bg-blue-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg tracking-widest uppercase border border-blue-100">{dem.email_contact}</span>
                                <BadgeStatut statut={dem.statut} />
                            </div>
                          </div>
                        </div>
                        
                        {dem.statut === 'en_attente' && (
                            <div className="flex gap-2 w-full md:w-auto">
                              <button onClick={() => setModalRefus({ id: dem.id, nom: dem.nom_etablissement })} className="h-16 px-8 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95">Refuser</button>
                              <button onClick={() => setModalApprobation({ demandeId: dem.id, demande: dem })} className="h-16 px-10 bg-[#1E3A8A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3 active:scale-95">
                                Approuver <ArrowRight size={18} />
                              </button>
                            </div>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          )}

          {/* ── PAIEMENTS ── */}
          {onglet === 'paiements' && (
            <div className="p-10 space-y-6">
               <div className="grid grid-cols-1 gap-4">
                    {paiements.length === 0 ? (
                      <div className="p-40 text-center">
                        <CreditCard size={64} className="mx-auto text-slate-100 mb-6" />
                        <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Aucun paiement enregistré.</p>
                      </div>
                    ) : (
                      paiements.map((p) => (
                        <div key={p.id} className="bg-white rounded-[2rem] border border-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-orange-100 transition-all group shadow-sm hover:shadow-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-[#FF7A00]/10 group-hover:bg-[#FF7A00] transition-colors" />
                          
                          <div className="flex items-center gap-8 flex-1">
                              <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-black text-xs text-slate-400 shadow-inner border border-slate-100 group-hover:bg-orange-50 transition-colors uppercase">
                                  {p.methode?.slice(0, 4) || 'VIRE'}
                              </div>
                              <div>
                                  <h4 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-3">{nomEtab(p.etablissement_id)}</h4>
                                  <div className="flex flex-wrap gap-2">
                                      <span className="text-[10px] font-bold bg-orange-50 text-[#FF7A00] px-3 py-1.5 rounded-lg tracking-widest uppercase border border-orange-100">{p.plan_id || 'PREMIUM'}</span>
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg tracking-widest uppercase border border-slate-200">{new Date(p.date).toLocaleDateString()}</span>
                                      <BadgeStatut statut={p.statut} />
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center gap-10 w-full md:w-auto">
                              <div className="text-right">
                                  <p className="text-3xl font-black text-[#1E3A8A] tracking-tighter">{(p.montant || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.periode || 'Mensuel'}</p>
                              </div>

                              {p.statut === 'en_attente' ? (
                                <button onClick={() => { setPlanPaiement(p.plan_id || 'premium'); setModalPaiement(p); }} className="h-16 px-10 bg-[#FF7A00] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/10 active:scale-95">Valider</button>
                              ) : (
                                  <div className="flex gap-2">
                                      {p.preuve_url && (
                                        <a href={p.preuve_url} target="_blank" rel="noreferrer" className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-[#1E3A8A] hover:text-white transition-all shadow-inner">
                                          <ExternalLink size={24} />
                                        </a>
                                      )}
                                  </div>
                              )}
                          </div>
                        </div>
                      ))
                    )}
               </div>
            </div>
          )}

          {/* ── ÉTABLISSEMENTS ── */}
          {onglet === 'etablissements' && (
            <div className="p-10 space-y-6">
               <div className="flex justify-between items-center mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{etabsFiltres.length} Établissements trouvés</p>
                  <button onClick={() => setModalAjoutEtab(true)} className="h-12 px-6 bg-[#1E3A8A] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
                    <Building2 size={16} /> Ajouter un Établissement
                  </button>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {etabsFiltres.map((etab) => {
                    const expiration = new Date(etab.subscription_end_date);
                    const joursRestants = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const expire = joursRestants <= 0;
                    return (
                      <div key={etab.id} className="bg-white rounded-[2rem] border border-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-emerald-100 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:bg-emerald-50 transition-colors uppercase font-black text-slate-200">
                              {etab.nom?.[0] || 'E'}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-3">{etab.nom}</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg tracking-widest uppercase border border-slate-200">{etab.contact_principal}</span>
                                <span className="text-[10px] font-bold bg-blue-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg tracking-widest uppercase border border-blue-100">{etab.subscription_plan}</span>
                                <BadgeStatut statut={etab.subscription_status} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10 w-full md:w-auto">
                           <div className="text-right">
                              <p className={`text-xl font-black tracking-tight ${expire ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>{expiration.toLocaleDateString()}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Échéance</p>
                           </div>

                           <div className="flex gap-2">
                              {etab.subscription_status === 'suspendu' || expire ? (
                                <button onClick={() => reactiverEtablissement(etab.id)} className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center hover:bg-[#1E3A8A] hover:text-white transition-all shadow-inner" title="Réactiver"><Zap size={24} /></button>
                              ) : (
                                <button onClick={() => suspendreEtablissement(etab)} className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner" title="Suspendre"><Ban size={24} /></button>
                              )}
                              <button onClick={() => { useAuthStore.getState().setEtablissementSimule(etab.id); navigate('/tableau-de-bord'); }} className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-inner" title="Prendre le contrôle"><ExternalLink size={24} /></button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* ── COMPTABILITÉ ── */}
          {onglet === 'comptabilite' && (
            <div className="p-10 md:p-16 space-y-12 animate-in slide-in-from-bottom duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-slate-50 rounded-[3rem] p-10 md:p-12 border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-sm"><BarChart3 size={24} /></div>
                     <div>
                        <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Résumé Analytique</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Indicateurs de croissance GestCave</p>
                     </div>
                  </div>

                  <div className="space-y-8">
                    {[
                      { label: 'Abonnements Actifs', val: etablissements.filter(e => e.subscription_status === 'actif').length, icon: <Activity size={16} /> },
                      { label: 'Périodes d\'Essai', val: etablissements.filter(e => e.subscription_status === 'essai').length, icon: <Sparkles size={16} /> },
                      { label: 'Paiements Validés (Total)', val: paiements.filter(p => p.statut === 'valide').length, icon: <CheckCircle size={16} /> },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center pb-6 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                           <span className="text-slate-400">{row.icon}</span>
                           <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{row.label}</span>
                        </div>
                        <span className="text-2xl font-black text-[#1E3A8A] tracking-tighter">{row.val}</span>
                      </div>
                    ))}
                    <div className="flex flex-col md:flex-row justify-between pt-10 items-center gap-6 bg-white/50 p-8 rounded-[2rem] border border-white">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenu Mensuel (MRR)</p>
                        <p className="text-[#FF7A00] font-black text-5xl tracking-tighter">{mrrReel.toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
                      </div>
                      <div className="bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-900/10">
                         <TrendingUp size={18} className="text-[#FF7A00]" />
                         <span className="text-xs font-black tracking-widest uppercase">+14% Growth</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] p-10 md:p-12 border border-slate-100 shadow-xl shadow-blue-900/5 group">
                   <div className="flex items-center justify-between mb-12">
                      <div>
                        <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Courbe de Revenus</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Projection semestrielle</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"><TrendingUp size={24} /></div>
                   </div>
                   <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(() => {
                        const statsMap: Record<string, number> = {};
                        paiements.filter(p => p.statut === 'valide').forEach(p => {
                          const d = new Date(p.date_validation || p.date);
                          const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                          statsMap[mois] = (statsMap[mois] || 0) + (p.montant || 0);
                        });
                        return Array.from({length: 6}, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5-i)); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return { name: d.toLocaleDateString('fr-FR', {month:'short'}).toUpperCase(), Revenus: statsMap[k] || 0 }; });
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} dy={10} fontStyle="bold" />
                        <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} dx={-10} fontStyle="bold" />
                        <Tooltip cursor={{ stroke: '#f1f5f9', strokeWidth: 20 }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }} />
                        <Line type="monotone" dataKey="Revenus" stroke="#1E3A8A" strokeWidth={6} activeDot={{ r: 10, fill: '#FF7A00', stroke: '#fff', strokeWidth: 4 }} dot={{ r: 4, fill: '#1E3A8A', strokeWidth: 2, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MAINTENANCE ── */}
          {onglet === 'maintenance' && (
            <div className="p-10 md:p-16 space-y-12 animate-in slide-in-from-bottom duration-700">
               <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-xl shadow-blue-900/5 relative overflow-hidden">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Database size={28} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Zone de Maintenance</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Accès aux commandes de réinitialisation critique</p>
                     </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex gap-6 text-amber-800 mb-12">
                     <AlertTriangle className="shrink-0 text-[#FF7A00]" size={32} />
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Avertissement</p>
                        <p className="text-xs font-bold leading-relaxed">
                           Cette action supprimera tous les documents dans : <span className="font-black">etablissements, demandes, tables, produits, commandes, transactions, paiements, employeurs, utilisateurs...</span>
                           Utilisez cet outil uniquement pour nettoyer la plateforme avant une nouvelle phase de test.
                        </p>
                     </div>
                  </div>

                  <button 
                    onClick={viderBase}
                    className="h-20 bg-rose-600 text-white rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/20 flex items-center gap-4 active:scale-95"
                  >
                    <Trash2 size={20} /> Réinitialiser la Plateforme
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modalApprobation && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
            <div onClick={() => setModalApprobation(null)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-xl p-12 md:p-16 rounded-[3.5rem] shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-500">
               <button onClick={() => setModalApprobation(null)} className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all"><X size={24} /></button>
               
               <div className="mb-12">
                  <div className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center mb-10 shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight uppercase leading-none">Approuver l'accès</h3>
                  <p className="text-lg font-medium text-slate-500 mt-4">{modalApprobation.demande.nom_etablissement}</p>
               </div>

               <div className="space-y-10">
                  <div className="space-y-4">
                     <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Forfait attribué</label>
                     <select 
                        value={planApprobation} 
                        onChange={(e: any) => setPlanApprobation(e.target.value)}
                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-[#1E3A8A] outline-none focus:ring-4 focus:ring-blue-100 transition-all text-sm uppercase tracking-widest"
                     >
                        <option value="demo">Essai Gratuit (14 Jours)</option>
                        <option value="mensuel">Starter (30 Jours)</option>
                        <option value="starter_annuel">Starter (Annuel)</option>
                        <option value="premium">Premium (30 Jours)</option>
                        <option value="premium_annuel">Premium (Annuel)</option>
                        <option value="business">Business (30 Jours)</option>
                        <option value="business_annuel">Business (Annuel)</option>
                     </select>
                  </div>
                  
                  <button onClick={validerApprobation} className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 active:scale-95">
                    Générer le lien <ArrowRight size={20} />
                  </button>
               </div>
            </div>
         </div>
      )}

      {modalRefus && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
           <div onClick={() => setModalRefus(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
           <div className="bg-white w-full max-w-xl p-12 md:p-16 rounded-[3.5rem] shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-500">
              <button onClick={() => setModalRefus(null)} className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"><X size={24} /></button>
              
              <div className="mb-12">
                 <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-10 shadow-inner">
                   <XCircle size={32} />
                 </div>
                 <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight uppercase leading-none">Refuser la demande</h3>
                 <p className="text-lg font-medium text-slate-500 mt-4">{modalRefus.nom}</p>
              </div>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Motif du refus</label>
                    <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)} rows={4} placeholder="Précisez la raison..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-100 transition-all uppercase tracking-widest" />
                 </div>
                 
                 <button onClick={refuserDemande} className="w-full h-20 bg-rose-500 text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-rose-900/20 hover:bg-rose-600 transition-all active:scale-95">
                   Confirmer le refus
                 </button>
              </div>
           </div>
        </div>
      )}

      {modalPaiement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
           <div onClick={() => setModalPaiement(null)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
           <div className="bg-white w-full max-w-4xl p-12 md:p-16 rounded-[4rem] shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-500">
              <button onClick={() => setModalPaiement(null)} className="absolute top-12 right-12 p-4 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all"><X size={24} /></button>
              
              <div className="mb-12">
                 <h3 className="text-5xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none mb-4">Vérification</h3>
                 <p className="text-slate-500 font-medium text-xl">Validation du règlement pour {nomEtab(modalPaiement.etablissement_id)}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                 <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">Détails Financiers</p>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Forfait</span>
                          <span className="text-lg font-black text-[#1E3A8A] uppercase tracking-tight">{modalPaiement.plan_id || 'Premium'}</span>
                       </div>
                       <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Période</span>
                          <span className="text-lg font-black text-[#1E3A8A] uppercase tracking-tight">{modalPaiement.periode || 'Mensuel'}</span>
                       </div>
                       <div className="flex justify-between items-center pt-6">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Montant Reçu</span>
                          <span className="text-4xl font-black text-[#FF7A00] tracking-tighter">{(modalPaiement.montant || 0).toLocaleString()} XAF</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="relative group">
                    {modalPaiement.preuve_url ? (
                        <div className="border border-slate-100 rounded-[3rem] p-4 bg-slate-50 flex items-center justify-center h-full shadow-inner overflow-hidden group-hover:scale-[1.02] transition-all">
                           <img src={modalPaiement.preuve_url} alt="Preuve" className="max-h-72 object-contain rounded-2xl" />
                        </div>
                    ) : (
                        <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center bg-slate-50 text-slate-200 h-full">
                           <ZapOff size={48} className="mb-4" />
                           <p className="text-xs font-bold uppercase tracking-widest">Aucun justificatif</p>
                        </div>
                    )}
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={() => rejeterPaiement(modalPaiement.id)} className="flex-1 h-20 bg-rose-50 text-rose-600 rounded-[2rem] font-bold uppercase tracking-widest text-sm hover:bg-rose-500 hover:text-white transition-all">Rejeter</button>
                 <button onClick={validerPaiementAction} className="flex-[2] h-20 bg-[#FF7A00] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-orange-900/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-4">
                    Valider & Activer le Compte <ArrowRight size={20} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {modalAjoutEtab && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div onClick={() => setModalAjoutEtab(false)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-lg p-12 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500">
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-8">Nouvel Établissement</h3>
               <div className="space-y-6">
                  <input type="text" placeholder="Nom de l'établissement" value={nouvelEtab.nom} onChange={e => setNouvelEtab({...nouvelEtab, nom: e.target.value})}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100" />
                  <input type="email" placeholder="Email du gérant" value={nouvelEtab.email} onChange={e => setNouvelEtab({...nouvelEtab, email: e.target.value})}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100" />
                  <select value={nouvelEtab.plan} onChange={e => setNouvelEtab({...nouvelEtab, plan: e.target.value})}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 uppercase tracking-widest">
                    <option value="premium">Premium</option>
                    <option value="business">Business</option>
                    <option value="starter">Starter</option>
                  </select>
                  <button onClick={ajouterEtabAction} className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all mt-4">
                    Créer l'Établissement
                  </button>
               </div>
            </div>
         </div>
      )}

      {lienActivation && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12">
            <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-2xl p-12 md:p-16 rounded-[4rem] shadow-2xl text-center relative border border-white/20 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-inner">
                 <CheckCircle size={48} />
               </div>
               <h3 className="text-4xl font-black text-slate-800 tracking-tight uppercase leading-none mb-6">Compte Créé !</h3>
               <p className="text-slate-500 font-medium text-lg mb-12">Transmettez ce lien unique au gérant de <span className="font-bold text-[#1E3A8A]">{lienActivation.nom}</span>.</p>
               
               <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10 mb-12 font-mono text-sm text-[#1E3A8A] break-all select-all flex items-center justify-center shadow-inner">
                  {lienActivation.url}
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setLienActivation(null)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Fermer</button>
                  <button onClick={() => { navigator.clipboard.writeText(lienActivation.url); toast.success("Lien copié"); }} className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 hover:bg-blue-800 flex items-center justify-center gap-3 transition-all active:scale-95">
                    <Copy size={20} /> Copier le lien
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const BadgeStatut = ({ statut }: { statut: string }) => {
  const s = statut?.toLowerCase();
  if (s === 'valide' || s === 'actif' || s === 'essai_actif') return <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Actif</span>;
  if (s === 'en_attente') return <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">En attente</span>;
  if (s === 'refuse' || s === 'rejete' || s === 'suspendu') return <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">Bloqué</span>;
  if (s === 'essai') return <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 shadow-sm">Essai</span>;
  return <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">{statut}</span>;
};

export default TableauSuperAdmin;
