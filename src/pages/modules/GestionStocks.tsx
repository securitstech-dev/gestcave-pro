import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Minus, Search, 
  AlertCircle, Trash2, Edit3, Save, 
  Archive, Layers, BarChart3, TrendingDown,
  ChevronRight, MoreVertical, X, ArrowUpRight
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  const [showComptage, setShowComptage] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [stockReel, setStockReel] = useState<number>(0);

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
      toast.success(`${nom} ajouté`);
      setShowModal(false);
      reinitialiserForm();
    } catch {
      toast.error("Erreur d'ajout");
    }
  };

  const reinitialiserForm = () => {
      setNom(''); setPrix(0); setEmoji('🥤'); setStockAlerte(10);
  };

  const ajusterStock = async (p: Produit, delta: number, type: 'unite' | 'casier') => {
    const qte = type === 'casier' ? delta * (p.unitesParCasier || 1) : delta;
    const nouveau = Math.max(0, p.stockTotal + qte);
    try {
      await updateDoc(doc(db, 'produits', p.id), { stockTotal: nouveau });
      toast.success(delta > 0 ? "Stock provisionné" : "Stock retiré", { icon: delta > 0 ? '📦' : '📤' });
    } catch {
      toast.error("Échec");
    }
  };

  const validerComptage = async () => {
    if (!selectedProduct) return;
    const ecart = stockReel - selectedProduct.stockTotal;
    
    try {
        const batch = writeBatch(db);
        // 1. Update stock
        batch.update(doc(db, 'produits', selectedProduct.id), { stockTotal: stockReel });
        
        // 2. Log movement (Historique)
        const logRef = doc(collection(db, 'historique_stocks'));
        batch.set(logRef, {
            produitId: selectedProduct.id,
            produitNom: selectedProduct.nom,
            type: 'ajustement_inventaire',
            ancienStock: selectedProduct.stockTotal,
            nouveauStock: stockReel,
            ecart,
            date: new Date().toISOString(),
            etablissement_id: profil.etablissement_id
        });

        await batch.commit();
        toast.success(`Inventaire régularisé (${ecart >= 0 ? '+' : ''}${ecart} u)`);
        setShowComptage(false);
    } catch (e) {
        toast.error("Erreur de régularisation");
    }
  };

  const formatStock = (total: number, parCasier: number) => {
    if (parCasier <= 1) return <span className="text-slate-400">-</span>;
    const casiers = Math.floor(total / parCasier);
    const restants = total % parCasier;
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-900 font-bold">{casiers} <span className="text-[10px] text-slate-400 uppercase">Casiers</span></span>
        {restants > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">+{restants} u</span>}
      </div>
    );
  };

  const categoriesList = ['Tous', ...new Set(produits.map(p => p.categorie))];
  const produitsFiltrés = produits.filter(p => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchCat = filtreCategorie === 'Tous' || p.categorie === filtreCategorie;
    return matchRecherche && matchCat;
  });

  const articlesEnAlerte = produits.filter(p => p.stockTotal <= p.stockAlerte).length;
  const valeurStockTotal = produits.reduce((acc, p) => acc + (p.stockTotal * p.prix), 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Inventaire Appliqué</h2>
          <p className="text-slate-500 font-medium mt-1">Gérez vos références et supervisez vos niveaux critiques.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setShowModal(true)} className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                <Plus size={18} /> Nouvelle Référence
            </button>
            <button className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                <BarChart3 size={18} /> Rapport Mensuel
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Références" valeur={produits.length} subtext="Catalogue actif" color="slate" />
          <StatCard label="Valeur Marchande" valeur={`${valeurStockTotal.toLocaleString()}`} suffix="F" subtext="Estimation prix vente" color="slate" />
          <StatCard label="États Critiques" valeur={articlesEnAlerte} subtext="Sous seuil d'alerte" color={articlesEnAlerte > 0 ? "rose" : "slate"} important={articlesEnAlerte > 0} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-200">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un produit dans l'inventaire..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-900 transition-all font-medium text-slate-900" />
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {categoriesList.map(cat => (
                <button key={cat} onClick={() => setFiltreCategorie(cat)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filtreCategorie === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Article Référencé</th>
                    <th className="px-8 py-5">Prix Unitaire</th>
                    <th className="px-8 py-5">Situation Casiers</th>
                    <th className="px-8 py-5">Stock Unitaire</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produitsFiltrés.map((p) => {
                    const estEnAlerte = p.stockTotal <= p.stockAlerte;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${estEnAlerte ? 'bg-red-50/30' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-100 border border-slate-200`}>
                              {p.emoji || '📦'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-base">{p.nom}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.categorie}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                            <span className="text-slate-900 font-bold">{p.prix.toLocaleString()} F</span>
                        </td>
                        <td className="px-8 py-6">
                          {p.categorie === 'Boisson' ? formatStock(p.stockTotal, p.unitesParCasier) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${estEnAlerte ? 'text-red-500' : 'text-slate-900'}`}>{p.stockTotal}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{p.uniteMesure || 'unités'}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-3">
                             <button 
                               onClick={() => {
                                   setSelectedProduct(p);
                                   setStockReel(p.stockTotal);
                                   setShowComptage(true);
                               }}
                               className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2"
                             >
                               <Archive size={14} /> Inventaire
                             </button>
                             <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                                <button onClick={() => ajusterStock(p, -1, 'unite')} className="p-2 text-slate-400 hover:text-slate-900"><Minus size={14} /></button>
                                <button onClick={() => ajusterStock(p, 1, 'unite')} className="p-2 text-slate-900"><Plus size={14} /></button>
                             </div>
                             {p.categorie === 'Boisson' && (
                               <div className="flex bg-slate-900 rounded-xl p-1 text-white shadow-lg shadow-slate-900/10">
                                  <button onClick={() => ajusterStock(p, -1, 'casier')} className="p-2 opacity-50 hover:opacity-100"><Layers size={14} /></button>
                                  <button onClick={() => ajusterStock(p, 1, 'casier')} className="p-2"><Plus size={14} /></button>
                               </div>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
      </div>

      <AnimatePresence>
        {/* Modal Création */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
              <div className="mb-10">
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Nouvel Article</h3>
                  <p className="text-slate-500 font-medium mt-1">Ajoutez une référence à votre catalogue de vente.</p>
              </div>
              <form onSubmit={ajouterProduit} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Désignation</label>
                  <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} placeholder="Ex: Heineken 33cl" required 
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-slate-900 transition-all font-bold text-slate-900" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Catégorie</label>
                  <select value={categorie} onChange={(e)=>setCategorie(e.target.value as any)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 outline-none font-bold text-slate-900">
                    <option value="Boisson">🥤 Boissons / Alcools</option>
                    <option value="Ingrédient">🍅 Ingrédients / Cuisine</option>
                    <option value="A-Côté">🍿 Divers et Accessoires</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Prix Vente</label>
                  <input type="number" value={prix} onChange={(e)=>setPrix(Number(e.target.value))} required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" />
                </div>
                {categorie === 'Boisson' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Contenance (Unités par Casier)</label>
                    <input type="number" value={unitesParCasier} onChange={(e)=>setUnitesParCasier(Number(e.target.value))} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" />
                  </div>
                )}
                <div className="col-span-2 flex gap-4 mt-6">
                  <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-5 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Abandonner</button>
                  <button type="submit" className="flex-1 py-5 rounded-2xl bg-slate-900 text-white font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Comptage Physique */}
        {showComptage && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl relative"
             >
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">{selectedProduct.emoji}</div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{selectedProduct.nom}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comptage de régularisation</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Théorique</p>
                            <p className="text-2xl font-bold text-slate-900">{selectedProduct.stockTotal}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200" />
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Écart Calculé</p>
                            <p className={`text-2xl font-bold ${stockReel - selectedProduct.stockTotal < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {stockReel - selectedProduct.stockTotal > 0 ? '+' : ''}{stockReel - selectedProduct.stockTotal}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 px-1">Quantité Réelle Comptée (Unités)</label>
                        <input type="number" autoFocus value={stockReel} onChange={(e) => setStockReel(Number(e.target.value))}
                            className="w-full h-20 bg-slate-100 border-2 border-slate-200 rounded-3xl text-center text-4xl font-black text-slate-900 outline-none focus:border-slate-900 transition-all" />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setShowComptage(false)} className="flex-1 py-5 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Annuler</button>
                        <button onClick={validerComptage} className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                            Régulariser
                        </button>
                    </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionStocks;
