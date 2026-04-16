import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator, Activity, ArrowRight, X, Download,
  Wallet, ShoppingCart, Users, AlertCircle, History, Receipt
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
  const [tauxTaxe, setTauxTaxe] = useState(0); // On peut ajuster

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

  // Calculs Financiers
  const totalEncaisse = transactions.filter(t => t.type !== 'depense').reduce((acc, t) => acc + (t.montantRecu || t.total), 0);
  const dettesClients = transactions.filter(t => t.type !== 'depense').reduce((acc, t) => acc + (t.montantRestant || 0), 0);
  const depensesAchats = transactions.filter(t => t.type === 'depense').reduce((acc, t) => acc + t.total, 0);
  
  const resultatNet = totalEncaisse - depensesAchats;

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
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("GESTCAVE PRO", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Livre de Caisse - Rapport du Patron (${profil?.nom || 'Propriétaire'})`, 14, 28);
    
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Opération', 'Client/Détail', 'Contact', 'Mode', 'Débit', 'Crédit']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        t.type === 'depense' ? 'ACHAT STOCK' : 'VENTE POS',
        t.clientNom || t.tableNom || t.description || 'Direct',
        t.clientContact || '-',
        t.modePaiement?.toUpperCase() || 'CASH',
        t.type === 'depense' ? `${t.total.toLocaleString()}` : '-',
        t.type !== 'depense' ? `${(t.montantRecu || t.total).toLocaleString()}` : '-'
      ]),
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 }, 
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 7 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL ENCAISSÉ (CASH M-MONEY): ${totalEncaisse.toLocaleString()} F`, 14, finalY);
    doc.text(`TOTAL DETTES CLIENTS: ${dettesClients.toLocaleString()} F`, 14, finalY + 7);
    doc.text(`TOTAL SORTIES (ACHATS): ${depensesAchats.toLocaleString()} F`, 14, finalY + 14);
    doc.setFontSize(12);
    doc.text(`RÉSULTAT NET EN CAISSE: ${resultatNet.toLocaleString()} F`, 14, finalY + 25);

    doc.save(`Comptabilite_${date}.pdf`);
    toast.success("Livre de caisse exporté !");
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Comptabilité Patron</h2>
          <p className="text-slate-500 font-medium mt-1">Surveillez l'argent encaissé, les dettes et les sorties de stock.</p>
        </div>
        <button onClick={genererRapportPDF} className="px-8 py-5 rounded-2xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
          <Download size={20} /> Exporter le Grand Livre (PDF)
        </button>
      </header>

      {/* Résumé des flux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Argent Encaissé" valeur={`${totalEncaisse.toLocaleString()}`} suffix="F" color="emerald" important />
          <StatCard label="Arriérés (Dettes)" valeur={`${dettesClients.toLocaleString()}`} suffix="F" color="rose" important={dettesClients > 0} icon={<AlertCircle size={16}/>} />
          <StatCard label="Sorties Achats" valeur={`${depensesAchats.toLocaleString()}`} suffix="F" color="slate" />
          <StatCard label="Caisse Nette" valeur={`${resultatNet.toLocaleString()}`} suffix="F" color="slate" subtext="Revenu réel encaissé" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Graphique de Performance */}
          <div className="lg:col-span-2 bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Évolution des encaissements (7j)</h3>
                <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-10} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    itemStyle={{fontWeight: 800, color: '#0f172a', fontSize: '14px'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alertes et Info */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calculator size={120} />
              </div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Conseil de gestion</h3>
              <div className="space-y-6 relative z-10">
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp size={20} />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="text-white font-bold">Encaissements :</span> Représentent les règlements réels (Cash, Mobile). C'est l'argent disponible sur votre compte.</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                          <History size={20} />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="text-white font-bold">Dettes :</span> N'oubliez pas de relancer les clients qui ont une ardoise. Vos coordonnées sont notées dans le rapport.</p>
                  </div>
              </div>
              <div className="mt-14 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>Rentabilité brute</span>
                      <span className="text-emerald-400">{totalEncaisse > 0 ? Math.round((resultatNet / totalEncaisse) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${totalEncaisse > 0 ? (resultatNet / totalEncaisse) * 100 : 0}%` }} className="h-full bg-emerald-500" />
                  </div>
              </div>
          </div>
      </div>

      {/* Livre de Caisse */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Journal des opérations financières</h3>
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black text-slate-600 uppercase italic">Filtré par établissement</span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Opération</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détail / Client</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flux</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/30 transition-all group">
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'depense' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                          {t.type === 'depense' ? <ShoppingCart size={16} /> : <Receipt size={16} />}
                                      </div>
                                      <div>
                                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{t.type === 'depense' ? 'ACHAT STOCK' : 'VENTE TICKET'}</p>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-8 py-6">
                                  <p className="font-bold text-slate-600 text-[11px] uppercase truncate max-w-[150px]">{t.clientNom || t.tableNom || t.description || 'DIRECT'}</p>
                              </td>
                              <td className="px-8 py-6">
                                  <p className="text-[10px] font-bold text-slate-400">{t.clientContact || '-'}</p>
                              </td>
                              <td className="px-8 py-6">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${t.type === 'depense' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                      {t.type === 'depense' ? 'SORTIE' : 'ENTRÉE'}
                                  </span>
                              </td>
                              <td className="px-8 py-6 text-right font-display font-black text-slate-900">
                                  {t.type === 'depense' ? '-' : '+'}{(t.montantRecu || t.total).toLocaleString()} F
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionFinance;
