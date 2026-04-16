import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Plus, Minus, Search, 
  AlertCircle, Trash2, Edit3, Save, 
  Archive, Layers, BarChart3, TrendingDown,
  ChevronRight, MoreVertical, X
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import StatCard from '../../components/ui/StatCard';

interface Produit {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  stockTotal: number;
  unitesParCasier: number;
  stockAlerte: number;
  emoji?: string;
  uniteMesure?: string;
}

const GestionStocks = () => {
  const { profil } = useAuthStore();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState<string>('Tous');
  const [showModal, setShowModal] = useState(false);

  // Formulaire Nouvel Article
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [categorie, setCategorie] = useState<'Boisson' | 'Ingrédient' | 'A-Côté'>('Boisson');
  const [unitesParCasier, setUnitesParCasier] = useState(12);
  const [stockAlerte, setStockAlerte] = useState(10);
  const [emoji, setEmoji] = useState('🥤');
  const [uniteMesure, setUniteMesure] = useState('bouteilles');

  useEffect(() => {
    if (!profil?.etablissement_id) return;
    const q = query(collection(db, 'produits'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(q, (snap) => {
      setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[]);
      setLoading(false);
    });
    return () => unsub();
  }, [profil?.etablissement_id]);

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
        etablissement_id: profil.etablissement_id,
        dateCreation: new Date().toISOString()
      });
      toast.success(`${nom} ajouté au catalogue`, { icon: '✨' });
      setShowModal(false);
      reinitialiserForm();
    } catch (error: any) {
      toast.error(`Erreur : ${error.message || "Impossible d'ajouter"}`);
    }
  };

  const reinitialiserForm = () => {
      setNom('');
      setPrix(0);
      setEmoji('🥤');
      setStockAlerte(10);
  };

  const ajusterStock = async (p: Produit, delta: number, type: 'unite' | 'casier') => {
    const quantiteAAjouter = type === 'casier' ? delta * (p.unitesParCasier || 1) : delta;
    const nouveauStock = Math.max(0, p.stockTotal + quantiteAAjouter);
    
    try {
      await updateDoc(doc(db, 'produits', p.id), {
        stockTotal: nouveauStock
      });
      toast.success(delta > 0 ? "+ Enregistré" : "- Retiré", {
          position: 'bottom-center',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } catch {
      toast.error("Échec de mise à jour");
    }
  };

  const formatStock = (total: number, parCasier: number) => {
    if (parCasier <= 1) return <span className="text-slate-500">-</span>;
    const casiers = Math.floor(total / parCasier);
    const restants = total % parCasier;
    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-bold">{casiers} <span className="text-[10px] text-slate-500 uppercase">Casiers</span></span>
        {restants > 0 && <span className="text-indigo-400 text-xs font-medium">+{restants} u</span>}
      </div>
    );
  };

  // Statistiques & Filtres
  const categories = ['Tous', ...new Set(produits.map(p => p.categorie))];
  
  const produitsFiltrés = produits.filter(p => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchCat = filtreCategorie === 'Tous' || p.categorie === filtreCategorie;
    return matchRecherche && matchCat;
  });

  const articlesEnAlerte = produits.filter(p => p.stockTotal <= p.stockAlerte).length;
  const valeurStockTotal = produits.reduce((acc, p) => acc + (p.stockTotal * p.prix), 0);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Inventaire & Stocks</h2>
          <p className="text-slate-400 mt-1">Gérez vos articles, contrôlez vos casiers et prévenez les ruptures.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-indigo-500/20 shadow-lg"
        >
          <Plus size={18} /> Nouvel Article
        </button>
      </header>

      {/* Résumé Bento Art */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Références" 
            valeur={produits.length} 
            subtext="Articles actifs"
            icon={<Package size={20} className="text-indigo-400" />}
            color="indigo"
          />
          <StatCard 
            label="Valeur du Stock" 
            valeur={`${valeurStockTotal.toLocaleString()}`} 
            suffix="F"
            subtext="Estimation vente"
            icon={<BarChart3 size={20} className="text-emerald-400" />}
            color="emerald"
          />
          <StatCard 
            label="Ruptures Imminentes" 
            valeur={articlesEnAlerte} 
            subtext="Sous le seuil d'alerte"
            icon={<AlertCircle size={20} className={articlesEnAlerte > 0 ? "text-rose-500 animate-pulse" : "text-slate-500"} />}
            color={articlesEnAlerte > 0 ? "rose" : "slate"}
            important={articlesEnAlerte > 0}
          />
      </div>

      {/* Barre de recherche & Filtres */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow max-w-xl w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="glass-input pl-12 w-full h-12"
            />
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto max-w-full">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFiltreCategorie(cat)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filtreCategorie === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
      </div>

      <div className="glass-panel overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-md">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Article</th>
                    <th className="px-8 py-5">Prix Vente</th>
                    <th className="px-8 py-5">État des Casiers</th>
                    <th className="px-8 py-5">Quantité Totale</th>
                    <th className="px-8 py-5 text-right">Mouvement Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {produitsFiltrés.map((p) => {
                    const estEnAlerte = p.stockTotal <= p.stockAlerte;
                    const pourcentageStock = Math.min(100, (p.stockTotal / (p.stockAlerte * 3)) * 100);
                    return (
                      <tr key={p.id} className={`hover:bg-white/5 transition-colors group ${estEnAlerte ? 'bg-rose-500/[0.02]' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${estEnAlerte ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-800'}`}>
                              {p.emoji || (p.categorie === 'Ingrédient' ? '🍅' : '📦')}
                            </div>
                            <div>
                              <div className="font-bold text-white text-base flex items-center gap-2">
                                  {p.nom}
                                  {estEnAlerte && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                 {p.categorie} {p.categorie === 'Boisson' && `· ${p.unitesParCasier} par casier`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                            <span className="text-white font-mono font-bold">{p.prix.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 ml-1 font-bold">CFA</span>
                        </td>

                        <td className="px-8 py-5">
                          {p.categorie === 'Boisson' ? formatStock(p.stockTotal, p.unitesParCasier) : (
                              <span className="text-xs text-slate-600 italic">N/A (Ingrédient)</span>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className={`text-lg font-black ${estEnAlerte ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {p.stockTotal}
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                    {p.uniteMesure || 'unités'}
                                </span>
                            </div>
                            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pourcentageStock}%` }}
                                    className={`h-full ${estEnAlerte ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                />
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex justify-end gap-8 items-center">
                            {/* Section Casier (si boisson) */}
                            {p.categorie === 'Boisson' && (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center p-1.5 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner">
                                        <button onClick={() => ajusterStock(p, -1, 'casier')} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all">
                                            <Minus size={14} />
                                        </button>
                                        <div className="px-3 flex flex-col items-center">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Casiers</span>
                                            <Layers size={12} className="text-slate-600" />
                                        </div>
                                        <button onClick={() => ajusterStock(p, 1, 'casier')} className="p-2 hover:bg-white/10 rounded-lg text-emerald-500 hover:text-emerald-400 transition-all">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Section Unité */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center p-1.5 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner">
                                    <button onClick={() => ajusterStock(p, -1, 'unite')} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all">
                                        <Minus size={14} />
                                    </button>
                                    <div className="px-3 flex flex-col items-center">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Unités</span>
                                        <Package size={12} className="text-slate-600" />
                                    </div>
                                    <button onClick={() => ajusterStock(p, 1, 'unite')} className="p-2 hover:bg-white/10 rounded-lg text-emerald-500 hover:text-emerald-400 transition-all">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl glass-panel p-10 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="mb-10">
                <h3 className="text-3xl font-display font-bold text-white">Nouveau Produit</h3>
                <p className="text-slate-400 text-sm mt-1">Créez une nouvelle référence pour votre bar ou votre cuisine.</p>
            </div>

            <form onSubmit={ajouterProduit} className="grid grid-cols-2 gap-8">
              <div className="col-span-2">
                <label className="label-style">Nom de l'article</label>
                <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} className="glass-input w-full h-12" placeholder="Ex: Heineken 33cl" required />
              </div>

              <div>
                <label className="label-style">Catégorie</label>
                <select value={categorie} onChange={(e)=>setCategorie(e.target.value as any)} className="glass-input w-full h-12 bg-slate-900 border-none outline-none">
                  <option value="Boisson">🥤 Boissons / Alcools</option>
                  <option value="Ingrédient">🍅 Ingrédients / Cuisine</option>
                  <option value="A-Côté">🍿 A-Côtés et Divers</option>
                </select>
              </div>

              <div>
                <label className="label-style">Emoji / Icone</label>
                <input type="text" value={emoji} onChange={(e)=>setEmoji(e.target.value)} className="glass-input w-full h-12 text-center text-2xl" placeholder="🍷" />
              </div>

              <div>
                <label className="label-style">Prix de vente (F CFA)</label>
                <input type="number" value={prix} onChange={(e)=>setPrix(Number(e.target.value))} className="glass-input w-full h-12 text-emerald-400 font-bold" required />
              </div>

              {categorie === 'Boisson' ? (
                <div>
                  <label className="label-style">Unités par Casier</label>
                  <input type="number" value={unitesParCasier} onChange={(e)=>setUnitesParCasier(Number(e.target.value))} className="glass-input w-full h-12" />
                </div>
              ) : (
                <div>
                  <label className="label-style">Unité de mesure</label>
                  <input type="text" value={uniteMesure} onChange={(e)=>setUniteMesure(e.target.value)} className="glass-input w-full h-12" placeholder="ex: kg, sacs" />
                </div>
              )}

              <div className="col-span-2 bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10">
                <label className="label-style text-indigo-400">Seuil d'alerte critique</label>
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="100" value={stockAlerte} onChange={(e)=>setStockAlerte(Number(e.target.value))} className="flex-grow h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    <span className="w-12 text-white font-bold text-center">{stockAlerte}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Vous recevrez une alerte visuelle quand le stock descendra sous ce niveau.</p>
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors">Abandonner</button>
                <button type="submit" className="flex-1 btn-primary py-4 font-bold shadow-indigo-500/20 shadow-xl">
                    Finaliser la création
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1; }`}</style>
    </div>
  );
};



export default GestionStocks;
