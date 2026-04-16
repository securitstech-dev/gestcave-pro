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
  role: 'serveur' | 'caissier' | 'cuisine' | 'admin' | 'support';
  pin: string;
  salaire: number;
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
  const [nouveauRole, setNouveauRole] = useState<'serveur' | 'caissier' | 'cuisine' | 'admin' | 'support'>('serveur');
  const [nouveauSalaire, setNouveauSalaire] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [montantAvance, setMontantAvance] = useState(0);
  const [motifAvance, setMotivAvance] = useState('');
  const [showAvanceModal, setShowAvanceModal] = useState(false);

  useEffect(() => {
    if (!profil?.etablissement_id) return;

    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      setEmployes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[]);
      setLoading(false);
    });

    const debutMois = new Date();
    debutMois.setDate(1); debutMois.setHours(0,0,0,0);

    const qAvances = query(
      collection(db, 'avances'), 
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubAvances = onSnapshot(qAvances, (snapshot) => {
      setAvances(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Avance[]);
    });

    return () => { unsubEmp(); unsubAvances(); };
  }, [profil?.etablissement_id]);

  const genererPIN = () => Math.floor(1000 + Math.random() * 9000).toString();

  const ajouterEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employes'), {
        nom: nouveauNom, role: nouveauRole, pin: genererPIN(), salaire: Number(nouveauSalaire),
        actif: true, etablissement_id: profil.etablissement_id, dateCreation: new Date().toISOString()
      });
      toast.success(`${nouveauNom} recruté !`);
      setNouveauNom(''); setNouveauSalaire(0); setShowModal(false);
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
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ressources Humaines</h2>
          <p className="text-slate-500 font-medium mt-1">Supervisez votre personnel et gérez la trésorerie salariale.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
          <UserPlus size={18} /> Recruter un employé
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Effectif" valeur={employes.length} subtext="Contrats actifs" color="slate" />
          <StatCard label="Masse Brut" valeur={`${masseSalariale.toLocaleString()}`} suffix="F" subtext="Total salaires" color="slate" />
          <StatCard label="Avances" valeur={`${totalAvancesMois.toLocaleString()}`} suffix="F" subtext="Déboursés ce mois" color="slate" />
          <StatCard label="Net mensuel" valeur={`${(masseSalariale - totalAvancesMois).toLocaleString()}`} suffix="F" subtext="Restant à payer" color="slate" />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 flex gap-6 items-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 outline outline-4 outline-blue-50/50">
              <ShieldCheck size={28} />
          </div>
          <div>
              <p className="font-bold text-slate-900 text-lg">Sécurité et Accès Tablettes</p>
              <p className="text-slate-500 text-sm">Chaque employé utilise son <span className="font-bold text-slate-900 italic underline">PIN unique</span> pour se connecter sur les tablettes de service.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employes.map((emp) => {
              const totalAvances = avances.filter(a => a.employe_id === emp.id).reduce((acc, curr) => acc + curr.montant, 0);
              return (
              <motion.div layout key={emp.id}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-slate-300 transition-all relative shadow-sm group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl border border-slate-100 shadow-inner">
                    {emp.role === 'caissier' ? '💰' : emp.role === 'cuisine' ? '👨‍🍳' : emp.role === 'admin' ? '🛡️' : '🤵'}
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase bg-slate-900 text-white">
                    {emp.role}
                  </span>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-slate-900 text-xl">{emp.nom}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                        PIN: <span className="text-slate-900 font-mono tracking-widest">{emp.pin}</span>
                        <button onClick={() => copierPIN(emp.pin, emp.nom)} className="p-1 hover:text-slate-900 transition-colors"><Copy size={12} /></button>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>Brut</span>
                    <span className="text-slate-900 font-bold">{emp.salaire?.toLocaleString()} F</span>
                  </div>
                  {totalAvances > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500 italic">
                      <span>Avances</span>
                      <span>-{totalAvances.toLocaleString()} F</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 font-black uppercase">Solde Net</span>
                    <span className="text-slate-900 font-black text-lg">{(emp.salaire - totalAvances).toLocaleString()} F</span>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={() => { setSelectedEmploye(emp); setShowAvanceModal(true); }}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all"
                    >
                      Verser Avance
                    </button>
                    <button onClick={() => supprimerEmploye(emp.id, emp.nom)} className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                       <Trash2 size={16} />
                    </button>
                </div>
              </motion.div>
            )})}
      </div>

      <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900"><X size={24} /></button>
                <div className="mb-10 text-center">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Embauche</h3>
                    <p className="text-slate-500 font-medium">Enregistrez un nouvel accès employé.</p>
                </div>
                <form onSubmit={ajouterEmploye} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nom complet</label>
                    <input type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} required placeholder="Prénom Nom"
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-slate-900 transition-all font-bold text-slate-900" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Rôle affecté</label>
                    <select value={nouveauRole} onChange={(e) => setNouveauRole(e.target.value as any)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 outline-none font-bold text-slate-900">
                        <option value="serveur">🤵 Serveur</option>
                        <option value="caissier">💰 Caissier</option>
                        <option value="cuisine">👨‍🍳 Cuisine / Barman</option>
                        <option value="admin">🛡️ Responsable / Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Salaire (F CFA)</label>
                    <input type="number" value={nouveauSalaire} onChange={(e) => setNouveauSalaire(Number(e.target.value))} required
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-emerald-600" />
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all mt-4">
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
