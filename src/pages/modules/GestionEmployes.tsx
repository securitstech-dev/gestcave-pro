import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, Key, Trash2, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

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
  }, [profil?.id]);

  const genererPIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const ajouterEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauNom) return;

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
      toast.success(`${nouveauNom} ajouté avec succès`);
      setNouveauNom('');
      setShowModal(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const supprimerEmploye = async (id: string) => {
    if (window.confirm("Supprimer cet employé ?")) {
      try {
        await deleteDoc(doc(db, 'employes', id));
        toast.success("Employé supprimé");
      } catch (error) {
        toast.error("Erreur");
      }
    }
  };

  const changerPIN = async (id: string) => {
    const nouveauPIN = genererPIN();
    try {
      await updateDoc(doc(db, 'employes', id), { pin: nouveauPIN });
      toast.success(`Nouveau PIN généré : ${nouveauPIN}`);
    } catch (error) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Gestion du Personnel</h2>
          <p className="text-slate-400">Gérez vos employés et leurs accès sécurisés par PIN.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} /> Ajouter un employé
        </button>
      </header>

      {/* Grille des employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employes.map((emp) => (
          <motion.div 
            layout
            key={emp.id}
            className="glass-panel p-6 border-white/10 hover:border-primary/30 transition-all relative group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                {emp.role === 'caissier' ? '💰' : emp.role === 'cuisine' ? '👨‍🍳' : '🤵'}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{emp.nom}</h3>
                <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {emp.role}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Key size={14} /> Code PIN</span>
                <span className="text-white font-mono font-bold text-lg tracking-widest">{emp.pin}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2">💰 Salaire</span>
                <span className="text-accent font-bold">{emp.salaire?.toLocaleString() || 0} F</span>
              </div>
              <div className="flex justify-between items-center text-sm text-[10px] uppercase font-bold text-slate-600">
                <span>Accès</span>
                <span className="text-emerald-500">Autorisé</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => changerPIN(emp.id)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-2 border border-white/5"
              >
                <RefreshCw size={14} /> Nouveau PIN
              </button>
              <button 
                onClick={() => supprimerEmploye(emp.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 border border-red-500/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}

        {employes.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass-panel italic text-slate-500">
            Aucun employé enregistré. Commencez par en ajouter un !
          </div>
        )}
      </div>

      {/* Modal Ajout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-panel p-8"
          >
            <h3 className="text-2xl font-display font-bold text-white mb-6">Nouvel Employé</h3>
            <form onSubmit={ajouterEmploye} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nom complet</label>
                <input 
                  type="text" 
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Rôle / Poste</label>
                <select 
                  value={nouveauRole}
                  onChange={(e) => setNouveauRole(e.target.value as any)}
                  className="glass-input w-full bg-slate-900"
                >
                  <option value="serveur">🤵 Serveur</option>
                  <option value="caissier">💰 Caissier (Ventes)</option>
                  <option value="cuisine">👨‍🍳 Cuisine / Bar</option>
                  <option value="admin">🛡️ Responsable (Manager)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Salaire Mensuel (F CFA)</label>
                <input 
                  type="number" 
                  value={nouveauSalaire}
                  onChange={(e) => setNouveauSalaire(Number(e.target.value))}
                  className="glass-input w-full"
                  placeholder="0"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GestionEmployes;
