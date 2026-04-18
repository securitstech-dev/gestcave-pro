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
  destination_production?: 'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha';
  recette?: {
    ingredientId: string;
    nom: string;
    quantite: number;
  }[];
}

const GestionStocks = () => {
  const { profil } = useAuthStore();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState<string>('Tous');
  const [showModal, setShowModal] = useState(false);
  const [showComptage, setShowComptage] = useState(false);
  const [showRecetteModal, setShowRecetteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [stockReel, setStockReel] = useState<number>(0);
  const [ingredientSelectionne, setIngredientSelectionne] = useState('');
  const [quantiteIngredient, setQuantiteIngredient] = useState(1);

  // Formulaire Nouvel Article
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [categorie, setCategorie] = useState<'Boisson' | 'Ingrédient' | 'A-Côté'>('Boisson');
  const [unitesParCasier, setUnitesParCasier] = useState(12);
  const [stockAlerte, setStockAlerte] = useState(10);
  const [emoji, setEmoji] = useState('🥤');
  const [uniteMesure, setUniteMesure] = useState('bouteilles');
  const [destination, setDestination] = useState<'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha'>('cuisine');

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
        destination_production: destination,
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

  const ajouterIngredientRecette = async () => {
    if (!selectedProduct || !ingredientSelectionne) return;
    
    const ingredient = produits.find(p => p.id === ingredientSelectionne);
    if (!ingredient) return;

    const nouvelleRecette = [
      ...(selectedProduct as any).recette || [],
      {
        ingredientId: ingredient.id,
        nom: ingredient.nom,
        quantite: quantiteIngredient
      }
    ];

    try {
      await updateDoc(doc(db, 'produits', selectedProduct.id), {
        recette: nouvelleRecette
      });
      toast.success(`Ingredient ajouté à la recette`);
      setIngredientSelectionne('');
      setQuantiteIngredient(1);
    } catch (e) {
      toast.error("Erreur de mise à jour");
    }
  };

  const supprimerIngredientRecette = async (idx: number) => {
    if (!selectedProduct) return;
    const nouvelleRecette = [...((selectedProduct as any).recette || [])];
    nouvelleRecette.splice(idx, 1);

    try {
      await updateDoc(doc(db, 'produits', selectedProduct.id), {
        recette: nouvelleRecette
      });
      toast.success("Ingredient retiré");
    } catch (e) {
      toast.error("Erreur de mise à jour");
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
    <div className="space-y-2.5">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Inventaire Appliqué</h2>
          <p className="text-slate-500 font-medium text-[8px] mt-0.5">Gérez vos références et supervisez vos niveaux critiques.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                <Plus size={12} /> Nouvelle Référence
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                <BarChart3 size={12} /> Rapport Mensuel
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <StatCard label="Total Références" valeur={produits.length} subtext="Catalogue actif" color="slate" />
          <StatCard label="Valeur Marchande" valeur={`${valeurStockTotal.toLocaleString()}`} suffix="F" subtext="Estimation prix vente" color="slate" />
          <StatCard label="États Critiques" valeur={articlesEnAlerte} subtext="Sous seuil d'alerte" color={articlesEnAlerte > 0 ? "rose" : "slate"} important={articlesEnAlerte > 0} />
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center bg-white p-1.5 rounded-xl border border-slate-200">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="Rechercher un produit..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 transition-all font-medium text-slate-900 text-xs" />
          </div>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
              {categoriesList.map(cat => (
                <button key={cat} onClick={() => setFiltreCategorie(cat)}
                  className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${
                    filtreCategorie === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[7px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-2 py-1.5">Article</th>
                    <th className="px-2 py-1.5">Prix</th>
                    <th className="px-2 py-1.5">Casiers</th>
                    <th className="px-2 py-1.5">Stock Unitaire</th>
                    <th className="px-2 py-1.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produitsFiltrés.map((p) => {
                    const estEnAlerte = p.stockTotal <= p.stockAlerte;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${estEnAlerte ? 'bg-red-50/30' : ''}`}>
                        <td className="px-2 py-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-sm bg-slate-100 border border-slate-200`}>
                              {p.emoji || '📦'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{p.nom}</div>
                              <div className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{p.categorie}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                             <span className="text-slate-900 font-bold text-[10px]">{p.prix.toLocaleString()} F</span>
                         </td>
                         <td className="px-2 py-1">
                           {p.categorie === 'Boisson' ? formatStock(p.stockTotal, p.unitesParCasier) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="px-2 py-1">
                             <div className="flex items-center gap-1.5">
                                 <span className={`text-xs font-bold ${estEnAlerte ? 'text-red-500' : 'text-slate-900'}`}>{p.stockTotal}</span>
                                 <span className="text-[7px] font-bold text-slate-400 uppercase">{p.uniteMesure || 'u'}</span>
                             </div>
                         </td>
                        <td className="px-2 py-1">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => {
                                   setSelectedProduct(p);
                                   setStockReel(p.stockTotal);
                                   setShowComptage(true);
                               }}
                               className="px-2 py-1 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5"
                             >
                               <Archive size={12} /> Inventaire
                             </button>
                             {p.categorie !== 'Ingrédient' && (
                               <button 
                                 onClick={() => {
                                     setSelectedProduct(p);
                                     setShowRecetteModal(true);
                                 }}
                                 className="px-2 py-1 border border-indigo-200 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5"
                               >
                                 <Plus size={12} /> Recette
                               </button>
                             )}
                             <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button onClick={() => ajusterStock(p, -1, 'unite')} className="p-1 text-slate-400 hover:text-slate-900"><Minus size={12} /></button>
                                <button onClick={() => ajusterStock(p, 1, 'unite')} className="p-1 text-slate-900"><Plus size={12} /></button>
                             </div>
                             {p.categorie === 'Boisson' && (
                               <div className="flex bg-slate-900 rounded-lg p-0.5 text-white shadow-lg shadow-slate-900/10">
                                  <button onClick={() => ajusterStock(p, -1, 'casier')} className="p-1 opacity-50 hover:opacity-100"><Layers size={12} /></button>
                                  <button onClick={() => ajusterStock(p, 1, 'casier')} className="p-1"><Plus size={12} /></button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-2xl p-4 shadow-2xl relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={18} /></button>
              <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nouvel Article</h3>
                  <p className="text-slate-500 font-medium mt-0.5 text-[10px]">Ajoutez une référence à votre catalogue de vente.</p>
              </div>
              <form onSubmit={ajouterProduit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Désignation</label>
                  <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} placeholder="Ex: Heineken 33cl" required 
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-3 outline-none focus:border-slate-900 transition-all font-bold text-slate-900 text-xs" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Catégorie</label>
                  <select value={categorie} onChange={(e)=>setCategorie(e.target.value as any)} className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 outline-none font-bold text-slate-900 text-[10px]">
                    <option value="Boisson">🥤 Boissons</option>
                    <option value="Ingrédient">🍅 Ingrédients</option>
                    <option value="A-Côté">🍿 Divers</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Prix Vente</label>
                  <input type="number" value={prix} onChange={(e)=>setPrix(Number(e.target.value))} required className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-3 outline-none font-bold text-slate-900 text-xs" />
                </div>
                {categorie === 'Boisson' && (
                  <div className="col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Unités / Casier</label>
                    <input type="number" value={unitesParCasier} onChange={(e)=>setUnitesParCasier(Number(e.target.value))} className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-3 outline-none font-bold text-slate-900 text-xs" />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Poste de Production</label>
                  <select value={destination} onChange={(e)=>setDestination(e.target.value as any)} className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 outline-none font-bold text-slate-900 text-[10px]">
                    <option value="cuisine">👨‍🍳 Cuisine</option>
                    <option value="bar">🍺 Bar</option>
                    <option value="pizzeria">🍕 Pizzeria</option>
                    <option value="grill">🥩 Grillades</option>
                    <option value="chicha">💨 Chicha</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-3 mt-4">
                  <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Abandonner</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold uppercase text-[9px] tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Comptage Physique */}
        {showComptage && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl p-4 shadow-2xl relative"
             >
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">{selectedProduct.emoji}</div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedProduct.nom}</h3>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Régularisation</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div className="text-center flex-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Théorique</p>
                            <p className="text-xl font-bold text-slate-900">{selectedProduct.stockTotal}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center flex-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Écart</p>
                            <p className={`text-xl font-bold ${stockReel - selectedProduct.stockTotal < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {stockReel - selectedProduct.stockTotal > 0 ? '+' : ''}{stockReel - selectedProduct.stockTotal}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Réelle Comptée</label>
                        <input type="number" autoFocus value={stockReel} onChange={(e) => setStockReel(Number(e.target.value))}
                            className="w-full h-10 bg-slate-100 border-2 border-slate-200 rounded-xl text-center text-lg font-black text-slate-900 outline-none focus:border-slate-900 transition-all" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowComptage(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Annuler</button>
                        <button onClick={validerComptage} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold uppercase text-[9px] tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                            Valider
                        </button>
                    </div>
                </div>
             </motion.div>
          </div>
        )}

        {/* Modal Configuration Recette */}
        {showRecetteModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative"
             >
                <button onClick={() => setShowRecetteModal(false)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900">Composition : {selectedProduct.nom}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Définissez les ingrédients consommés lors de la vente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Liste des ingrédients actuels */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ingrédients de la recette</h4>
                    <div className="bg-slate-50 rounded-2xl p-3 min-h-[150px] border border-slate-100">
                      {((selectedProduct as any).recette || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                          <Plus size={32} className="mb-2" />
                          <p className="text-[10px] font-bold uppercase">Aucun ingrédient</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {((selectedProduct as any).recette || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.nom}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.quantite} unité(s)</p>
                              </div>
                              <button onClick={() => supprimerIngredientRecette(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ajout d'un ingrédient */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ajouter un élément</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Choisir Ingrédient</label>
                        <select 
                          value={ingredientSelectionne} 
                          onChange={(e) => setIngredientSelectionne(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 outline-none font-bold text-slate-900 text-xs"
                        >
                          <option value="">Sélectionner...</option>
                          {produits.filter(p => p.categorie === 'Ingrédient').map(p => (
                            <option key={p.id} value={p.id}>{p.nom}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Quantité à déduire</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            value={quantiteIngredient} 
                            onChange={(e) => setQuantiteIngredient(Number(e.target.value))}
                            className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-xs" 
                          />
                          <button 
                            onClick={ajouterIngredientRecette}
                            disabled={!ingredientSelectionne}
                            className="h-10 px-4 bg-slate-900 text-white rounded-xl font-bold text-[8px] uppercase tracking-widest disabled:opacity-30 transition-all"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                      <div className="flex gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={18} />
                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                          Le stock des ingrédients sera déduit automatiquement à chaque validation de commande en cuisine.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setShowRecetteModal(false)} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                        Terminer la configuration
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionStocks;
