import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Calendar, Package, ArrowLeft, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Achat {
    id: string;
    produitNom: string;
    produitId: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    date: string;
    fournisseur?: string;
}

const GestionAchats = () => {
    const { profil } = useAuthStore();
    const [achats, setAchats] = useState<Achat[]>([]);
    const [produits, setProduits] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Formulaire
    const [produitId, setProduitId] = useState('');
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
            setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubA(); unsubP(); };
    }, [profil?.etablissement_id]);

    const enregistrerAchat = async (e: React.FormEvent) => {
        e.preventDefault();
        const produit = produits.find(p => p.id === produitId);
        if (!produit) return;

        try {
            const total = quantite * prixAchat;
            
            // 1. Créer l'entrée d'achat
            await addDoc(collection(db, 'achats'), {
                produitId,
                produitNom: produit.nom,
                quantite,
                prixUnitaire: prixAchat,
                total,
                fournisseur,
                date: new Date().toISOString(),
                etablissement_id: profil.etablissement_id
            });

            // 2. Mettre à jour le stock
            const nouveauStock = (produit.stockTotal || 0) + quantite;
            await updateDoc(doc(db, 'produits', produitId), {
                stockTotal: nouveauStock
            });

            // 3. (Optionnel) Créer une transaction de type "Depense" pour la compta
            await addDoc(collection(db, 'transactions_pos'), {
                type: 'depense',
                total: total,
                date: new Date().toISOString(),
                description: `Achat stock : ${produit.nom}`,
                etablissement_id: profil.etablissement_id,
                modePaiement: 'comptant'
            });

            toast.success("Achat enregistré et stock mis à jour !");
            setShowForm(false);
            setQuantite(1);
            setPrixAchat(0);
        } catch (err) {
            toast.error("Erreur lors de l'enregistrement");
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">Approvisionnement</h2>
                    <p className="text-slate-400 mt-1">Enregistrez vos achats de boissons et d'ingrédients.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouvel Achat
                    </button>
                )}
            </header>

            {showForm ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 max-w-2xl"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Créer un bon d'achat</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><ArrowLeft size={20}/></button>
                    </div>

                    <form onSubmit={enregistrerAchat} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="label-style">Produit à approvisionner</label>
                                <select 
                                    className="glass-input w-full bg-slate-900" 
                                    value={produitId} 
                                    onChange={(e) => setProduitId(e.target.value)}
                                    required
                                >
                                    <option value="">Sélectionner un produit...</option>
                                    {produits.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom} (Stock actuel: {p.stockTotal})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Quantité (Unités)</label>
                                <input 
                                    type="number" 
                                    className="glass-input w-full" 
                                    value={quantite} 
                                    onChange={(e) => setQuantite(Number(e.target.value))}
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="label-style">Prix d'achat unitaire (F)</label>
                                <input 
                                    type="number" 
                                    className="glass-input w-full" 
                                    value={prixAchat} 
                                    onChange={(e) => setPrixAchat(Number(e.target.value))}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="label-style">Fournisseur / Lieu d'achat</label>
                                <input 
                                    type="text" 
                                    className="glass-input w-full" 
                                    value={fournisseur} 
                                    onChange={(e) => setFournisseur(e.target.value)}
                                    placeholder="Ex: Marché central, Grossiste Boisson..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                             <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-500 font-bold">Annuler</button>
                             <button type="submit" className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                                <Save size={18} /> Valider l'achat
                             </button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <div className="glass-panel overflow-hidden border-white/5">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Produit</th>
                                <th className="px-6 py-4">Quantité</th>
                                <th className="px-6 py-4">P.U</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achat => (
                                <tr key={achat.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {new Date(achat.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">{achat.produitNom}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-mono">+{achat.quantite}</td>
                                    <td className="px-6 py-4 text-slate-400 font-mono">{achat.prixUnitaire.toLocaleString()} F</td>
                                    <td className="px-6 py-4 font-bold text-white">{achat.total.toLocaleString()} F</td>
                                    <td className="px-6 py-4 text-xs text-slate-500 italic">{achat.fournisseur || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {achats.length === 0 && (
                         <div className="p-20 text-center text-slate-600">
                            <ShoppingCart size={40} className="mx-auto mb-4 opacity-20" />
                            <p>Aucun achat enregistré pour le moment.</p>
                         </div>
                    )}
                </div>
            )}

            <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2; }`}</style>
        </div>
    );
};

export default GestionAchats;
