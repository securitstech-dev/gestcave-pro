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
        <div className="space-y-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-display font-black text-slate-900 tracking-tight uppercase">Approvisionnements</h2>
                    <p className="text-slate-500 font-medium text-[10px]">Gérez vos arrivages stocks et les flux de trésorerie.</p>
                </div>
                {!showForm && (
                <button onClick={() => setShowForm(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                    <Plus size={14} /> Nouvel arrivage
                </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Dépenses (Mois)" valeur={`${depensesMois.toLocaleString()}`} suffix="F" color="slate" />
                <StatCard label="Volumes Entrées" valeur={achats.length} color="slate" />
                <StatCard label="Dernier Article" valeur={dernierAchat ? dernierAchat.produitNom : '-'} subtext={dernierAchat ? new Date(dernierAchat.date).toLocaleDateString() : 'Aucun'} color="slate" />
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xl relative"
                    >
                        <button onClick={() => setShowForm(false)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={18} /></button>
                        <div className="mb-4">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Nouveau Bon d'Achat</h3>
                            <p className="text-slate-500 font-medium text-[10px]">Saisissez les détails de l'approvisionnement.</p>
                        </div>

                        <form onSubmit={enregistrerAchat} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Référence Article</label>
                                <select className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-bold text-slate-900 text-sm" 
                                    value={produitId} onChange={(e) => setProduitId(e.target.value)} required>
                                    <option value="">Sélectionnez un produit...</option>
                                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Actuel: {p.stockTotal})</option>)}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Unité</label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button type="button" onClick={() => setModeAchat('casier')}
                                        className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${modeAchat === 'casier' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Casiers</button>
                                    <button type="button" onClick={() => setModeAchat('bouteille')}
                                        className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${modeAchat === 'bouteille' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Unités</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Quantité</label>
                                <input type="number" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))}
                                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-sm" min="1" required />
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Prix Achat unitaire (F)</label>
                                <input type="number" value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))}
                                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-sm" required />
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Source / Fournisseur</label>
                                <input type="text" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}
                                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-600 text-sm" placeholder="Ex: Bracingo..." />
                            </div>

                            <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                 <div>
                                     <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Coût Total</p>
                                     <p className="text-lg font-black text-slate-900">{(quantite * prixAchat).toLocaleString()} <span className="text-[10px] italic">F</span></p>
                                 </div>
                                 <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Valider</button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Historique</h3>
                            <button className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Archive</button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="text-[8px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Article</th>
                                        <th className="px-4 py-2">Volume</th>
                                        <th className="px-4 py-2 text-right">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achat => (
                                        <tr key={achat.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-4 py-1.5">
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{new Date(achat.date).toLocaleDateString()}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(achat.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <p className="font-bold text-slate-900 text-[11px] uppercase">{achat.produitNom}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase">{achat.fournisseur || '-'}</p>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                       +{achat.quantiteSaisie} {achat.modeAchat}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 font-bold italic uppercase">({achat.quantiteUnites} u)</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 text-right">
                                                <span className="text-sm font-black text-slate-900">{achat.total.toLocaleString()} F</span>
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
