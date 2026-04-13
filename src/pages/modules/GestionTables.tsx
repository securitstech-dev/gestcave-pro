import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, Plus, Trash2, Edit3, Move, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Table {
  id: string;
  nom: string;
  capacite: number;
  zone: 'salle' | 'terrasse' | 'vip';
  statut: 'libre' | 'occupee' | 'en_attente_paiement';
  x: number;
  y: number;
}

const GestionTables = () => {
  const { profil } = useAuthStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Formulaire
  const [nom, setNom] = useState('');
  const [capacite, setCapacite] = useState(4);
  const [zone, setZone] = useState<'salle' | 'terrasse' | 'vip'>('salle');

  useEffect(() => {
    if (!profil?.etablissement_id) return;
    const q = query(collection(db, 'tables'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(q, (snap) => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Table[]);
      setLoading(false);
    });
    return () => unsub();
  }, [profil?.etablissement_id]);

  const ajouterTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tables'), {
        nom,
        capacite: Number(capacite),
        zone,
        statut: 'libre',
        x: 50, // Position par défaut
        y: 50,
        etablissement_id: profil.etablissement_id,
        created_at: new Date().toISOString()
      });
      toast.success(`Table ${nom} créée`);
      setShowModal(false);
      setNom('');
    } catch (error: any) {
      console.error("Erreur création table:", error);
      toast.error(`Erreur : ${error.message || "Impossible de créer"}`);
    }
  };

  const supprimerTable = async (id: string) => {
    if (window.confirm("Supprimer cette table ?")) {
      try {
        await deleteDoc(doc(db, 'tables', id));
        toast.success("Table supprimée");
      } catch {
        toast.error("Erreur");
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Configuration des Tables</h2>
          <p className="text-slate-400 mt-1">Créez et organisez vos zones de consommation.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle Table
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <motion.div 
            key={table.id}
            layout
            className="glass-panel p-6 border-white/10 hover:border-primary/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${
                table.zone === 'vip' ? 'bg-amber-500/10 text-amber-500' : 
                table.zone === 'terrasse' ? 'bg-emerald-500/10 text-emerald-500' : 
                'bg-blue-500/10 text-blue-500'
              }`}>
                <Layout size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                Zone: {table.zone}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{table.nom}</h3>
            <p className="text-sm text-slate-400 mb-6">{table.capacite} personnes</p>

            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                <Move size={14} /> Positionner
              </button>
              <button 
                onClick={() => supprimerTable(table.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {tables.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass-panel border-dashed border-white/10 text-slate-500">
            Aucune table configurée.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-panel p-8"
          >
            <h3 className="text-2xl font-display font-bold text-white mb-6">Ajouter une Table</h3>
            <form onSubmit={ajouterTable} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nom / Numéro</label>
                <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} className="glass-input w-full" placeholder="Ex: Table 12 ou VIP 1" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Capacité</label>
                  <input type="number" value={capacite} onChange={(e)=>setCapacite(Number(e.target.value))} className="glass-input w-full" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Zone</label>
                  <select value={zone} onChange={(e)=>setZone(e.target.value as any)} className="glass-input w-full bg-slate-900">
                    <option value="salle">Salle</option>
                    <option value="terrasse">Terrasse</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white">Annuler</button>
                <button type="submit" className="flex-1 btn-primary">Créer la table</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GestionTables;
