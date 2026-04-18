import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Key, Trash2, RefreshCw, 
  Copy, Info, ShieldCheck, Wallet, 
  Briefcase, Activity, X, ChevronRight, Check
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import StatCard from '../../components/ui/StatCard';

interface Employe {
  id: string;
  nom: string;
  role: 'serveur' | 'caissier' | 'cuisine' | 'gerant' | 'livreur' | 'securite' | 'admin';
  pin: string;
  salaire: number; // Valeur de base (selon type)
  typeSalaire: 'mensuel' | 'horaire' | 'journalier';
  primes?: {
    transport: number;
    logement: number;
    autres: number;
  };
  nbEnfants?: number;
  actif: boolean;
}

interface Avance {
  id: string;
  employe_id: string;
  montant: number;
  date: string;
  motif: string;
}

const GestionEmployes = () => {
  const { profil } = useAuthStore();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauRole, setNouveauRole] = useState<'serveur' | 'caissier' | 'cuisine' | 'gerant' | 'livreur' | 'securite' | 'admin'>('serveur');
  const [typeSalaire, setTypeSalaire] = useState<'mensuel' | 'horaire' | 'journalier'>('mensuel');
  const [nouveauSalaire, setNouveauSalaire] = useState(0);
  const [primeTransport, setPrimeTransport] = useState(0);
  const [primeLogement, setPrimeLogement] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [montantAvance, setMontantAvance] = useState(0);
  const [motifAvance, setMotivAvance] = useState('');
  const [showAvanceModal, setShowAvanceModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPayerModal, setShowPayerModal] = useState(false);

  useEffect(() => {
    if (!profil?.etablissement_id) return;

    // Fetch transactions pour commissions
    const debutMois = new Date();
    debutMois.setDate(1); debutMois.setHours(0,0,0,0);

    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      setEmployes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[]);
      setLoading(false);
    });

    const qAvances = query(
      collection(db, 'avances'), 
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubAvances = onSnapshot(qAvances, (snapshot) => {
      setAvances(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Avance[]);
    });

    return () => { unsubEmp(); unsubAvances(); unsubTrans(); };
  }, [profil?.etablissement_id]);

  const genererPIN = () => Math.floor(1000 + Math.random() * 9000).toString();

  const ajouterEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employes'), {
        nom: nouveauNom, 
        role: nouveauRole, 
        pin: genererPIN(), 
        salaire: Number(nouveauSalaire),
        typeSalaire,
        primes: {
          transport: Number(primeTransport),
          logement: Number(primeLogement),
          autres: 0
        },
        actif: true, 
        etablissement_id: profil.etablissement_id, 
        dateCreation: new Date().toISOString()
      });
      toast.success(`${nouveauNom} recruté !`);
      setNouveauNom(''); setNouveauSalaire(0); setPrimeTransport(0); setPrimeLogement(0); setShowModal(false);
    } catch {
      toast.error("Échec du recrutement");
    }
  };

  const enregistrerAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmploye || montantAvance <= 0) return;
    try {
      await addDoc(collection(db, 'avances'), {
        employe_id: selectedEmploye.id, employe_nom: selectedEmploye.nom,
        montant: Number(montantAvance), motif: motifAvance,
        date: new Date().toISOString(), etablissement_id: profil.etablissement_id
      });
      toast.success(`Avance enregistrée pour ${selectedEmploye.nom}`);
      setMontantAvance(0); setMotivAvance(''); setShowAvanceModal(false);
    } catch {
      toast.error("Erreur avance");
    }
  };

  const enregistrerPaiement = async (emp: Employe, montant: number) => {
    if (!window.confirm(`Confirmer le paiement du solde de ${montant.toLocaleString()} F à ${emp.nom} ?`)) return;
    
    try {
      await addDoc(collection(db, 'paiements_salaires'), {
        employe_id: emp.id,
        employe_nom: emp.nom,
        montant: Number(montant),
        date: new Date().toISOString(),
        etablissement_id: profil.etablissement_id,
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear()
      });
      toast.success(`Salaire soldé pour ${emp.nom}`);
    } catch {
      toast.error("Erreur lors du paiement");
    }
  };

  const supprimerEmploye = async (id: string, nom: string) => {
    if (window.confirm(`Supprimer l'accès de ${nom} ?`)) {
      try {
        await deleteDoc(doc(db, 'employes', id));
        toast.success("Accès révoqué");
      } catch { toast.error("Échec"); }
    }
  };

  const copierPIN = (pin: string, nom: string) => {
    navigator.clipboard.writeText(pin);
    toast.success(`PIN de ${nom} copié !`);
  };

  const masseSalariale = employes.reduce((acc, curr) => acc + (curr.salaire || 0), 0);
  const totalAvancesMois = avances.reduce((acc, curr) => acc + (curr.montant || 0), 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Personnel</h2>
          <p className="text-slate-500 font-medium text-[8px] mt-0.5">Supervisez votre personnel et gérez la trésorerie salariale.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
          <UserPlus size={12} /> Recruter
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Effectif" valeur={employes.length} subtext="Contrats actifs" color="slate" />
          <StatCard label="Masse Brut" valeur={`${masseSalariale.toLocaleString()}`} suffix="F" subtext="Total salaires" color="slate" />
          <StatCard label="Avances" valeur={`${totalAvancesMois.toLocaleString()}`} suffix="F" subtext="Déboursés ce mois" color="slate" />
          <StatCard label="Net mensuel" valeur={`${(masseSalariale - totalAvancesMois).toLocaleString()}`} suffix="F" subtext="Restant à payer" color="slate" />
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-3 items-center shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck size={16} />
          </div>
          <div>
              <p className="font-bold text-slate-900 text-xs">Accès Tablettes</p>
              <p className="text-slate-500 text-[9px]">Chaque employé utilise son <span className="font-bold text-slate-900 italic underline">PIN unique</span>.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employes.map((emp) => {
              const totalAvances = avances.filter(a => a.employe_id === emp.id).reduce((acc, curr) => acc + curr.montant, 0);
              const ventesEmploye = transactions.filter(t => t.serveurId === emp.id).reduce((acc, t) => acc + (t.total || 0), 0);
              const commission = emp.role === 'serveur' ? Math.floor(ventesEmploye * 0.02) : 0; // 2% Commission
              const soldeNet = (emp.salaire || 0) + commission - totalAvances;

              return (
              <motion.div layout key={emp.id}
                className="bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all relative shadow-sm group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-md border border-slate-100 shadow-inner">
                    {emp.role === 'caissier' ? '💰' : 
                     emp.role === 'cuisine' ? '👨‍🍳' : 
                     emp.role === 'gerant' ? '💼' :
                     emp.role === 'livreur' ? '🛵' :
                     emp.role === 'securite' ? '👮' :
                     emp.role === 'admin' ? '🛡️' : '🤵'}
                  </div>
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md tracking-widest uppercase bg-slate-900 text-white">
                    {emp.role}
                  </span>
                </div>

                <div className="mb-3">
                    <h3 className="font-bold text-slate-900 text-sm">{emp.nom}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[7px] uppercase font-bold tracking-widest mt-0.5">
                        PIN: <span className="text-slate-900 font-mono tracking-widest">{emp.pin}</span>
                        <button onClick={() => copierPIN(emp.pin, emp.nom)} className="p-0.5 hover:text-slate-900 transition-colors"><Copy size={8} /></button>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-medium text-slate-50">
                    <span className="text-slate-400">Rémunération</span>
                    <span className="text-slate-900 font-bold">
                        {emp.salaire?.toLocaleString()} F 
                        <span className="text-[7px] text-slate-400 ml-1">
                            ({emp.typeSalaire === 'horaire' ? '/heure' : emp.typeSalaire === 'journalier' ? '/jour' : '/mois'})
                        </span>
                    </span>
                  </div>
                  
                  {(emp.primes?.transport || 0) + (emp.primes?.logement || 0) > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-medium text-emerald-600">
                        <span>Avantages Fixes</span>
                        <span>+{( (emp.primes?.transport || 0) + (emp.primes?.logement || 0) ).toLocaleString()} F</span>
                    </div>
                  )}

                  {commission > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-blue-600">
                      <span>Commissions (2%)</span>
                      <span>+{commission.toLocaleString()} F</span>
                    </div>
                  )}
                  {totalAvances > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-rose-500 italic">
                      <span>Avances à déduire</span>
                      <span>-{totalAvances.toLocaleString()} F</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                    <span className="text-[7px] text-slate-400 font-black uppercase">Estimation Solde</span>
                    <span className="text-slate-900 font-black text-xs">{soldeNet.toLocaleString()} F</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedEmploye(emp); setShowAvanceModal(true); }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[7px] font-bold uppercase tracking-widest text-slate-700 transition-all"
                        >
                          Avance
                        </button>
                        <button onClick={() => enregistrerPaiement(emp, soldeNet)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-[7px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-emerald-600/20"
                        >
                          Solder
                        </button>
                    </div>
                    <button onClick={() => supprimerEmploye(emp.id, emp.nom)} className="w-full py-1 bg-white border border-slate-200 rounded-lg text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center gap-1 text-[7px] font-bold uppercase tracking-widest">
                       <Trash2 size={10} /> Révoquer
                    </button>
                </div>
              </motion.div>
            )})}
      </div>

      <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><X size={18} /></button>
                <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Embauche</h3>
                    <p className="text-slate-500 font-medium text-[10px]">Enregistrez un nouvel accès employé.</p>
                </div>
                <form onSubmit={ajouterEmploye} className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Nom complet</label>
                    <input type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} required placeholder="Prénom Nom"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-bold text-slate-900 text-xs" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Rôle affecté</label>
                    <select value={nouveauRole} onChange={(e) => setNouveauRole(e.target.value as any)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 outline-none font-bold text-slate-900 text-xs">
                        <option value="serveur">🤵 Serveur</option>
                        <option value="caissier">💰 Caissier</option>
                        <option value="cuisine">👨‍🍳 Cuisine</option>
                        <option value="gerant">💼 Gérant</option>
                        <option value="livreur">🛵 Livreur</option>
                        <option value="securite">👮 Sécurité</option>
                        <option value="admin">🛡️ Admin</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Type de Paie</label>
                        <select value={typeSalaire} onChange={(e) => setTypeSalaire(e.target.value as any)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 outline-none font-bold text-slate-900 text-xs">
                            <option value="mensuel">Mensuel</option>
                            <option value="horaire">Horaire</option>
                            <option value="journalier">Journalier</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Base (F CFA)</label>
                        <input type="number" value={nouveauSalaire} onChange={(e) => setNouveauSalaire(Number(e.target.value))} required
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-emerald-600 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Transport</label>
                        <input type="number" value={primeTransport} onChange={(e) => setPrimeTransport(Number(e.target.value))}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-xs" />
                    </div>
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Logement</label>
                        <input type="number" value={primeLogement} onChange={(e) => setPrimeLogement(Number(e.target.value))}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-xs" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all mt-2">
                    Valider le recrutement
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {showAvanceModal && selectedEmploye && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl"
              >
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900">Décaisser Avance</h3>
                    <p className="text-slate-500 font-medium">Bénéficiaire : <strong className="text-slate-900">{selectedEmploye.nom}</strong></p>
                </div>
                <form onSubmit={enregistrerAvance} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Montant de l'avance (F CFA)</label>
                    <input type="number" value={montantAvance} onChange={(e) => setMontantAvance(Number(e.target.value))} required autoFocus
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-black text-slate-900 text-xl" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Justificatif rapide</label>
                    <input type="text" value={motifAvance} onChange={(e) => setMotivAvance(e.target.value)} placeholder="Urgent, loyer, etc."
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-600" />
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all">
                    Enregistrer l'avance
                  </button>
                  <button type="button" onClick={() => setShowAvanceModal(false)} className="w-full py-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Abandonner</button>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default GestionEmployes;
