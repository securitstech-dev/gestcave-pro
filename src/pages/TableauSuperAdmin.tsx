import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle, XCircle, LogOut, 
  Search, Building2, CreditCard, TrendingUp, Shield,
  ArrowUpRight, AlertTriangle, Loader2, ExternalLink, X, Ban, Activity,
  Trash2, Database, AlertCircle, Info, Copy, Key, ArrowRight, ShieldCheck,
  Globe, Landmark, Cpu, Sparkles, BarChart3, Settings, ZapOff, Zap, Calendar, Mail, MessageSquare, LayoutDashboard, Tablet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { clearFirestoreCache } from '../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SimulateurTablette from './modules/SimulateurTablette';

type Onglet = 'demandes' | 'messages' | 'paiements' | 'etablissements' | 'comptabilite' | 'maintenance' | 'laboratoire' | 'rh_interne' | 'finance_interne' | 'support' | 'caisse';

const TableauSuperAdmin = () => {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [messagesContact, setMessagesContact] = useState<any[]>([]);
  const [equipeInterne, setEquipeInterne] = useState<any[]>([]);
  const [ticketsSupport, setTicketsSupport] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('demandes');
  const [recherche, setRecherche] = useState('');
  const navigate = useNavigate();
  const { deconnexion, reinitialiserMotDePasse } = useAuthStore();

  const [modalRefus, setModalRefus] = useState<{ id: string; nom: string } | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  
  const [modalApprobation, setModalApprobation] = useState<{ demandeId: string; demande: any } | null>(null);
  const [planApprobation, setPlanApprobation] = useState<string>('demo');

  const [modalEtabDetails, setModalEtabDetails] = useState<any | null>(null);

  const [modalPaiement, setModalPaiement] = useState<any | null>(null);
  const [planPaiement, setPlanPaiement] = useState<'mensuel' | 'premium' | 'business'>('mensuel');
  
  const [lienActivation, setLienActivation] = useState<{ url: string; nom: string; email?: string; plan?: string; nomGerant?: string; telephone?: string } | null>(null);
  const [modalAjoutEtab, setModalAjoutEtab] = useState(false);
  const [nouvelEtab, setNouvelEtab] = useState({ nom: '', contact: '', email: '', plan: 'premium' });
  
  const [modalResetPassword, setModalResetPassword] = useState<any | null>(null);
  const [modalExtendSub, setModalExtendSub] = useState<any | null>(null);
  const [joursProlongation, setJoursProlongation] = useState(30);
  const [modalModules, setModalModules] = useState<any | null>(null);
  const [modulesActifs, setModulesActifs] = useState<string[]>([]);

  // States for renderVueCaisse
  const [selectedEtabCaisse, setSelectedEtabCaisse] = useState<any | null>(null);
  const [montantCaisse, setMontantCaisse] = useState<number>(0);
  const [motifCaisse, setMotifCaisse] = useState('Renouvellement Abonnement');
  const [dureeCaisse, setDureeCaisse] = useState(30);
  const [sendingCaisse, setSendingCaisse] = useState(false);

  useEffect(() => {
    setChargement(true);
    const unsubDemandes = onSnapshot(
      query(collection(db, 'demandes_acces'), orderBy('date_demande', 'desc')),
      (snap) => { setDemandes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setChargement(false); },
      (err) => { console.error(err); setChargement(false); }
    );
    const unsubEtabs = onSnapshot(collection(db, 'etablissements'), (snap) => setEtablissements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPaiements = onSnapshot(
      query(collection(db, 'paiements'), orderBy('date', 'desc')),
      (snapshot) => setPaiements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubMessages = onSnapshot(
      query(collection(db, 'messages_contact'), orderBy('date', 'desc')),
      (snapshot) => setMessagesContact(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubEquipe = onSnapshot(
      query(collection(db, 'employes'), where('etablissement_id', '==', 'securits-tech')),
      (snap) => setEquipeInterne(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubTickets = onSnapshot(
      query(collection(db, 'tickets_support'), orderBy('date_creation', 'desc')),
      (snap) => setTicketsSupport(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    setChargement(false);
    return () => {
      unsubDemandes();
      unsubEtabs();
      unsubPaiements();
      unsubMessages();
      unsubEquipe();
      unsubTickets();
    };
  }, []);

  const maintenant = new Date();
  const mrrReel = paiements
    .filter(p => { if (p.statut !== 'valide') return false; const d = new Date(p.date_validation || p.date || ''); return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear(); })
    .reduce((acc, p) => acc + (p.montant || 0), 0);

  const nomEtab = (etabId: string) => { const etab = etablissements.find(e => e.id === etabId); return etab?.nom || etab?.contact_principal || `...${etabId?.slice(-6)}`; };

  // --- Plan → Modules mapping ---
  const MODULES_PAR_PLAN: Record<string, string[]> = {
    'essai_gratuit': ['pos', 'stock', 'hr', 'compta', 'kds', 'analytics'],
    'starter':       ['pos', 'stock', 'kds'],
    'premium':       ['pos', 'stock', 'hr', 'compta', 'kds'],
    'business':      ['pos', 'stock', 'hr', 'compta', 'kds', 'analytics'],
  };

  const NOMS_MODULES: Record<string, string> = {
    pos:       '✅ Point de Vente (Caisse / Serveurs)',
    stock:     '✅ Gestion des Stocks & Inventaire',
    hr:        '✅ Ressources Humaines & Pointage',
    compta:    '✅ Comptabilité & Grand Livre',
    kds:       '✅ Écran Cuisine / Bar (KDS)',
    analytics: '✅ Analyses Prédictives & Rapports',
  };

  const DESCRIPTIONS_PLAN: Record<string, string> = {
    essai_gratuit: 'Essai Gratuit 14 jours (tous les modules débloqués)',
    starter:       'Formule Starter — POS, Stocks, KDS',
    premium:       'Formule Premium — POS, Stocks, KDS, RH, Comptabilité',
    business:      'Formule Business — Accès complet à tous les modules',
  };


  const validerApprobation = async () => {
    if (!modalApprobation) return;
    const { demandeId, demande } = modalApprobation;

    if (!demande.email_contact) {
      toast.error("Impossible d'approuver : l'email de contact est manquant.");
      return;
    }

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
      // Vérifier si un établissement existe déjà avec cet email
      const q = query(collection(db, 'etablissements'), where('email_contact', '==', demande.email_contact));
      const qSnap = await getDocs(q);
      
      let etabId = '';
      if (!qSnap.empty) {
        // Déjà existant (probablement via PageInscription)
        etabId = qSnap.docs[0].id;
        await updateDoc(doc(db, 'etablissements', etabId), {
          subscription_plan: typePlan,
          subscription_status: statut,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString(),
          modules_actifs: MODULES_PAR_PLAN[typePlan] || MODULES_PAR_PLAN['essai_gratuit']
        });
      } else {
        // Nouveau
        const etabRef = await addDoc(collection(db, 'etablissements'), {
          nom: demande.nom_etablissement, adresse: demande.adresse_etablissement || 'N/A',
          telephone: demande.telephone_contact || 'N/A', contact_principal: demande.nom_contact,
          email_contact: demande.email_contact, subscription_plan: typePlan,
          subscription_status: statut, subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString(),
          modules_actifs: MODULES_PAR_PLAN[typePlan] || MODULES_PAR_PLAN['essai_gratuit']
        });
        etabId = etabRef.id;
      }

      await updateDoc(doc(db, 'demandes_acces', demandeId), { statut: 'valide', etablissement_id: etabId });
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'invitations'), { token: invitationToken, email: demande.email_contact, nom: demande.nom_contact, etablissement_id: etabId, role: 'client_admin', date_creation: new Date().toISOString(), expire: Date.now() + (72 * 60 * 60 * 1000) });
      const urlComplete = `${window.location.origin}/activation?token=${invitationToken}`;
      setLienActivation({ 
        url: urlComplete, 
        nom: demande.nom_etablissement, 
        email: demande.email_contact, 
        plan: typePlan, 
        nomGerant: demande.nom_contact,
        telephone: demande.telephone_contact 
      });
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
        modules_actifs: MODULES_PAR_PLAN[nouvelEtab.plan] || MODULES_PAR_PLAN['premium']
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
      setLienActivation({ url: urlComplete, nom: nouvelEtab.nom, email: nouvelEtab.email, plan: nouvelEtab.plan, nomGerant: nouvelEtab.contact || 'Gérant' });

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

  const prolongerAbonnementAction = async () => {
    if (!modalExtendSub) return;
    const toastId = toast.loading('Prolongation en cours...');
    try {
      const expirationActuelle = new Date(modalExtendSub.subscription_end_date).getTime();
      const nouvelleExpiration = new Date(expirationActuelle + joursProlongation * 24 * 60 * 60 * 1000).toISOString();
      
      await updateDoc(doc(db, 'etablissements', modalExtendSub.id), { 
        subscription_end_date: nouvelleExpiration,
        subscription_status: 'actif'
      });
      toast.success(`Abonnement prolongé de ${joursProlongation} jours !`, { id: toastId });
      setModalExtendSub(null);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const resetPasswordAction = async () => {
    if (!modalResetPassword) return;
    const email = modalResetPassword.email_contact;
    
    if (!email) {
      return toast.error("Adresse email de contact manquante pour cet établissement.");
    }

    const toastId = toast.loading('Envoi du lien de réinitialisation...');
    try {
      // Utilisation de la fonction du store qui appelle Firebase sendPasswordResetEmail
      await reinitialiserMotDePasse(email);
      
      toast.success(`Un lien de réinitialisation sécurisé a été envoyé à : ${email}`, { id: toastId });
      setModalResetPassword(null);
    } catch (err: any) {
      console.error("Erreur reset password:", err);
      if (err.code === 'auth/user-not-found') {
        toast.error("Aucun compte actif trouvé pour cet email. Le client doit d'abord activer son accès via le lien d'invitation.", { id: toastId });
      } else {
        toast.error(`Échec de l'envoi : ${err.message}`, { id: toastId });
      }
    }
  };

  const sauvegarderModules = async () => {
    if (!modalModules) return;
    const toastId = toast.loading('Sauvegarde des modules...');
    try {
      await updateDoc(doc(db, 'etablissements', modalModules.id), {
        modules_actifs: modulesActifs
      });
      toast.success('Modules mis à jour avec succès', { id: toastId });
      setModalModules(null);
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

  const supprimerEtablissement = async (etab: any) => {
    if (!window.confirm(`⚠️ ATTENTION : Supprimer définitivement ${etab.nom} ? Cette action est irréversible.`)) return;
    const toastId = toast.loading('Suppression de l\'établissement...');
    try {
      await deleteDoc(doc(db, 'etablissements', etab.id));
      toast.success(`${etab.nom} a été supprimé définitivement.`, { id: toastId });
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`, { id: toastId });
    }
  };

  const supprimerPaiement = async (id: string) => {
    if (!window.confirm("Supprimer cet historique de paiement ?")) return;
    const toastId = toast.loading('Suppression...');
    try {
      await deleteDoc(doc(db, 'paiements', id));
      toast.success("Paiement supprimé", { id: toastId });
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`, { id: toastId });
    }
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
    { key: 'messages', icon: <MessageSquare size={20} />, label: "Messages", badge: messagesContact.filter(m => m.statut === 'nouveau').length },
    { key: 'etablissements', icon: <Building2 size={20} />, label: "Établissements", badge: etablissements.length },
    { key: 'paiements', icon: <CreditCard size={20} />, label: "Paiements & Abonnements", badge: paiements.filter(p => p.statut === 'en_attente').length },
    { key: 'comptabilite', icon: <TrendingUp size={20} />, label: "Comptabilité Clients" },
    { key: 'separateur1', type: 'separator', label: 'Securits Tech' },
    { key: 'rh_interne', icon: <Users size={20} />, label: "Équipe Securits" },
    { key: 'finance_interne', icon: <Landmark size={20} />, label: "Finance Interne" },
    { key: 'support', icon: <AlertCircle size={20} />, label: "Tickets & Bugs" },
    { key: 'caisse', icon: <Landmark size={20} />, label: "Caisse Physique (Bureau)" },
    { key: 'separateur2', type: 'separator', label: 'Système' },
    { key: 'laboratoire', icon: <Tablet size={20} />, label: "Lab de Simulation (Tablette)" },
    { key: 'maintenance', icon: <Database size={20} />, label: "Maintenance", danger: true },
  ];

  const renderVueRHInterne = () => (
    <div className="p-10 md:p-16 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter">Équipe Securits Tech</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestion interne du personnel</p>
        </div>
        <button className="h-14 bg-[#1E3A8A] text-white px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-3">
          <Users size={16} /> Ajouter un collaborateur
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Collaborateur</th>
              <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rôle</th>
              <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statut</th>
              <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {equipeInterne.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Aucun collaborateur enregistré</td>
              </tr>
            ) : (
              equipeInterne.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1E3A8A] font-black">{emp.prenom?.[0] || emp.nom?.[0]}</div>
                      <div>
                        <p className="font-black text-slate-700 uppercase text-xs">{emp.nom} {emp.prenom}</p>
                        <p className="text-[10px] font-bold text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-xs font-black text-[#1E3A8A] uppercase">{emp.poste || emp.role}</td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Actif</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-[#1E3A8A] transition-colors"><Settings size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVueFinanceInterne = () => (
    <div className="p-10 md:p-16 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter">Finance Securits Tech</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Chiffre d'affaires et santé financière</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chiffre d'Affaires Global</p>
          <p className="text-4xl font-black text-[#1E3A8A] tracking-tighter">{paiements.filter(p => p.statut === 'valide').reduce((acc, p) => acc + (p.montant || 0), 0).toLocaleString()} <span className="text-sm opacity-30">XAF</span></p>
        </div>
        <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">MRR (Revenu Récurrent)</p>
          <p className="text-4xl font-black text-[#FF7A00] tracking-tighter">{mrrReel.toLocaleString()} <span className="text-sm opacity-30">XAF</span></p>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clients Payants</p>
          <p className="text-4xl font-black text-slate-700 tracking-tighter">{etablissements.filter(e => e.subscription_status === 'actif').length}</p>
        </div>
      </div>
    </div>
  );

  const renderVueSupport = () => (
    <div className="p-10 md:p-16 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter">Tickets & Bugs</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Centre d'intervention client</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
             <AlertTriangle size={16} /> 0 Urgences
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {ticketsSupport.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black uppercase tracking-widest">Aucun ticket ouvert</p>
          </div>
        ) : (
          ticketsSupport.map(ticket => (
            <div key={ticket.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${ticket.priorite === 'critique' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                    <div>
                      <p className="font-bold text-slate-700">{ticket.sujet}</p>
                      <p className="text-xs text-slate-400">{ticket.client_nom}</p>
                    </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-bold text-slate-500 capitalize">{ticket.statut || 'En attente'}</p>
                   <p className="text-[10px] text-slate-400">{ticket.date_creation?.toDate().toLocaleDateString()}</p>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderVueCaisse = () => {
    const enregistrerEncaissement = async () => {
      if (!selectedEtabCaisse || montantCaisse <= 0) return toast.error("Sélectionnez un établissement et un montant valide");
      setSendingCaisse(true);
      try {
        await addDoc(collection(db, 'paiements'), {
          etablissement_id: selectedEtabCaisse.id,
          nom_etablissement: selectedEtabCaisse.nom,
          montant: montantCaisse,
          date: new Date().toISOString(),
          date_validation: new Date().toISOString(),
          statut: 'valide',
          methode: 'especes_bureau',
          motif: motifCaisse,
          plan_id: selectedEtabCaisse.subscription_plan || 'premium',
          source: 'super_admin_caisse'
        });

        const expirationActuelle = selectedEtabCaisse.subscription_end_date ? new Date(selectedEtabCaisse.subscription_end_date).getTime() : Date.now();
        const nouvelleExpiration = new Date(Math.max(expirationActuelle, Date.now()) + dureeCaisse * 24 * 60 * 60 * 1000).toISOString();
        
        await updateDoc(doc(db, 'etablissements', selectedEtabCaisse.id), {
          subscription_end_date: nouvelleExpiration,
          subscription_status: 'actif'
        });

        toast.success(`Encaissement de ${montantCaisse} XAF enregistré`);
        setMontantCaisse(0); setSelectedEtabCaisse(null);
      } catch (err: any) { toast.error(err.message); }
      finally { setSendingCaisse(false); }
    };

    return (
      <div className="p-10 md:p-16 space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter">Caisse Bureau</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Encaissement manuel</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Établissement</label>
              <select value={selectedEtabCaisse?.id || ''} onChange={(e) => setSelectedEtabCaisse(etablissements.find(et => et.id === e.target.value))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm">
                <option value="">Sélectionner...</option>
                {etablissements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Montant (XAF)</label>
                <input type="number" value={montantCaisse} onChange={e => setMontantCaisse(Number(e.target.value))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-[#FF7A00] text-xl" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Durée (Jours)</label>
                <select value={dureeCaisse} onChange={e => setDureeCaisse(Number(e.target.value))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm">
                  <option value={30}>30 Jours</option>
                  <option value={90}>90 Jours</option>
                  <option value={365}>1 An</option>
                </select>
              </div>
            </div>
            <button onClick={enregistrerEncaissement} disabled={sendingCaisse || !selectedEtabCaisse || montantCaisse <= 0} className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all disabled:opacity-40 flex items-center justify-center gap-4">
              {sendingCaisse ? <Loader2 className="animate-spin" /> : <Landmark size={24} />} Valider l'encaissement
            </button>
          </div>
          <div className="bg-[#FF7A00] p-10 rounded-[3rem] text-white shadow-2xl shadow-orange-900/20 h-fit">
            <h4 className="font-black uppercase tracking-widest text-xs mb-4 opacity-60">Détails de l'abonnement</h4>
            {selectedEtabCaisse ? (
              <div className="space-y-4">
                <p className="text-2xl font-black">{selectedEtabCaisse.nom}</p>
                <p className="text-sm font-bold opacity-80">Expire le : {selectedEtabCaisse.subscription_end_date ? new Date(selectedEtabCaisse.subscription_end_date).toLocaleDateString() : 'Jamais'}</p>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-bold opacity-60 uppercase">Nouvelle Expiration</p>
                  <p className="text-2xl font-black">{new Date(Math.max(selectedEtabCaisse.subscription_end_date ? new Date(selectedEtabCaisse.subscription_end_date).getTime() : Date.now(), Date.now()) + dureeCaisse * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            ) : <p className="font-bold italic opacity-60 text-sm">Sélectionnez un établissement.</p>}
          </div>
        </div>
      </div>
    );
  };

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
          {navItems.map((item) => {
            if (item.type === 'separator') {
              return (
                <div key={item.key} className="pt-6 pb-2">
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            return (
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
            );
          })}
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
              {onglet === 'laboratoire' && 'Laboratoire de Simulation'}
              {onglet === 'caisse' && 'Caisse Physique (Bureau)'}
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
          {onglet === 'caisse' && renderVueCaisse()}
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
                        <div key={p.id} className="bg-white rounded-[2rem] border border-slate-50 p-8 flex flex-col gap-6 hover:border-orange-100 transition-all group shadow-sm hover:shadow-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-[#FF7A00]/10 group-hover:bg-[#FF7A00] transition-colors" />
                          
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-8 flex-1">
                                <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-black text-xs text-slate-400 shadow-inner border border-slate-100 group-hover:bg-orange-50 transition-colors uppercase">
                                    {p.methode?.slice(0, 4) || 'VIRE'}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-1">
                                      {p.etablissement_id ? nomEtab(p.etablissement_id) : 'Souscription Directe'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-[#FF7A00] mb-3 uppercase tracking-widest">{p.email}</p>
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
                                        <button 
                                          onClick={() => supprimerPaiement(p.id)} 
                                          className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                                          title="Supprimer le paiement"
                                        >
                                          <Trash2 size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>
                          </div>

                          {p.message && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                               <p className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest mb-2">Message du client :</p>
                               <p className="text-sm font-medium text-slate-500 italic leading-relaxed">"{p.message}"</p>
                            </div>
                          )}
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
                    const expiration = etab.subscription_end_date ? new Date(etab.subscription_end_date) : new Date();
                    const joursRestants = etab.subscription_end_date ? Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                    const expire = etab.subscription_end_date ? joursRestants <= 0 : false;
                    return (
                      <div key={etab.id} className="bg-white rounded-[2rem] border border-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-emerald-100 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:bg-emerald-50 transition-colors uppercase font-black text-slate-200">
                              {etab.nom?.[0] || 'E'}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-3">{etab.nom}</h3>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg tracking-widest uppercase border border-slate-200">{etab.contact_principal}</span>
                                  {etab.contact_principal && (
                                    <a 
                                      href={`https://wa.me/${etab.contact_principal.replace(/\s/g, '').replace(/\+/g, '')}`} 
                                      target="_blank" 
                                      className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                      title="Contacter via WhatsApp"
                                    >
                                      <MessageSquare size={12} />
                                    </a>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold bg-blue-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg tracking-widest uppercase border border-blue-100">{etab.subscription_plan}</span>
                                <BadgeStatut statut={etab.subscription_status || etab.statut} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10 w-full md:w-auto">
                           <div className="text-right">
                              <p className={`text-xl font-black tracking-tight ${expire ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>{expiration.toLocaleDateString()}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Échéance</p>
                           </div>

                           <div className="flex gap-2">
                               {etab.statut === 'en_attente_validation' || etab.subscription_status === 'en_attente_validation' ? (
                                  <button onClick={async () => {
                                      const toastId = toast.loading('Validation...');
                                      try {
                                        await updateDoc(doc(db, 'etablissements', etab.id), {
                                          statut: 'actif',
                                          subscription_status: 'actif',
                                          subscription_end_date: etab.subscription_end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                                          modules_actifs: etab.modules_actifs?.length ? etab.modules_actifs : ['pos', 'stock', 'hr', 'compta', 'kds', 'analytics']
                                        });
                                        toast.success("Établissement validé !", { id: toastId });
                                      } catch (err: any) {
                                        toast.error(err.message, { id: toastId });
                                      }
                                  }} className="h-16 px-6 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-xs uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20" title="Valider le compte">
                                    <CheckCircle size={20} className="mr-2" /> Valider
                                  </button>
                               ) : etab.subscription_status === 'suspendu' || expire ? (
                                 <button onClick={() => reactiverEtablissement(etab.id)} className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center hover:bg-[#1E3A8A] hover:text-white transition-all shadow-inner" title="Réactiver"><Zap size={24} /></button>
                               ) : (
                                 <button onClick={() => suspendreEtablissement(etab)} className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner" title="Suspendre"><Ban size={24} /></button>
                               )}
                               <button onClick={() => {
                                  setModalModules(etab);
                                  setModulesActifs(etab.modules_actifs || ['pos', 'stock', 'hr', 'compta']);
                               }} className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-inner" title="Gérer les Modules"><LayoutDashboard size={24} /></button>
                               <button onClick={() => setModalResetPassword(etab)} className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center hover:bg-[#1E3A8A] hover:text-white transition-all shadow-inner" title="Réinitialiser Mot de Passe"><Key size={24} /></button>
                              <button onClick={() => setModalExtendSub(etab)} className="w-16 h-16 bg-orange-50 text-[#FF7A00] rounded-2xl flex items-center justify-center hover:bg-[#FF7A00] hover:text-white transition-all shadow-inner" title="Prolonger Abonnement"><Calendar size={24} /></button>
                               <button 
                                  onClick={() => supprimerEtablissement(etab)} 
                                  className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                                  title="Supprimer définitivement l'établissement"
                                >
                                  <Trash2 size={24} />
                               </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* ── MESSAGES CONTACT ── */}
          {onglet === 'messages' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-4">
                {messagesContact.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Aucun message pour le moment</p>
                  </div>
                ) : (
                  messagesContact.map((msg) => (
                    <div key={msg.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-[#1E3A8A] uppercase">{msg.nom}</h4>
                            <p className="text-xs font-bold text-slate-400">{msg.contact}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Date d'envoi</span>
                          <p className="text-xs font-bold text-slate-500">{msg.date?.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                        <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line">{msg.message}</p>
                      </div>
                      <div className="flex gap-4">
                        <a href={`mailto:${msg.contact}`} className="px-6 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#1E3A8A] hover:text-white transition-all">
                          Répondre par Email <Mail size={16} />
                        </a>
                        <button 
                          onClick={async () => {
                            if(window.confirm("Supprimer ce message ?")) {
                              await deleteDoc(doc(db, 'messages_contact', msg.id));
                              toast.success("Message supprimé");
                            }
                          }}
                          className="px-6 h-12 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          Supprimer <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={async () => {
                        if(window.confirm("Cette action va vider le cache local et rafraîchir la page. Cela résout souvent les problèmes de 'moulinage'. Continuer ?")) {
                          await clearFirestoreCache();
                        }
                      }}
                      className="h-20 bg-[#1E3A8A] text-white rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/20 flex items-center gap-4 active:scale-95"
                    >
                      <Zap size={20} /> Réparer la Connectivité (Cache)
                    </button>

                    <button 
                      onClick={viderBase}
                      className="h-20 bg-rose-600 text-white rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/20 flex items-center gap-4 active:scale-95"
                    >
                      <Trash2 size={20} /> Réinitialiser la Plateforme
                    </button>
                  </div>
               </div>
            </div>
          )}

          {onglet === 'laboratoire' && <SimulateurTablette />}
          {onglet === 'rh_interne' && renderVueRHInterne()}
          {onglet === 'finance_interne' && renderVueFinanceInterne()}
          {onglet === 'support' && renderVueSupport()}
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
                  <p className="text-sm font-bold text-blue-400 mt-1 uppercase tracking-widest">{modalApprobation.demande.email_contact || "⚠️ Email manquant"}</p>
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

      {modalResetPassword && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div onClick={() => setModalResetPassword(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-lg p-12 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500 text-center">
               <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mx-auto mb-8">
                  <Key size={40} />
               </div>
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Réinitialiser le mot de passe</h3>
               <p className="text-slate-500 font-medium mb-8">Voulez-vous envoyer un lien de réinitialisation à <span className="font-bold">{modalResetPassword.email_contact}</span> ?</p>
               <div className="flex gap-4">
                  <button onClick={() => setModalResetPassword(null)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Annuler</button>
                  <button onClick={resetPasswordAction} className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 hover:bg-blue-800 transition-all">Envoyer le lien</button>
               </div>
            </div>
         </div>
      )}

      {modalExtendSub && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div onClick={() => setModalExtendSub(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-lg p-12 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500">
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-8">Prolonger l'abonnement</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Durée de prolongation</label>
                    <select value={joursProlongation} onChange={e => setJoursProlongation(Number(e.target.value))}
                      className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100">
                      <option value={7}>1 Semaine (Gratuit)</option>
                      <option value={30}>1 Mois</option>
                      <option value={90}>3 Mois</option>
                      <option value={365}>1 An</option>
                    </select>
                  </div>
                  <button onClick={prolongerAbonnementAction} className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all mt-4">
                    Confirmer la prolongation
                  </button>
                  <button onClick={() => setModalExtendSub(null)} className="w-full h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Annuler</button>
               </div>
            </div>
         </div>
      )}

      {modalModules && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div onClick={() => setModalModules(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
            <div className="bg-white w-full max-w-2xl p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500">
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Modules Actifs</h3>
               <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">{modalModules.nom}</p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { id: 'pos', nom: 'Point de Vente (Caisse/Serveurs)' },
                    { id: 'stock', nom: 'Gestion des Stocks' },
                    { id: 'hr', nom: 'Ressources Humaines (Paie)' },
                    { id: 'compta', nom: 'Comptabilité & Finances' },
                    { id: 'kds', nom: 'Cuisine / Bar (KDS)' },
                    { id: 'analytics', nom: 'Statistiques Avancées' }
                  ].map(mod => (
                    <label key={mod.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={modulesActifs.includes(mod.id)}
                        onChange={(e) => {
                          if (e.target.checked) setModulesActifs([...modulesActifs, mod.id]);
                          else setModulesActifs(modulesActifs.filter(id => id !== mod.id));
                        }}
                        className="w-6 h-6 text-[#1E3A8A] rounded-lg focus:ring-[#1E3A8A]"
                      />
                      <span className="font-bold text-slate-700 text-sm">{mod.nom}</span>
                    </label>
                  ))}
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setModalModules(null)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Annuler</button>
                  <button onClick={sauvegarderModules} className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 hover:bg-blue-800 transition-all">Sauvegarder les modules</button>
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
               
               <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 mb-8 font-mono text-sm text-[#1E3A8A] break-all select-all flex items-center justify-center shadow-inner">
                  {lienActivation.url}
               </div>

               {lienActivation.plan && (
                 <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 mb-8 text-left">
                   <p className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest mb-3">Modules activés ({DESCRIPTIONS_PLAN[lienActivation.plan] || lienActivation.plan})</p>
                   <div className="space-y-1">
                     {(MODULES_PAR_PLAN[lienActivation.plan] || []).map(m => (
                       <p key={m} className="text-sm font-bold text-slate-700">{NOMS_MODULES[m]}</p>
                     ))}
                     {['pos','stock','hr','compta','kds','analytics'].filter(m => !(MODULES_PAR_PLAN[lienActivation.plan] || []).includes(m)).map(m => (
                       <p key={m} className="text-sm font-bold text-slate-300">❌ {NOMS_MODULES[m]?.replace('✅','')}</p>
                     ))}
                   </div>
                 </div>
               )}

               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setLienActivation(null)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Fermer</button>
                  <button onClick={() => { navigator.clipboard.writeText(lienActivation.url); toast.success("Lien copié"); }} className="flex-1 h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 hover:bg-blue-800 flex items-center justify-center gap-3 transition-all active:scale-95">
                    <Copy size={18} /> Copier le lien
                  </button>
                  {lienActivation.email && (
                    <button onClick={() => {
                      const modules = (MODULES_PAR_PLAN[lienActivation.plan!] || []).map(m => `• ${NOMS_MODULES[m]?.replace('✅ ','')}`).join('%0A');
                      const inactifs = ['pos','stock','hr','compta','kds','analytics'].filter(m => !(MODULES_PAR_PLAN[lienActivation.plan!]||[]).includes(m)).map(m => `• ${NOMS_MODULES[m]?.replace('✅ ','') || m} (non inclus)`).join('%0A');
                      const sujet = encodeURIComponent(`Votre accès GestCave Pro — ${lienActivation.nom}`);
                      const corps = encodeURIComponent(`Bonjour ${lienActivation.nomGerant || ''},

Votre compte GestCave Pro pour l'établissement "${lienActivation.nom}" a été créé avec succès.

═══════════════════════════════
  VOTRE FORMULE : ${(DESCRIPTIONS_PLAN[lienActivation.plan!] || lienActivation.plan || '').toUpperCase()}
═══════════════════════════════

MODULES INCLUS DANS VOTRE FORMULE :
`) + modules + encodeURIComponent(`

MODULES NON INCLUS (disponibles sur une formule supérieure) :
`) + inactifs + encodeURIComponent(`

POUR ACTIVER VOTRE COMPTE, CLIQUEZ SUR CE LIEN :
${lienActivation.url}

⚠️ Ce lien est valable 72 heures. Si vous ne l'activez pas dans ce délai, contactez notre support.

Pour toute question : support@gestcave.pro

L'équipe GestCave Pro`);
                      window.open(`mailto:${lienActivation.email}?subject=${sujet}&body=${corps}`, '_blank');
                    }} className="flex-1 h-16 bg-slate-100 text-[#1E3A8A] rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-50 flex items-center justify-center gap-3 transition-all active:scale-95">
                      <Mail size={18} /> Email
                    </button>
                  )}
                  {lienActivation.telephone && (
                    <button onClick={() => {
                      const text = encodeURIComponent(`*GESTCAVE PRO — ACTIVATION*%0A%0ABonjour ${lienActivation.nomGerant || ''},%0A%0AVotre compte pour *${lienActivation.nom}* est prêt.%0A%0ACliquez ici pour activer votre accès :%0A${lienActivation.url}%0A%0A_L'équipe Securits Tech_`);
                      window.open(`https://wa.me/${lienActivation.telephone.replace(/\s/g, '').replace(/\+/g, '')}?text=${text}`, '_blank');
                    }} className="flex-1 h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 flex items-center justify-center gap-3 transition-all active:scale-95">
                      <MessageSquare size={18} /> WhatsApp
                    </button>
                  )}
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
  if (s === 'en_attente' || s === 'en_attente_validation') return <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 shadow-sm animate-pulse">À Valider</span>;
  if (s === 'refuse' || s === 'rejete' || s === 'suspendu') return <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">Bloqué</span>;
  if (s === 'essai') return <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 shadow-sm">Essai</span>;
  return <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">{statut}</span>;
};

export default TableauSuperAdmin;
