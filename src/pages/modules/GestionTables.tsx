import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Plus, Trash2, Edit3, Move, 
  Save, Grid, MapPin, Users, X, 
  ChevronRight, Layers, Crown, Sun
} from 'lucide-react';
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
        x: 50, 
        y: 50,
        etablissement_id: profil.etablissement_id,
        created_at: new Date().toISOString()
      });
      toast.success(`Table ${nom} ajoutée au plan`, { icon: '📍' });
      setShowModal(false);
      setNom('');
      setCapacite(4);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message || "Impossible de créer"}`);
    }
  };

  const supprimerTable = async (id: string, nom: string) => {
    if (window.confirm(`Supprimer la table ${nom} du plan de salle ?`)) {
      try {
        await deleteDoc(doc(db, 'tables', id));
        toast.success("Table retirée");
      } catch {
        toast.error("Échec de suppression");
      }
    }
  };

  const getZoneIcon = (zone: string) => {
      switch(zone) {
          case 'vip': return <Crown size={22} />;
          case 'terrasse': return <Sun size={22} />;
          default: return <Grid size={22} />;
      }
  };

  // Stats
  const totalCapacite = tables.reduce((acc, t) => acc + (t.capacite || 0), 0);
  const tablesParZone = {
      salle: tables.filter(t => t.zone === 'salle').length,
      terrasse: tables.filter(t => t.zone === 'terrasse').length,
      vip: tables.filter(t => t.zone === 'vip').length
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Configuration des Tables</h2>
          <p className="text-slate-400 mt-1">Créez votre plan de salle et organisez vos zones de consommation.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-indigo-500/20 shadow-lg"
        >
          <Plus size={18} /> Nouvelle Table
        </button>
      </header>

      {/* Snapshot des zones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            label="Capacité Totale" 
            valeur={totalCapacite} 
            sub="Places assises"
            icone={<Users className="text-indigo-400" />}
            couleur="indigo"
          />
          <StatMiniCard label="Salle Principal" valeur={tablesParZone.salle} icone={<Grid size={16} className="text-blue-400" />} />
          <StatMiniCard label="Terrasse" valeur={tablesParZone.terrasse} icone={<Sun size={16} className="text-emerald-400" />} />
          <StatMiniCard label="Espace VIP" valeur={tablesParZone.vip} icone={<Crown size={16} className="text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
            {tables.map((table) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={table.id}
                className="glass-panel p-8 group relative overflow-hidden border-white/5 hover:border-indigo-500/30 transition-all"
              >
                <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-700`}>
                    {getZoneIcon(table.zone)}
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    table.zone === 'vip' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                    table.zone === 'terrasse' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    <Layout size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Localisation</span>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                        table.zone === 'vip' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        table.zone === 'terrasse' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                      }`}>
                        {table.zone.toUpperCase()}
                      </span>
                  </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-2xl font-display font-black text-white mb-1">{table.nom}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold font-mono tracking-tighter">
                        <Users size={14} className="text-slate-600" /> CAPACITÉ: {table.capacite} PERSONNES
                    </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-center gap-2 border border-white/5 transition-all">
                    <Move size={14} /> Ajuster Position
                  </button>
                  <button 
                    onClick={() => supprimerTable(table.id, table.nom)}
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-500 border border-rose-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {tables.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center glass-panel border-dashed border-white/10 opacity-60">
            <MapPin size={60} className="mx-auto mb-6 text-slate-600" />
            <p className="text-xl text-slate-400 font-medium">Aucune table n'est encore positionnée.</p>
            <p className="text-sm text-slate-600 mt-2">Utilisez le bouton "Nouvelle Table" pour configurer votre établissement.</p>
          </div>
        )}
      </div>

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
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                        <Layout size={32} className="text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white">Nouvelle Table</h3>
                    <p className="text-slate-400 mt-2">Positionnez une nouvelle zone d'assise sur votre plan.</p>
                </div>

                <form onSubmit={ajouterTable} className="space-y-8">
                  <div className="space-y-2">
                    <label className="label-style">Dénomination</label>
                    <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} className="glass-input w-full h-12" placeholder="Ex: Table Terrasse 5 ou VIP A" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-style">Nombre de Places</label>
                      <input type="number" value={capacite} onChange={(e)=>setCapacite(Number(e.target.value))} className="glass-input w-full h-12 text-center text-lg font-bold" min="1" required />
                    </div>
                    <div className="space-y-2">
                      <label className="label-style">Assignation Zone</label>
                      <select value={zone} onChange={(e)=>setZone(e.target.value as any)} className="glass-input w-full h-12 bg-slate-900 border-none outline-none text-xs font-bold uppercase tracking-widest">
                        <option value="salle">Salle Principale</option>
                        <option value="terrasse">Terrasse Ext.</option>
                        <option value="vip">Espace VIP</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="flex-1 btn-primary py-4 font-bold shadow-blue-500/20 shadow-xl">
                        CRÉER LA TABLE
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1; }`}</style>
    </div>
  );
};

const StatCard = ({ label, valeur, sub, icone, couleur }: any) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="glass-panel p-8 relative overflow-hidden group border-white/5 bg-slate-900/40"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-${couleur}-500/5 rounded-full blur-2xl transition-transform duration-700`} />
        <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">{icone}</div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
        </div>
        <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-3xl font-display font-black text-white truncate">{valeur}</h4>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
    </motion.div>
);

const StatMiniCard = ({ label, valeur, icone }: any) => (
    <div className="glass-panel p-6 flex flex-col justify-center border-white/5 bg-slate-900/20">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/5 rounded-lg">{icone}</div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-2xl font-display font-black text-white px-1">{valeur}</div>
    </div>
);

export default GestionTables;
