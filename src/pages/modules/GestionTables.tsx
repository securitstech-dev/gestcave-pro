import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Plus, Trash2, Edit3, Move, 
  Save, Grid, MapPin, Users, X, 
  ChevronRight, Crown, Sun
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
  
  const [nom, setNom] = useState('');
  const [capacite, setCapacite] = useState(4);
  const [zone, setZone] = useState<'salle' | 'terrasse' | 'vip' | 'comptoir'>('salle');

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
        nom, capacite: Number(capacite), zone, statut: 'libre', x: 50, y: 50,
        etablissement_id: profil.etablissement_id, created_at: new Date().toISOString()
      });
      toast.success(`Table ${nom} créée`);
      setShowModal(false); setNom(''); setCapacite(4);
    } catch {
      toast.error("Erreur de création");
    }
  };

  const supprimerTable = async (id: string, nomTable: string) => {
    if (window.confirm(`Supprimer la table ${nomTable} ?`)) {
      try {
        await deleteDoc(doc(db, 'tables', id));
        toast.success("Table retirée du plan");
      } catch {
        toast.error("Échec de suppression");
      }
    }
  };

  const totalCapacite = tables.reduce((acc, t) => acc + (t.capacite || 0), 0);
  const tablesParZone = {
      salle: tables.filter(t => t.zone === 'salle').length,
      terrasse: tables.filter(t => t.zone === 'terrasse').length,
      vip: tables.filter(t => t.zone === 'vip').length,
  };

  const zoneStyle = (z: string) => {
    if (z === 'vip') return { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'bg-amber-50 text-amber-600', card: 'border-amber-200' };
    if (z === 'terrasse') return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'bg-emerald-50 text-emerald-600', card: 'border-emerald-200' };
    return { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'bg-blue-50 text-blue-600', card: 'border-slate-200' };
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Configuration Salle</h2>
          <p className="text-slate-500 font-medium text-[8px] mt-0.5">Définissez la topologie de votre établissement et gérez vos zones.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
          <Plus size={14} /> Nouvelle Table
        </button>
      </header>

      {/* Stats Capacité */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 bg-slate-900 p-4 rounded-2xl text-white shadow-2xl shadow-slate-900/20">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Capacité Totale</p>
              <p className="text-2xl font-bold mt-1">{totalCapacite}</p>
              <p className="text-[10px] font-medium text-slate-400">places assises</p>
          </div>
          {[
            { label: 'SALLE', val: tablesParZone.salle, icon: <Grid size={16} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'TERRASSE', val: tablesParZone.terrasse, icon: <Sun size={16} />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'VIP', val: tablesParZone.vip, icon: <Crown size={16} />, color: 'text-amber-600 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>{s.icon}</div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{s.val}</p>
                <p className="text-[10px] text-slate-400 font-medium">tables</p>
            </div>
          ))}
      </div>

      {/* Grille des Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <AnimatePresence>
            {tables.map((table) => {
              const s = zoneStyle(table.zone);
              return (
                <motion.div layout key={table.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white p-4 rounded-2xl border-2 ${s.card} hover:shadow-lg transition-all group relative`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-8 h-8 rounded-xl ${s.icon} flex items-center justify-center`}>
                      <Layout size={16} />
                    </div>
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${s.badge}`}>
                      {table.zone}
                    </span>
                  </div>

                  <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{table.nom}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                          <Users size={10} /> {table.capacite} pers.
                      </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="flex-1 py-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-slate-200 transition-all">
                      Modifier
                    </button>
                    <button onClick={() => supprimerTable(table.id, table.nom)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-300 hover:text-rose-500 hover:border-rose-200 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {tables.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin size={36} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Plan vierge</h3>
            <p className="text-slate-400 font-medium mt-2">Cliquez sur "Nouvelle Table" pour configurer votre établissement.</p>
          </div>
        )}
      </div>

      {/* Modal Création Table */}
      <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><X size={18} /></button>
                <div className="mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4"><Layout size={20} /></div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nouvelle Table</h3>
                    <p className="text-slate-500 font-medium text-xs mt-0.5">Ajoutez une zone d'assise à votre plan de salle.</p>
                </div>

                <form onSubmit={ajouterTable} className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Nom / Numéro</label>
                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Table 7" required
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-bold text-slate-900 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Capacité</label>
                      <input type="number" value={capacite} onChange={(e) => setCapacite(Number(e.target.value))} min="1" required
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-center text-lg" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Zone</label>
                      <select value={zone} onChange={(e) => setZone(e.target.value as any)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 outline-none font-bold text-slate-900 text-xs">
                        <option value="salle">🏠 Salle</option>
                        <option value="terrasse">🌿 Terrasse</option>
                        <option value="vip">👑 VIP</option>
                        <option value="comptoir">🍺 Comptoir</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all mt-2">
                    Créer la Table
                  </button>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default GestionTables;
