import { Layers, ShoppingCart, Plus, Calendar, Package, ArrowLeft, Save, Truck, Receipt, TrendingUp, X, ChevronRight, Info } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { Produit } from '../../store/posStore';
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
            setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubA(); unsubP(); };
    }, [profil?.etablissement_id]);

    const enregistrerAchat = async (e: React.FormEvent) => {
        e.preventDefault();
        const produit = produits.find(p => p.id === produitId);
        if (!produit) return;

        const toastId = toast.loading("Enregistrement de l'approvisionnement...");

        try {
            const batch = writeBatch(db);
            const total = quantite * prixAchat;
            const quantiteUnites = modeAchat === 'casier' ? quantite * (produit.unitesParCasier || 1) : quantite;
            
            // 1. Créer l'Achat
            const achatRef = doc(collection(db, 'achats'));
            batch.set(achatRef, {
                produitId,
                produitNom: produit.nom,
                modeAchat,
                quantiteSaisie: quantite,
                quantiteUnites,
                prixUnitaire: prixAchat,
                total,
                fournisseur,
                date: new Date().toISOString(),
                etablissement_id: profil?.etablissement_id
            });

            // 2. Mettre à jour le Stock du Produit
            const produitRef = doc(db, 'produits', produitId);
            const nouveauStock = (produit.stockTotal || 0) + quantiteUnites;
            batch.update(produitRef, {
                stockTotal: nouveauStock
            });

            // 3. Créer la Transaction Financière (Dépense)
            const transactionRef = doc(collection(db, 'transactions_pos'));
            batch.set(transactionRef, {
                type: 'depense',
                total: total,
                date: new Date().toISOString(),
                description: `Achat stock : ${produit.nom} (${quantiteUnites} u)`,
                etablissement_id: profil?.etablissement_id,
                modePaiement: 'comptant'
            });

            await batch.commit();

            toast.success("Stock mis à jour avec succès !", { id: toastId });
            setShowForm(false);
            setQuantite(1);
            setPrixAchat(0);
            setProduitId('');
            setFournisseur('');
        } catch (err) {
            console.error(err);
            toast.error("Échec de l'enregistrement atomique", { id: toastId });
        }
    };

    // Statistiques
    const depensesMois = achats.filter(a => {
        const d = new Date(a.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, a) => acc + (a.total || 0), 0);

    const dernierAchat = achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">Approvisionnement</h2>
                    <p className="text-slate-400 mt-1">Gérez vos entrées de stock et suivez vos dépenses fournisseurs.</p>
                </div>
                {!showForm && (
                <button 
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center gap-2 py-3 px-6 shadow-indigo-500/20 shadow-lg"
                >
                    <Plus size={18} /> Nouvel Achat
                </button>
                )}
            </header>

            {/* Statistiques Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Achats du Mois" 
                    valeur={`${depensesMois.toLocaleString()}`} 
                    suffix="F"
                    subtext="Volume mensuel"
                    icon={<Receipt size={20} className="text-indigo-400" />}
                    color="indigo"
                />
                <StatCard 
                    label="Dernière Entrée" 
                    valeur={dernierAchat ? dernierAchat.produitNom : 'Aucun'} 
                    subtext={dernierAchat ? new Date(dernierAchat.date).toLocaleDateString('fr-FR') : '-'}
                    icon={<Truck size={20} className="text-emerald-400" />}
                    color="emerald"
                />
                <StatCard 
                    label="Fournisseurs" 
                    valeur={[...new Set(achats.map(a => a.fournisseur).filter(Boolean))].length} 
                    subtext="Partenaires enregistrés"
                    icon={<Package size={20} className="text-amber-400" />}
                    color="amber"
                />
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="glass-panel p-10 max-w-3xl border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-all text-white hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-3xl font-display font-bold text-white">Bon d'Approvisionnement</h3>
                            <p className="text-slate-400 mt-2">Enregistrez un nouvel achat pour augmenter vos stocks.</p>
                        </div>

                        <form onSubmit={enregistrerAchat} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <label className="label-style">Produit à réapprovisionner</label>
                                <select 
                                    className="glass-input w-full h-12 bg-slate-900 border-indigo-500/10" 
                                    value={produitId} 
                                    onChange={(e) => setProduitId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choisissez un produit du catalogue --</option>
                                    {produits.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom} (Stock actuel: {p.stockTotal})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="label-style px-1">Mode d'achat</label>
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                    <button 
                                        type="button"
                                        onClick={() => setModeAchat('casier')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${modeAchat === 'casier' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <Layers size={14} /> PAR CASIER
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setModeAchat('bouteille')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${modeAchat === 'bouteille' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <Package size={14} /> PAR UNITÉ
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label-style px-1">Quantité ({modeAchat === 'casier' ? 'Casiers' : 'Unités'})</label>
                                <input 
                                    type="number" 
                                    value={quantite}
                                    onChange={(e) => setQuantite(Number(e.target.value))}
                                    className="glass-input w-full h-12 text-center text-xl font-black text-indigo-400"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label-style px-1">Prix {modeAchat === 'casier' ? 'du casier' : 'de l\'unité'} (F CFA)</label>
                                <input 
                                    type="number" 
                                    value={prixAchat}
                                    onChange={(e) => setPrixAchat(Number(e.target.value))}
                                    className="glass-input w-full h-12 text-center text-xl font-black text-emerald-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label-style px-1">Fournisseur / Nom de l'agent</label>
                                <div className="relative">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input 
                                        type="text" 
                                        value={fournisseur}
                                        onChange={(e) => setFournisseur(e.target.value)}
                                        className="glass-input w-full pl-11 h-12"
                                        placeholder="Ex: Bracongo, Livreur Pierre..."
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 pt-6 flex border-t border-white/5 mt-4 items-center gap-6">
                                 <div className="flex-grow bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                         <Info size={20} />
                                     </div>
                                     <div>
                                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Coût Total Estimé</p>
                                         <p className="text-2xl font-display font-black text-white">{(quantite * prixAchat).toLocaleString()} <span className="text-xs text-slate-400 font-bold">F CFA</span></p>
                                     </div>
                                 </div>
                            </div>

                            <div className="col-span-2 flex gap-4 mt-2">
                                 <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-white">Annuler</button>
                                 <button type="submit" className="flex-1 btn-primary py-4 font-bold shadow-indigo-500/20 shadow-xl flex items-center justify-center gap-3">
                                    <Save size={20} /> ENREGISTRER L'ACHAT
                                 </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-panel overflow-hidden border-white/5 bg-slate-900/40"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2 text-white">
                                <TrendingUp size={18} className="text-emerald-400" />
                                Historique des Approvisionnements
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-8 py-5">Date & Heure</th>
                                        <th className="px-8 py-5">Article Acheter</th>
                                        <th className="px-8 py-5">Quantité Flux</th>
                                        <th className="px-8 py-5">Conversion Unitaire</th>
                                        <th className="px-8 py-5 text-right">Montant Global</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achat => (
                                        <tr key={achat.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="text-white text-sm font-medium">{new Date(achat.date).toLocaleDateString('fr-FR')}</div>
                                                <div className="text-[10px] text-slate-500 font-bold">{new Date(achat.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-white text-base">{achat.produitNom}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Source: {achat.fournisseur || 'Inconnue'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[10px] tracking-tighter uppercase">
                                                       +{achat.quantiteSaisie} {achat.modeAchat === 'casier' ? 'Casiers' : 'Unités'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-indigo-400 font-bold text-xs italic">
                                                +{achat.quantiteUnites} unités stockées
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-lg font-black text-white">{achat.total.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-500 ml-1 font-bold">F</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {achats.length === 0 && (
                                <div className="p-20 text-center text-slate-600 bg-white/2">
                                    <ShoppingCart size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium">Aucun bon d'achat enregistré dans le système.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`.label-style { @apply block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1; }`}</style>
        </div>
    );
};



export default GestionAchats;
