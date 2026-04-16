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
  role: 'serveur' | 'caissier' | 'cuisine' | 'admin';
  pin: string;
  salaire: number;
  actif: boolean;
}

const GestionEmployes = () => {
  const { profil } = useAuthStore();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Formulaire
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauRole, setNouveauRole] = useState<'serveur' | 'caissier' | 'cuisine' | 'admin'>('serveur');
  const [nouveauSalaire, setNouveauSalaire] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!profil?.etablissement_id) return;

    const q = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[];
      setEmployes(docs);
      setLoading(false);
    });

    return () => unsub();
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
    const map: Record<string, string> = { caissier: '💰', cuisine: '👨‍🍳', admin: '🛡️', serveur: '🤵' };
    return map[role] || '👤';
  };

  // Stats
  const masseSalariale = employes.reduce((acc, curr) => acc + (curr.salaire || 0), 0);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Ressources Humaines</h2>
          <p className="text-slate-400 mt-1">Gérez votre personnel, leurs accès PIN et la masse salariale.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-indigo-500/20 shadow-lg"
        >
          <UserPlus size={18} /> Ajouter du personnel
        </button>
      </header>

      {/* Statistiques Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Employés" 
            valeur={employes.length} 
            subtext="Membres de l'équipe"
            icon={<Users size={20} className="text-indigo-400" />}
            color="indigo"
          />
          <StatCard 
            label="Masse Salariale" 
            valeur={`${masseSalariale.toLocaleString()}`} 
            suffix="F"
            subtext="Dépenses mensuelles est."
            icon={<Wallet size={20} className="text-emerald-400" />}
            color="emerald"
          />
          <StatCard 
            label="Admins Système" 
            valeur={employes.filter(e => e.role === 'admin').length} 
            subtext="Accès gestionnaire total"
            icon={<ShieldCheck size={20} className="text-amber-400" />}
            color="amber"
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
            {employes.map((emp) => (
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
                      {emp.role === 'admin' && <div className="text-[9px] font-bold text-amber-600 uppercase">FULL ACCESS</div>}
                  </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-white text-xl mb-1">{emp.nom}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-widest">
                        <Activity size={12} className="text-emerald-500" /> Compte Actif
                    </div>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-6 border border-white/5 space-y-5 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Key size={14} className="text-indigo-400" /> Code Secret
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-black text-2xl tracking-[0.2em] drop-shadow-lg">{emp.pin}</span>
                      <button 
                        onClick={() => copierPIN(emp.pin, emp.nom)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white border border-white/5"
                        title="Copier"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} className="text-emerald-400" /> Salaire
                    </span>
                    <span className="text-white font-bold">{emp.salaire?.toLocaleString() || 0} F CFA</span>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => changerPIN(emp.id, emp.nom)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-center gap-2 border border-white/5"
                  >
                    <RefreshCw size={14} /> Nouveau PIN
                  </button>
                  <button 
                    onClick={() => supprimerEmploye(emp.id, emp.nom)}
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-500 border border-rose-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {employes.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center glass-panel border-dashed border-white/10 opacity-60">
            <Users size={60} className="mx-auto mb-6 text-slate-600" />
            <p className="text-xl text-slate-400 font-medium">Votre équipe est vide.</p>
            <p className="text-sm text-slate-600 mt-2">Cliquez sur le bouton "Ajouter" pour commencer.</p>
          </div>
        )}
      </div>

      {/* Modal Ajout Premium */}
      <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md glass-panel p-10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                        <UserPlus size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white">Nouvel État Major</h3>
                    <p className="text-slate-400 mt-2">Préparez un nouvel accès pour votre personnel.</p>
                </div>

                <form onSubmit={ajouterEmploye} className="space-y-8">
                  <div className="space-y-2">
                    <label className="label-style">Identité complète</label>
                    <input 
                      type="text" 
                      value={nouveauNom}
                      onChange={(e) => setNouveauNom(e.target.value)}
                      className="glass-input w-full h-12"
                      placeholder="Prénom et Nom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-style">Affectation / Rôle</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['serveur', 'caissier', 'cuisine', 'admin'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setNouveauRole(r)}
                                className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    nouveauRole === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-style">Rémunération de base (F CFA)</label>
                    <div className="relative">
                       <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                       <input 
                         type="number" 
                         value={nouveauSalaire}
                         onChange={(e) => setNouveauSalaire(Number(e.target.value))}
                         className="glass-input w-full h-12 pl-11 font-bold text-emerald-400"
                         required
                       />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-slate-500 font-bold hover:text-white"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 btn-primary py-4 font-bold flex items-center justify-center gap-2"
                    >
                      <Check size={20} /> VALIDER LE PROFIL
                    </button>
                  </div>
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
