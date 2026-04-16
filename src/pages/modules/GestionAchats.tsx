import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, ShoppingCart, Plus, Calendar, Package, 
  ArrowLeft, Save, Truck, Receipt, TrendingUp, X, 
  ChevronRight, Info, Download, ArrowUpRight 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import type { Produit } from '../../store/posStore';
import toast from 'react-hot-toast';
import StatCard from '../../components/ui/StatCard';

interface Achat {
    id: string;
    produitNom: string;
    produitId: string;
    quantiteSaisie: number;
    quantiteUnites: number;
    modeAchat: 'casier' | 'bouteille';
    prixUnitaire: number;
    total: number;
    date: string;
    fournisseur?: string;
}

const GestionAchats = () => {
    const { profil } = useAuthStore();
    const [achats, setAchats] = useState<Achat[]>([]);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Formulaire
    const [produitId, setProduitId] = useState('');
    const [modeAchat, setModeAchat] = useState<'casier' | 'bouteille'>('casier');
    const [quantite, setQuantite] = useState(1);
    const [prixAchat, setPrixAchat] = useState(0); 
    const [fournisseur, setFournisseur] = useState('');

    useEffect(() => {
        if (!profil?.etablissement_id) return;

        const qA = query(collection(db, 'achats'), where('etablissement_id', '==', profil.etablissement_id));
        const unsubA = onSnapshot(qA, (snap) => {
            setAchats(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Achat[]);
        });

        const qP = query(collection(db, 'produits'), where('etablissement_id', '==', profil.etablissement_id));
        const unsubP = onSnapshot(qP, (snap) => {
            setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[]);
        });

        return () => { unsubA(); unsubP(); };
    }, [profil?.etablissement_id]);

    const enregistrerAchat = async (e: React.FormEvent) => {
        e.preventDefault();
        const produit = produits.find(p => p.id === produitId);
        if (!produit) return;

        const toastId = toast.loading("Mise à jour des inventaires...");

        try {
            const batch = writeBatch(db);
            const total = quantite * prixAchat;
            const quantiteUnites = modeAchat === 'casier' ? quantite * (produit.unitesParCasier || 1) : quantite;
            
            const achatRef = doc(collection(db, 'achats'));
            batch.set(achatRef, {
                produitId, produitNom: produit.nom, modeAchat,
                quantiteSaisie: quantite, quantiteUnites, prixUnitaire: prixAchat,
                total, fournisseur, date: new Date().toISOString(),
                etablissement_id: profil?.etablissement_id
            });

            const produitRef = doc(db, 'produits', produitId);
            batch.update(produitRef, { stockTotal: (produit.stockTotal || 0) + quantiteUnites });

            const transactionRef = doc(collection(db, 'transactions_pos'));
            batch.set(transactionRef, {
                type: 'depense', total, date: new Date().toISOString(),
                description: `Achat : ${produit.nom} (+${quantiteUnites} u)`,
                etablissement_id: profil?.etablissement_id, modePaiement: 'comptant'
            });

            await batch.commit();
            toast.success("Stock provisionné avec succès !", { id: toastId });
            setShowForm(false); setQuantite(1); setPrixAchat(0); setProduitId(''); setFournisseur('');
        } catch {
            toast.error("Échec de l'opération", { id: toastId });
        }
    };

    const depensesMois = achats.filter(a => {
        const d = new Date(a.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, a) => acc + (a.total || 0), 0);

    const dernierAchat = achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Approvisionnements</h2>
                    <p className="text-slate-500 font-medium mt-1">Gérez vos arrivages stocks et les flux de trésorerie associés.</p>
                </div>
                {!showForm && (
                <button onClick={() => setShowForm(true)}
                    className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                    <Plus size={18} /> Enregistrer un arrivage
                </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Dépenses (Mois)" valeur={`${depensesMois.toLocaleString()}`} suffix="F" color="slate" />
                <StatCard label="Volumes Entrées" valeur={achats.length} subtext="Bons d'achats" color="slate" />
                <StatCard label="Dernière Article" valeur={dernierAchat ? dernierAchat.produitNom : '-'} subtext={dernierAchat ? new Date(dernierAchat.date).toLocaleDateString() : 'Aucun'} color="slate" />
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl relative"
                    >
                        <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                        <div className="mb-10">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Nouveau Bon d'Achat</h3>
                            <p className="text-slate-500 font-medium mt-1">Saisissez les détails de l'approvisionnement pour mettre à jour les stocks.</p>
                        </div>

                        <form onSubmit={enregistrerAchat} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Référence Article</label>
                                <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-slate-900 transition-all font-bold text-slate-900" 
                                    value={produitId} onChange={(e) => setProduitId(e.target.value)} required>
                                    <option value="">Sélectionnez un produit...</option>
                                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Actuel: {p.stockTotal})</option>)}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Unité de mesure</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    <button type="button" onClick={() => setModeAchat('casier')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${modeAchat === 'casier' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Casiers</button>
                                    <button type="button" onClick={() => setModeAchat('bouteille')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${modeAchat === 'bouteille' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Unités</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Quantité à entrer</label>
                                <input type="number" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" min="1" required />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Prix Achat unitaire (F)</label>
                                <input type="number" value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" required />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Source / Fournisseur</label>
                                <input type="text" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-600" placeholder="Ex: Bracingo..." />
                            </div>

                            <div className="col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between">
                                 <div>
                                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Coût d'acquisition Total</p>
                                     <p className="text-3xl font-bold text-slate-900">{(quantite * prixAchat).toLocaleString()} <span className="text-sm font-black italic">F CFA</span></p>
                                 </div>
                                 <button type="submit" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Valider le Bon</button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">Historique des entrées</h3>
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Voir l'archive complète</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-5">Date / Heure</th>
                                        <th className="px-8 py-5">Article Flux</th>
                                        <th className="px-8 py-5">Volume Entrant</th>
                                        <th className="px-8 py-5 text-right">Dépense Associée</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achat => (
                                        <tr key={achat.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-900">{new Date(achat.date).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(achat.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-slate-900 text-base">{achat.produitNom}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Source: {achat.fournisseur || '-'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 text-slate-900 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                       +{achat.quantiteSaisie} {achat.modeAchat}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium italic">({achat.quantiteUnites} unités net)</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-lg font-bold text-slate-900">{achat.total.toLocaleString()} F</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GestionAchats;
