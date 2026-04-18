import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator, Activity, ArrowRight, X, Download,
  Wallet, ShoppingCart, Users, AlertCircle, History, Receipt, Trash2, Search, RefreshCcw
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ModalRapportFiscal from '../../components/modals/ModalRapportFiscal';

interface Transaction {
  id: string;
  total: number;
  montantRecu: number;
  montantRestant: number;
  modePaiement: 'comptant' | 'credit';
  clientNom?: string;
  clientContact?: string;
  type: 'sur_place' | 'a_emporter' | 'depense';
  description?: string;
  date: string;
  serveurNom?: string;
  tableNom?: string;
}

const GestionFinance = () => {
  const { profil } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journal' | 'dettes' | 'charges' | 'recurrentes'>('journal');
  const [charges, setCharges] = useState<{id: string, montant: number, motif: string, date: string}[]>([]);
  const [chargesRecurrentes, setChargesRecurrentes] = useState<{id: string, montant: number, motif: string}[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showRecurenteModal, setShowRecurenteModal] = useState(false);
  const [nouveauMontantCharge, setNouveauMontantCharge] = useState('');
  const [nouveauMotifCharge, setNouveauMotifCharge] = useState('');
  const [clientRecherche, setClientRecherche] = useState('');
  const [showFiscalModal, setShowFiscalModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'transactions_pos'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      setTransactions(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    const qCharges = query(collection(db, 'charges_fixes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubCharges = onSnapshot(qCharges, (snap) => {
      setCharges(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]);
    });

    const qRecur = query(collection(db, 'charges_recurrentes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubRecur = onSnapshot(qRecur, (snap) => {
      setChargesRecurrentes(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]);
    });

    return () => { unsub(); unsubCharges(); unsubRecur(); };
  }, [profil?.etablissement_id]);

  const ajouterCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMontantCharge || !nouveauMotifCharge) return;
    try {
      await addDoc(collection(db, 'charges_fixes'), {
        montant: Number(nouveauMontantCharge),
        motif: nouveauMotifCharge,
        date: new Date().toISOString(),
        etablissement_id: profil.etablissement_id
      });
      toast.success("Charge enregistrée !");
      setNouveauMontantCharge(''); setNouveauMotifCharge(''); setShowChargeModal(false);
    } catch { toast.error("Erreur charge"); }
  };

  const ajouterChargeRecurrente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMontantCharge || !nouveauMotifCharge) return;
    try {
      await addDoc(collection(db, 'charges_recurrentes'), {
        montant: Number(nouveauMontantCharge),
        motif: nouveauMotifCharge,
        etablissement_id: profil.etablissement_id
      });
      toast.success("Charge récurrente programmée !");
      setNouveauMontantCharge(''); setNouveauMotifCharge(''); setShowRecurenteModal(false);
    } catch { toast.error("Erreur"); }
  };

  const supprimerCharge = async (id: string, collectionName: string = 'charges_fixes') => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Supprimé !");
    } catch { toast.error("Échec"); }
  };

  const encaisserDette = async (transactionId: string, montant: number) => {
    try {
      const trans = transactions.find(t => t.id === transactionId);
      if (!trans) return;

      const nouveauRecu = (trans.montantRecu || 0) + montant;
      const nouveauRestant = trans.total - nouveauRecu;

      const docRef = doc(db, 'transactions_pos', transactionId);
      await updateDoc(docRef, {
        montantRecu: nouveauRecu,
        montantRestant: nouveauRestant,
        modePaiement: nouveauRestant <= 0 ? 'comptant' : 'credit'
      });

      toast.success(`Encaissement de ${montant.toLocaleString()} F réussi !`);
    } catch (error) {
      toast.error("Erreur lors de l'encaissement");
      console.error(error);
    }
  };

  // Calculs Financiers
  const totalEncaisse = transactions.filter(t => t.type !== 'depense').reduce((acc, t) => acc + (t.montantRecu || t.total), 0);
  const dettesClients = transactions.filter(t => t.type !== 'depense').reduce((acc, t) => acc + (t.montantRestant || 0), 0);
  const depensesAchats = transactions.filter(t => t.type === 'depense').reduce((acc, t) => acc + t.total, 0);
  
  // Total des charges fixes du mois + charges récurrentes automatiques
  const totalChargesPonctuelles = charges.reduce((acc, c) => acc + c.montant, 0);
  const totalChargesRecurrentes = chargesRecurrentes.reduce((acc, c) => acc + c.montant, 0);
  const totalCharges = totalChargesPonctuelles + totalChargesRecurrentes;
  
  const resultatNet = totalEncaisse - depensesAchats - totalCharges;

  const transactionsDettes = transactions.filter(t => (t.montantRestant || 0) > 0);

  const chartData = (() => {
    const dataMap: Record<string, number> = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        last7Days.push({ key, label: d.toLocaleDateString('fr-FR', { weekday: 'short' }) });
        dataMap[key] = 0;
    }
    transactions.forEach(t => {
        const key = t.date.split('T')[0];
        if (dataMap[key] !== undefined && t.type !== 'depense') dataMap[key] += t.montantRecu || t.total;
    });
    return last7Days.map(day => ({ name: day.label, revenue: dataMap[day.key] }));
  })();

  const genererRapportPDF = () => {
    const docPdf = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    docPdf.setFontSize(22); docPdf.setTextColor(15, 23, 42); docPdf.text("GESTCAVE PRO", 14, 20);
    docPdf.setFontSize(10); docPdf.setTextColor(100, 116, 139); docPdf.text(`Livre de Caisse - Rapport du Patron (${profil?.nom || 'Propriétaire'})`, 14, 28);
    
    autoTable(docPdf, {
      startY: 40,
      head: [['Date', 'Opération', 'Détail / Client', 'Mode', 'Entrée', 'Sortie']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type === 'depense' ? 'ACHAT STOCK' : 'VENTE POS',
        t.clientNom || t.tableNom || t.description || 'DIRECT',
        t.modePaiement?.toUpperCase() || 'CASH',
        t.type !== 'depense' ? `${(t.montantRecu || t.total).toLocaleString()} F` : '-',
        t.type === 'depense' ? `${t.total.toLocaleString()} F` : '-'
      ]),
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 }, 
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 7 }
    });

    let currentY = (docPdf as any).lastAutoTable.finalY + 15;
    
    if (charges.length > 0) {
        docPdf.setFontSize(10); docPdf.setTextColor(225, 29, 72); docPdf.text("CHARGES & FRAIS FIXES", 14, currentY);
        autoTable(docPdf, {
            startY: currentY + 5,
            head: [['Date', 'Motif / Désignation', 'Montant']],
            body: charges.map(c => [new Date(c.date).toLocaleDateString(), c.motif, `${c.montant.toLocaleString()} F`]),
            headStyles: { fillColor: [225, 29, 72] },
            styles: { fontSize: 7 }
        });
        currentY = (docPdf as any).lastAutoTable.finalY + 15;
    }

    docPdf.setFontSize(10); docPdf.setTextColor(15, 23, 42);
    docPdf.text(`CAISSE BRUTE (Ventes): ${totalEncaisse.toLocaleString()} F`, 14, currentY);
    docPdf.text(`TOTAL ACHATS STOCK: -${depensesAchats.toLocaleString()} F`, 14, currentY + 7);
    docPdf.text(`TOTAL CHARGES FIXES: -${totalCharges.toLocaleString()} F`, 14, currentY + 14);
    
    docPdf.setFontSize(14); docPdf.setTextColor(5, 150, 105);
    docPdf.text(`RÉSULTAT NET RÉEL: ${resultatNet.toLocaleString()} F`, 14, currentY + 28);

    docPdf.save(`Rapport_Finance_${date}.pdf`);
    toast.success("Rapport financier complet généré !");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Calcul des finances...</div>;

  return (
    <div className="space-y-4 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-black text-slate-900 tracking-tight uppercase">Comptabilité Patron</h2>
          <p className="text-slate-500 font-medium text-[10px]">Surveillez l'argent encaissé, les dettes et les sorties de stock.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowChargeModal(true)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Calculator size={14} /> Charge
            </button>
            <button onClick={() => setShowRecurenteModal(true)} className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all">
              <RefreshCcw size={14} /> Récurrente
            </button>
            <button onClick={genererRapportPDF} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Download size={14} /> Journal
            </button>
            <button onClick={() => setShowFiscalModal(true)} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
              <Calculator size={14} /> Fiscal
            </button>
        </div>
      </header>

      {/* Résumé des flux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Encaissé" valeur={`${totalEncaisse.toLocaleString()}`} suffix="F" color="emerald" important />
          <StatCard label="Dettes" valeur={`${dettesClients.toLocaleString()}`} suffix="F" color="rose" important={dettesClients > 0} icon={<AlertCircle size={14}/>} />
          <StatCard label="Achats" valeur={`${depensesAchats.toLocaleString()}`} suffix="F" color="slate" />
          <StatCard label="Caisse Nette" valeur={`${resultatNet.toLocaleString()}`} suffix="F" color="slate" subtext="Réel" />
      </div>

      {/* Onglets */}
      <div className="flex bg-slate-100 p-0.5 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Journal
          </button>
          <button 
            onClick={() => setActiveTab('dettes')}
            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'dettes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dettes ({transactionsDettes.length})
          </button>
          <button 
            onClick={() => setActiveTab('charges')}
            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'charges' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Charges ({charges.length})
          </button>
          <button 
            onClick={() => setActiveTab('recurrentes')}
            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'recurrentes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Récurrentes ({chargesRecurrentes.length})
          </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'journal' ? (
          <motion.div key="journal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Graphique de Performance */}
                <div className="lg:col-span-2 bg-white p-3 lg:p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Évolution (7j)</h3>
                      <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 700}} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 700}} dx={-5} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px'}}
                          itemStyle={{fontWeight: 800, color: '#0f172a', fontSize: '10px'}}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alertes et Info */}
                <div className="bg-slate-900 rounded-xl p-4 text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator size={60} />
                    </div>
                    <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">Conseil</h3>
                    <div className="space-y-2 relative z-10">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <TrendingUp size={16} />
                            </div>
                            <p className="text-[11px] text-slate-300 leading-tight"><span className="text-white font-bold">Encaissements :</span> Argent réel disponible.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                                <History size={16} />
                            </div>
                            <p className="text-[11px] text-slate-300 leading-tight"><span className="text-white font-bold">Dettes :</span> Suivez les remboursements.</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            <span>Rentabilité</span>
                            <span className="text-emerald-400">{totalEncaisse > 0 ? Math.round((resultatNet / totalEncaisse) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${totalEncaisse > 0 ? (resultatNet / totalEncaisse) * 100 : 0}%` }} className="h-full bg-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Livre de Caisse */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Journal</h3>
                    <div className="flex items-center gap-2">
                        <Search size={12} className="text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="CLIENT..." 
                          className="bg-transparent border-none outline-none text-[8px] font-black uppercase tracking-widest w-32"
                          value={clientRecherche}
                          onChange={(e) => setClientRecherche(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Opération</th>
                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Flux</th>
                                <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions
                              .filter(t => !clientRecherche || (t.clientNom?.toLowerCase().includes(clientRecherche.toLowerCase())))
                              .map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-4 py-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === 'depense' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {t.type === 'depense' ? <ShoppingCart size={14} /> : <Receipt size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{t.type === 'depense' ? 'ACHAT' : 'VENTE'}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-1.5">
                                        <p className="font-bold text-slate-600 text-[10px] uppercase">{t.clientNom || t.tableNom || t.description || 'DIRECT'}</p>
                                    </td>
                                    <td className="px-4 py-1.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${t.type === 'depense' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                            {t.type === 'depense' ? 'SORTIE' : 'ENTRÉE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-1.5 text-right">
                                        <p className="font-display font-black text-slate-900 text-xs">{t.type === 'depense' ? '-' : '+'}{(t.montantRecu || t.total).toLocaleString()} F</p>
                                        {t.montantRestant! > 0 && <p className="text-[8px] font-black text-rose-500 uppercase">Reste: {t.montantRestant?.toLocaleString()} F</p>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </motion.div>
        ) : activeTab === 'dettes' ? (
          <motion.div key="dettes" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transactionsDettes.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                      <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
                      <h3 className="text-lg font-display font-black text-slate-900 uppercase">AUCUNE DETTE EN COURS</h3>
                      <p className="text-slate-400 font-medium">Félicitations, tous vos clients sont à jour !</p>
                  </div>
                ) : (
                  transactionsDettes.map(t => (
                    <div key={t.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border-b-4 border-b-rose-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dette Totale</p>
                                <p className="text-xl font-display font-black text-rose-600 leading-tight">{t.montantRestant?.toLocaleString()} F</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div>
                                <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">{t.clientNom || 'Client Inconnu'}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Calendar size={12} /> Pris le {new Date(t.date).toLocaleDateString()}
                                </p>
                            </div>
                            {t.clientContact && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                                    <CreditCard size={12} /> {t.clientContact}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-50 space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encaisser un remboursement</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => encaisserDette(t.id, t.montantRestant!)}
                                  className="py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                >
                                  Totalité
                                </button>
                                <button 
                                  onClick={() => {
                                    const m = prompt("Montant du remboursement partiel (F) ?");
                                    if (m) encaisserDette(t.id, parseInt(m));
                                  }}
                                  className="py-3 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                  Partiel
                                </button>
                            </div>
                        </div>
                    </div>
                  ))
                )}
            </div>
          </motion.div>
        ) : activeTab === 'recurrentes' ? (
          <motion.div key="recurrentes" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-6 flex justify-between items-center shadow-xl shadow-indigo-200">
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Frais Fixes Automatiques</h3>
                 <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Le loyer et autres charges programmées sont déduits chaque mois du bénéfice net.</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Total Mensuel</p>
                  <p className="text-3xl font-black tracking-tighter">{totalChargesRecurrentes.toLocaleString()} F</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chargesRecurrentes.map(c => (
                  <div key={c.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                          <RefreshCcw size={18} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{c.motif}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prélèvement Mensuel</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{c.montant.toLocaleString()} F</p>
                        <button onClick={() => supprimerCharge(c.id, 'charges_recurrentes')} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                           <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="charges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liste des charges & frais d'exploitation</h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {charges.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/30 transition-all">
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-400">
                                        {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{c.motif}</p>
                                    </td>
                                    <td className="px-4 py-3 font-display font-black text-rose-600">
                                        -{c.montant.toLocaleString()} F
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => supprimerCharge(c.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {charges.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Aucune charge enregistrée</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showChargeModal || showRecurenteModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl relative"
            >
              <button onClick={() => { setShowChargeModal(false); setShowRecurenteModal(false); }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button>
              <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight underline decoration-rose-500 decoration-4 underline-offset-8">
                    {showRecurenteModal ? 'Programmer une Charge' : 'Décaissement Ponctuel'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-2">
                    {showRecurenteModal ? 'Définissez un frais qui revient chaque mois.' : 'Enregistrez une dépense immédiate.'}
                  </p>
              </div>
              <form onSubmit={showRecurenteModal ? ajouterChargeRecurrente : ajouterCharge} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Désignation / Motif</label>
                  <input type="text" value={nouveauMotifCharge} onChange={(e) => setNouveauMotifCharge(e.target.value)} required placeholder="Ex: Loyer, Électricité, Internet..."
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-bold text-slate-900" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Montant Mensuel (F CFA)</label>
                  <input type="number" value={nouveauMontantCharge} onChange={(e) => setNouveauMontantCharge(e.target.value)} required placeholder="0"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-black text-rose-600 text-xl" />
                </div>
                <button type="submit" className={`w-full py-3 ${showRecurenteModal ? 'bg-indigo-600' : 'bg-rose-600'} text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-4`}>
                  {showRecurenteModal ? 'Programmer Mensuellement' : 'Confirmer le décaissement'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ModalRapportFiscal 
        isOpen={showFiscalModal} 
        onClose={() => setShowFiscalModal(false)} 
        defaultCA={1850000} 
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionFinance;
