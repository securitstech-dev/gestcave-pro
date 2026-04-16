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
  
  // Formulaire Employé
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauRole, setNouveauRole] = useState<'serveur' | 'caissier' | 'cuisine' | 'admin' | 'support'>('serveur');
  const [nouveauSalaire, setNouveauSalaire] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Formulaire Avance
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [montantAvance, setMontantAvance] = useState(0);
  const [motifAvance, setMotivAvance] = useState('');
  const [showAvanceModal, setShowAvanceModal] = useState(false);

  useEffect(() => {
    if (!profil?.etablissement_id) return;

    // Charger les employés
    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[];
      setEmployes(docs);
      setLoading(false);
    });

    // Charger les avances du mois en cours
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0,0,0,0);

    const qAvances = query(
      collection(db, 'avances'), 
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubAvances = onSnapshot(qAvances, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Avance[];
      setAvances(docs);
    });

    return () => {
      unsubEmp();
      unsubAvances();
    };
  }, [profil?.etablissement_id]);

  const genererPIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const ajouterEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauNom) return;

    const toastId = toast.loading("Création de l'accès employé...");

    try {
      await addDoc(collection(db, 'employes'), {
        nom: nouveauNom,
        role: nouveauRole,
        pin: genererPIN(),
        salaire: Number(nouveauSalaire),
        actif: true,
        etablissement_id: profil.etablissement_id,
        dateCreation: new Date().toISOString()
      });
      toast.success(`${nouveauNom} fait maintenant partie de l'équipe !`, { id: toastId, icon: '🎉' });
      setNouveauNom('');
      setNouveauSalaire(0);
      setShowModal(false);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message || "Impossible d'ajouter"}`, { id: toastId });
    }
  };

  const enregistrerAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmploye || montantAvance <= 0) return;

    const toastId = toast.loading("Enregistrement de l'avance...");

    try {
      await addDoc(collection(db, 'avances'), {
        employe_id: selectedEmploye.id,
        employe_nom: selectedEmploye.nom,
        montant: Number(montantAvance),
        motif: motifAvance,
        date: new Date().toISOString(),
        etablissement_id: profil.etablissement_id
      });
      
      toast.success(`Avance de ${montantAvance} F enregistrée pour ${selectedEmploye.nom}`, { id: toastId, icon: '💸' });
      setMontantAvance(0);
      setMotivAvance('');
      setShowAvanceModal(false);
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement", { id: toastId });
    }
  };

  const supprimerEmploye = async (id: string, nom: string) => {
    if (window.confirm(`Supprimer définitivement l'accès de ${nom} ?`)) {
      try {
        await deleteDoc(doc(db, 'employes', id));
        toast.success("Compte employé révoqué");
      } catch (error) {
        toast.error("Erreur de suppression");
      }
    }
  };

  const changerPIN = async (id: string, nom: string) => {
    const nouveauPIN = genererPIN();
    try {
      await updateDoc(doc(db, 'employes', id), { pin: nouveauPIN });
      toast.success(`Le nouveau PIN de ${nom} est ${nouveauPIN}`, { duration: 5000, icon: '🔐' });
    } catch (error) {
      toast.error("Erreur de régénération");
    }
  };

  const copierPIN = (pin: string, nom: string) => {
    navigator.clipboard.writeText(pin);
    toast.success(`PIN de ${nom} copié !`, { icon: '📋' });
  };

  const roleEmoji = (role: string) => {
    const map: Record<string, string> = { caissier: '💰', cuisine: '👨‍🍳', admin: '🛡️', serveur: '🤵', support: '🧹' };
    return map[role] || '👤';
  };

  // Stats
  const masseSalariale = employes.reduce((acc, curr) => acc + (curr.salaire || 0), 0);
  const totalAvancesMois = avances.reduce((acc, curr) => acc + (curr.montant || 0), 0);

  const getAvancesEmploye = (empId: string) => {
    return avances.filter(a => a.employe_id === empId).reduce((acc, curr) => acc + curr.montant, 0);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Ressources Humaines</h2>
          <p className="text-slate-400 mt-1">Gérez votre personnel, les salaires et les avances.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-indigo-500/20 shadow-lg"
        >
          <UserPlus size={18} /> Recruter du personnel
        </button>
      </header>

      {/* Statistiques Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            label="Effectif" 
            valeur={employes.length} 
            subtext="Membres actifs"
            icon={<Users size={20} className="text-indigo-400" />}
            color="indigo"
          />
          <StatCard 
            label="Masse Salariale Brut" 
            valeur={`${masseSalariale.toLocaleString()}`} 
            suffix="F"
            subtext="Total des contrats"
            icon={<Briefcase size={20} className="text-slate-400" />}
            color="slate"
          />
          <StatCard 
            label="Avances (Mois)" 
            valeur={`${totalAvancesMois.toLocaleString()}`} 
            suffix="F"
            subtext="Déjà versé ce mois"
            icon={<Wallet size={20} className="text-amber-400" />}
            color="amber"
          />
          <StatCard 
            label="Net à Payer (Restant)" 
            valeur={`${(masseSalariale - totalAvancesMois).toLocaleString()}`} 
            suffix="F"
            subtext="Trésorerie à prévoir"
            icon={<Check size={20} className="text-emerald-400" />}
            color="emerald"
          />
      </div>

      {/* Bannière d'Info High-End */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="flex gap-6 p-8 bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Key size={80} className="text-indigo-500" />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Info className="text-indigo-400" size={28} />
        </div>
        <div className="space-y-2 relative z-10">
          <p className="font-bold text-white text-lg lg:text-xl">Sécurité des accès multi-tablettes</p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Chaque membre possède un PIN unique. <strong className="text-indigo-400">En tant que patron, créez-vous un profil "Responsable"</strong> pour débloquer votre accès au tableau de bord. Distribuez les PINs aux serveurs pour leurs tablettes respectives.
          </p>
        </div>
      </motion.div>

      {/* Liste Interactive des Employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
            {employes.map((emp) => {
              const totalAvances = getAvancesEmploye(emp.id);
              const netAPayer = emp.salaire - totalAvances;

              return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={emp.id}
                className={`glass-panel p-8 hover:border-indigo-500/30 transition-all relative group overflow-hidden ${
                  emp.role === 'admin' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${emp.role === 'admin' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${emp.role === 'admin' ? 'bg-amber-500/10' : 'bg-slate-800'}`}>
                    {roleEmoji(emp.role)}
                  </div>
                  <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md mb-2 tracking-widest uppercase border ${
                          emp.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {emp.role}
                      </span>
                  </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-white text-xl mb-1">{emp.nom}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-widest">
                        <Activity size={12} className="text-emerald-500" /> Compte Opérationnel
                    </div>
                </div>

                {/* Section Finance (Premium) */}
                <div className="bg-slate-950/60 rounded-2xl p-6 border border-white/5 space-y-4 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Salaire Brut</span>
                    <span className="text-white font-bold">{emp.salaire?.toLocaleString()} F</span>
                  </div>
                  {totalAvances > 0 && (
                    <div className="flex justify-between items-center text-xs text-amber-500">
                      <span className="font-bold uppercase tracking-wider italic">Avance(s) déduite(s)</span>
                      <span className="font-bold">- {totalAvances.toLocaleString()} F</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest italic">Net à Payer</span>
                    <span className="text-emerald-400 font-black text-lg">{netAPayer.toLocaleString()} F</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedEmploye(emp); setShowAvanceModal(true); }}
                      className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-2 transition-all"
                    >
                      <Wallet size={14} /> Octroyer une avance
                    </button>
                    <button 
                      onClick={() => copierPIN(emp.pin, emp.nom)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 border border-white/5 transition-all"
                      title="PIN"
                    >
                      <Key size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => changerPIN(emp.id, emp.nom)}
                        className="flex-1 py-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest hover:text-white"
                      >
                        Changer PIN
                      </button>
                      <button 
                        onClick={() => supprimerEmploye(emp.id, emp.nom)}
                        className="p-1 px-3 text-rose-500/50 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
                </div>
              </motion.div>
            )})}
        </AnimatePresence>
      </div>

      {/* Modal Recrutement */}
      <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md glass-panel p-10 relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-500"><X size={20} /></button>
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                        <UserPlus size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tighter italic">Nouveau Recrutement</h3>
                </div>

                <form onSubmit={ajouterEmploye} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="label-style">Identité</label>
                    <input 
                      type="text" 
                      value={nouveauNom}
                      onChange={(e) => setNouveauNom(e.target.value)}
                      className="glass-input w-full"
                      placeholder="Prénom et Nom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-style">Rôle</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['serveur', 'caissier', 'cuisine', 'support', 'admin'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setNouveauRole(r)}
                                className={`py-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    nouveauRole === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-style">Salaire Mensuel (F CFA)</label>
                    <div className="relative">
                       <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                       <input 
                         type="number" 
                         value={nouveauSalaire}
                         onChange={(e) => setNouveauSalaire(Number(e.target.value))}
                         className="glass-input w-full pl-11 font-bold text-emerald-400"
                         required
                       />
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs mt-4">
                    Confirmer l'embauche
                  </button>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* Modal Avance sur Salaire */}
      <AnimatePresence>
          {showAvanceModal && selectedEmploye && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm glass-panel p-10 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
                <button onClick={() => setShowAvanceModal(false)} className="absolute top-6 right-6 p-2 text-slate-500"><X size={20} /></button>
                
                <div className="mb-8">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/20 px-3 py-1 rounded-full bg-amber-500/5 shadow-inner">
                        Trésorerie / RH
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-4 italic">Avance sur Salaire</h3>
                    <p className="text-slate-400 text-sm mt-1">Bénéficiaire : <strong className="text-white">{selectedEmploye.nom}</strong></p>
                </div>

                <form onSubmit={enregistrerAvance} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="label-style">Montant (F CFA)</label>
                    <input 
                      type="number" 
                      autoFocus
                      value={montantAvance}
                      onChange={(e) => setMontantAvance(Number(e.target.value))}
                      className="glass-input w-full text-2xl font-black text-amber-500"
                      required
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-style">Motif / Justification</label>
                    <textarea 
                      value={motifAvance}
                      onChange={(e) => setMotivAvance(e.target.value)}
                      className="glass-input w-full text-xs h-20 resize-none pt-3"
                      placeholder="Ex: Urgent, Loyer, Transport..."
                    />
                  </div>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                      <p className="text-[10px] text-amber-500 leading-relaxed font-bold italic">
                        ⚠️ Cette somme sera automatiquement déduite du net à payer à la fin du mois dans ses bulletins de paie.
                      </p>
                  </div>
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-600/20">
                    Décaisser l'avance
                  </button>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1; }`}</style>
    </div>
  );
};



export default GestionEmployes;
