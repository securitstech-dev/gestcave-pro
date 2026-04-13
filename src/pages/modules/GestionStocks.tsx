import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Minus, Search, AlertCircle, Trash2, Edit3, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Produit {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  stockTotal: number;
  unitesParCasier: number;
  stockAlerte: number;
  emoji?: string;
}

const GestionStocks = () => {
  const { profil } = useAuthStore();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Formulaire Nouvel Article
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [categorie, setCategorie] = useState<'Boisson' | 'Ingrédient' | 'A-Côté'>('Boisson');
  const [unitesParCasier, setUnitesParCasier] = useState(12);
  const [stockAlerte, setStockAlerte] = useState(10);
  const [emoji, setEmoji] = useState('🍷');
  const [uniteMesure, setUniteMesure] = useState('bouteilles');

  useEffect(() => {
    if (!profil?.id) return;
    const q = query(collection(db, 'produits'), where('etablissementId', '==', profil.id));
    const unsub = onSnapshot(q, (snap) => {
      setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[]);
      setLoading(false);
    });
    return () => unsub();
  }, [profil?.id]);

  const ajouterProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'produits'), {
        nom,
        prix: Number(prix),
        categorie,
        unitesParCasier: Number(unitesParCasier),
        uniteMesure: categorie === 'Ingrédient' ? uniteMesure : 'bouteilles',
        stockTotal: 0,
        stockAlerte: Number(stockAlerte),
        emoji,
        etablissementId: profil.id,
        dateCreation: new Date().toISOString()
      });
      toast.success(`${nom} ajouté au catalogue`);
      setShowModal(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const ajusterStock = async (p: Produit, delta: number, type: 'unite' | 'casier') => {
    const quantiteAAjouter = type === 'casier' ? delta * p.unitesParCasier : delta;
    const nouveauStock = Math.max(0, p.stockTotal + quantiteAAjouter);
    
    try {
      await updateDoc(doc(db, 'produits', p.id), {
        stockTotal: nouveauStock
      });
      toast.success("Stock mis à jour");
    } catch {
      toast.error("Erreur");
    }
  };

  const formatStock = (total: number, parCasier: number) => {
    if (parCasier <= 1) return `${total} unités`;
    const casiers = Math.floor(total / parCasier);
    const restants = total % parCasier;
    return (
      <div className="flex flex-col">
        <span className="text-white font-bold">{casiers} Casier(s)</span>
        <span className="text-slate-500 text-xs">+ {restants} unité(s)</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Inventaire & Stocks</h2>
          <p className="text-slate-400 mt-1">Gérez vos articles par casiers ou par unités individuelles.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nouvel Article
        </button>
      </header>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher un produit..." 
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="glass-input pl-12 w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="glass-panel overflow-hidden border-white/5">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Stock Actuel (Casiers)</th>
                <th className="px-6 py-4">Total Unités</th>
                <th className="px-6 py-4 text-right">Mouvement de Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {produits.filter(p => p.nom.toLowerCase().includes(recherche.toLowerCase())).map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{p.emoji || (p.categorie === 'Ingrédient' ? '🍅' : '📦')}</span>
                      <div>
                        <div className="font-bold text-white text-base">{p.nom}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                           {p.categorie} {p.categorie === 'Boisson' && `(${p.unitesParCasier} u/casier)`}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-white font-mono">{p.prix.toLocaleString()} F</td>
                  <td className="px-6 py-4">
                    {p.categorie === 'Boisson' ? formatStock(p.stockTotal, p.unitesParCasier) : '-'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${p.stockTotal <= p.stockAlerte ? 'text-red-400' : 'text-slate-300'}`}>
                        {p.stockTotal} {(p as any).uniteMesure || 'unités'}
                      </span>
                      {p.stockTotal <= p.stockAlerte && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-6 items-center">
                      {/* Section Casier */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">Par Casier</span>
                        <div className="flex items-center bg-slate-950/50 rounded-lg p-1 border border-white/5">
                           <button onClick={() => ajusterStock(p, -1, 'casier')} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 transition-colors">
                              <Minus size={14} />
                           </button>
                           <span className="w-8 text-center text-xs text-indigo-400 font-bold">1</span>
                           <button onClick={() => ajusterStock(p, 1, 'casier')} className="p-1.5 hover:bg-white/10 rounded-md text-emerald-400 transition-colors">
                              <Plus size={14} />
                           </button>
                        </div>
                      </div>

                      {/* Section Unité */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">Par Unité</span>
                        <div className="flex items-center bg-slate-950/50 rounded-lg p-1 border border-white/5">
                           <button onClick={() => ajusterStock(p, -1, 'unite')} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 transition-colors">
                              <Minus size={14} />
                           </button>
                           <span className="w-8 text-center text-xs text-indigo-400 font-bold">1</span>
                           <button onClick={() => ajusterStock(p, 1, 'unite')} className="p-1.5 hover:bg-white/10 rounded-md text-emerald-400 transition-colors">
                              <Plus size={14} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-panel p-10"
          >
            <h3 className="text-2xl font-display font-bold text-white mb-8">Nouveau Produit</h3>
            <form onSubmit={ajouterProduit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="label-style">Nom de l'article</label>
                <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} className="glass-input w-full" placeholder="Ex: Bière Primus 60cl" required />
              </div>
              <div>
                <label className="label-style">Catégorie</label>
                <select value={categorie} onChange={(e)=>setCategorie(e.target.value as any)} className="glass-input w-full bg-slate-900">
                  <option value="Boisson">🥤 Boissons</option>
                  <option value="Ingrédient">🍅 Ingrédients Cuisine</option>
                  <option value="A-Côté">🍿 A-Côté / Divers</option>
                </select>
              </div>

              <div>
                <label className="label-style">Icône</label>
                <input type="text" value={emoji} onChange={(e)=>setEmoji(e.target.value)} className="glass-input w-full text-center text-2xl" placeholder="🍷" />
              </div>
              <div>
                <label className="label-style">Prix de vente (F CFA)</label>
                <input type="number" value={prix} onChange={(e)=>setPrix(Number(e.target.value))} className="glass-input w-full" required />
              </div>
              {categorie === 'Boisson' ? (
                <div>
                  <label className="label-style">Unités par Casier</label>
                  <input type="number" value={unitesParCasier} onChange={(e)=>setUnitesParCasier(Number(e.target.value))} className="glass-input w-full" />
                </div>
              ) : (
                <div>
                  <label className="label-style">Unité de mesure</label>
                  <input type="text" value={uniteMesure} onChange={(e)=>setUniteMesure(e.target.value)} className="glass-input w-full" placeholder="ex: kg, litres, sacs" />
                </div>
              )}
              <div className="col-span-2">
                <label className="label-style">Seuil d'alerte stock</label>
                <input type="number" value={stockAlerte} onChange={(e)=>setStockAlerte(Number(e.target.value))} className="glass-input w-full" />
              </div>

              <div className="col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="flex-1 btn-primary">Enregistrer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2; }`}</style>
    </div>
  );
};

export default GestionStocks;
