import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator, Activity, ArrowRight, X, Download
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  total: number;
  modePaiement: 'comptant' | 'credit';
  clientNom?: string;
  type: 'sur_place' | 'a_emporter';
  date: string;
}

const GestionFinance = () => {
  const { profil } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tauxTaxe, setTauxTaxe] = useState(5.5);

  useEffect(() => {
    if (!profil?.etablissement_id) return;
    const q = query(collection(db, 'transactions_pos'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      setTransactions(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });
    return () => unsub();
  }, [profil?.etablissement_id]);

  const chiffreAffairesTotal = transactions.reduce((acc, t) => acc + (t.modePaiement === 'comptant' ? t.total : 0), 0);
  const totalCredits = transactions.reduce((acc, t) => acc + (t.modePaiement === 'credit' ? t.total : 0), 0);
  const taxesEstimees = (chiffreAffairesTotal * tauxTaxe) / 100;

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
        if (dataMap[key] !== undefined && t.modePaiement === 'comptant') dataMap[key] += t.total;
    });
    return last7Days.map(day => ({ name: day.label, revenue: dataMap[day.key] }));
  })();

  const genererRapportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("GESTCAVE PRO", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Rapport Financier - ${profil?.nom || 'Admin'}`, 14, 28);
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Moyen', 'Détail', 'Montant']],
      body: transactions.map(t => [new Date(t.date).toLocaleString('fr-FR'), t.modePaiement.toUpperCase(), t.clientNom || t.type, `${t.total.toLocaleString()} F`]),
      headStyles: { fillColor: [15, 23, 42] }, alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    doc.save(`Rapport_${date}.pdf`);
    toast.success("PDF Généré");
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Expertise Financière</h2>
          <p className="text-slate-500 font-medium mt-1">Livre de comptes exhaustif et analytique de votre activité.</p>
        </div>
        <button onClick={genererRapportPDF} className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
          <Download size={18} /> Exporter Rapport PDF
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Chiffre d'Affaires" valeur={`${chiffreAffairesTotal.toLocaleString()}`} suffix="F" color="slate" />
          <StatCard label="Dettes Clients" valeur={`${totalCredits.toLocaleString()}`} suffix="F" color="rose" important={totalCredits > 0} />
          <StatCard label="Provision Taxes" valeur={`${taxesEstimees.toLocaleString()}`} suffix="F" subtext={`Taux: ${tauxTaxe}%`} color="slate" />
          <StatCard label="Net (Estimation)" valeur={`${(chiffreAffairesTotal * 0.7).toLocaleString()}`} suffix="F" subtext="Marge estimée" color="slate" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="font-bold text-slate-900">Activité de Vente</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Flux des 7 derniers jours</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={0.1} fill="#0f172a" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">Journal des Transactions</h3>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                        <tr>
                          <th className="px-8 py-5">Date / Heure</th>
                          <th className="px-8 py-5 text-center">Règlement</th>
                          <th className="px-8 py-5 text-right">Montant Transaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {transactions.slice(0, 15).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5">
                                <p className="text-sm font-bold text-slate-900">{new Date(t.date).toLocaleDateString('fr-FR')}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                                  t.modePaiement === 'credit' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-900 border-slate-200'
                                }`}>
                                  {t.modePaiement}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <p className="font-bold text-slate-900 text-base">{t.total.toLocaleString()} F</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">{t.clientNom || 'Vente Directe'}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
          </div>

          <div className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-3"><ShieldCheck className="text-blue-400" /> Fiscalité</h3>
                  <div className="space-y-6">
                      <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Taux TVA (%)</p>
                          <input type="range" min="0" max="25" step="0.5" value={tauxTaxe} onChange={(e) => setTauxTaxe(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                          <div className="flex justify-between mt-2 font-bold text-[10px] text-slate-400"><span>0%</span><span>{tauxTaxe}%</span><span>25%</span></div>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Passif Fiscal</p>
                         <p className="text-4xl font-bold tracking-tighter">{taxesEstimees.toLocaleString()} <span className="text-sm">F</span></p>
                      </div>
                      <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Règlement Fiscal</button>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-sm uppercase"><Activity size={18} className="text-slate-400" /> Santé Financière</h3>
                  <div className="space-y-6">
                      <Barre label="Cash Encaissé" pct={(chiffreAffairesTotal / (chiffreAffairesTotal + totalCredits)) * 100} />
                      <Barre label="En-cours Clients" pct={(totalCredits / (chiffreAffairesTotal + totalCredits)) * 100} color="bg-rose-500" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

const Barre = ({ label, pct, color = "bg-slate-900" }: { label: string, pct: number, color?: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>{label}</span>
            <span className="text-slate-900">{Math.round(pct || 0)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${color} rounded-full`} />
        </div>
    </div>
);

export default GestionFinance;
