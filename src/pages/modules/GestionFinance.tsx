import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator, Activity, ArrowRight
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

    const q = query(
      collection(db, 'transactions_pos'), 
      where('etablissement_id', '==', profil.etablissement_id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      const sorted = data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, [profil?.etablissement_id]);

  // Calculs
  const chiffreAffairesTotal = transactions.reduce((acc, t) => acc + (t.modePaiement === 'comptant' ? t.total : 0), 0);
  const totalCredits = transactions.reduce((acc, t) => acc + (t.modePaiement === 'credit' ? t.total : 0), 0);
  const taxesEstimees = (chiffreAffairesTotal * tauxTaxe) / 100;

  // Préparation données graphique (7 derniers jours)
  const chartData = (() => {
    const dataMap: Record<string, number> = {};
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        last7Days.push({ key, label });
        dataMap[key] = 0;
    }

    transactions.forEach(t => {
        const key = t.date.split('T')[0];
        if (dataMap[key] !== undefined && t.modePaiement === 'comptant') {
            dataMap[key] += t.total;
        }
    });

    return last7Days.map(day => ({
        name: day.label,
        revenue: dataMap[day.key]
    }));
  })();

  const genererRapportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Indigo-500
    doc.text("GESTCAVE PRO", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Rapport Financier - ${profil?.nom || 'Établissement'}`, 14, 28);
    doc.text(`Édité le : ${date}`, 14, 34);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("Résumé Financier", 14, 45);
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Chiffre d'Affaires : ${chiffreAffairesTotal.toLocaleString()} F CFA`, 14, 53);
    doc.text(`Dettes Clients (À Recouvrer) : ${totalCredits.toLocaleString()} F CFA`, 14, 60);
    doc.text(`TVA Estimée (${tauxTaxe}%) : ${taxesEstimees.toLocaleString()} F CFA`, 14, 67);

    // Transactions Table
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Historique des Transactions (Dernières opérations)", 14, 80);

    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleString('fr-FR'),
      t.modePaiement.toUpperCase(),
      t.clientNom || (t.type === 'a_emporter' ? 'Emporter' : 'Sur Place'),
      `${t.total.toLocaleString()} F`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Date', 'Moyen de Pai.', 'Détail', 'Montant']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }, // Indigo
      alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
      styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`Rapport_GestCave_${date.replace(/\//g, '-')}.pdf`);
    toast.success("Rapport PDF généré !", { icon: '📄' });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Comptabilité & Finances</h2>
          <p className="text-slate-400 mt-1">Surveillez votre rentabilité et vos encaissements en temps réel.</p>
        </div>
        <div className="flex gap-3">
            <div className="hidden md:flex bg-white/5 border border-white/10 rounded-xl p-1">
                <button className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-lg shadow-lg">7 Jours</button>
                <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-300">30 Jours</button>
            </div>
            <button onClick={genererRapportPDF} className="btn-primary flex items-center gap-2 text-sm py-2 px-6">
                <FileText size={16} /> Exporter Rapport
            </button>
        </div>
      </header>

      {/* Résumé Financier Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Chiffre d'Affaires" 
            valeur={`${chiffreAffairesTotal.toLocaleString()}`}
            suffix="F" 
            icon={<TrendingUp size={20} className="text-emerald-400" />}
            tendance="+12%"
            color="emerald"
          />
          <StatCard 
            label="Dettes Clients" 
            valeur={`${totalCredits.toLocaleString()}`}
            suffix="F" 
            icon={<CreditCard size={20} className="text-amber-400" />}
            tendance="À recouvrer"
            color="amber"
          />
          <StatCard 
            label="TVA / Taxes Est." 
            valeur={`${taxesEstimees.toLocaleString()}`}
            suffix="F" 
            icon={<Calculator size={20} className="text-indigo-400" />}
            tendance={`Taux: ${tauxTaxe}%`}
            color="indigo"
          />
          <StatCard 
            label="Marge Nette (Est.)" 
            valeur={`${(chiffreAffairesTotal * 0.4).toLocaleString()}`}
            suffix="F" 
            icon={<Activity size={20} className="text-rose-400" />}
            tendance="Est. 40%"
            color="rose"
          />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          {/* GRAPHE ANALYTIQUE */}
          <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-xl font-bold text-white">Performances de Vente</h3>
                        <p className="text-slate-400 text-sm">Volume des encaissements sur les 7 derniers jours</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20">
                        Live Tracking
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                stroke="#64748b" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `${val/1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(val: number) => [`${val.toLocaleString()} F`, 'Chiffre d\'Affaires']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#6366f1" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* Liste des Transactions */}
              <div className="glass-panel overflow-hidden border-white/5">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <ArrowUpRight size={18} className="text-primary" />
                        Historique des Flux
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                        Tout voir <ArrowRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">
                        <tr>
                          <th className="px-6 py-4 text-left">Date & Heure</th>
                          <th className="px-6 py-4 text-center">Mode</th>
                          <th className="px-6 py-4">Détails</th>
                          <th className="px-6 py-4 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.slice(0, 10).map((t) => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                               <div className="text-sm font-medium text-white">
                                 {new Date(t.date).toLocaleDateString('fr-FR')}
                               </div>
                               <div className="text-[10px] text-slate-500">
                                 {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border ${
                                 t.modePaiement === 'credit' 
                                   ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                   : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                               }`}>
                                 {t.modePaiement}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                               {t.clientNom || (t.type === 'a_emporter' ? 'Vente Express' : 'Table Active')}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="font-bold text-white text-base">
                                 {t.total.toLocaleString()}
                               </span>
                               <span className="text-[10px] text-slate-500 ml-1">F</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
          </div>

          {/* Sidebar Modules */}
          <div className="space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 to-transparent border-indigo-500/20">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-indigo-400" />
                      Fiscalité Directe
                  </h3>
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Taux Appliqué</label>
                            <span className="text-indigo-400 font-bold text-xs">{tauxTaxe}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0"
                            max="30"
                            step="0.5"
                            value={tauxTaxe}
                            onChange={(e) => setTauxTaxe(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                          />
                      </div>
                      <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 text-center">
                         <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-tighter">Provisions de taxes</p>
                         <p className="text-4xl font-display font-black text-white">{taxesEstimees.toLocaleString()}<span className="text-sm ml-1 text-indigo-400 font-bold">F</span></p>
                      </div>
                      <button className="btn-primary w-full py-4 font-bold flex items-center justify-center gap-3">
                          Générer Déclaration <ArrowRight size={18} />
                      </button>
                  </div>
              </div>

              <div className="glass-panel p-8">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <PieChartIcon size={20} className="text-amber-400" />
                      Ventilation
                  </h3>
                  <div className="space-y-6">
                      <BarreProgres label="Cash Flow Reçu" valeur={chiffreAffairesTotal} total={chiffreAffairesTotal + totalCredits} couleur="bg-emerald-500" shadow="shadow-emerald-500/20" />
                      <BarreProgres label="Créances Client" valeur={totalCredits} total={chiffreAffairesTotal + totalCredits} couleur="bg-amber-500" shadow="shadow-amber-500/20" />
                      <div className="pt-4 mt-6 border-t border-white/5 space-y-2">
                          <p className="text-[10px] text-slate-500 font-medium">Recouvrement estimé : <span className="text-amber-400 font-bold">65%</span></p>
                          <div className="h-1 w-full bg-slate-800 rounded-full">
                              <div className="h-full w-[65%] bg-amber-500/50 rounded-full" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// Composants Internes

interface BarreProgresProps {
    label: string;
    valeur: number;
    total: number;
    couleur: string;
    shadow: string;
}

const BarreProgres = ({ label, valeur, total, couleur, shadow }: BarreProgresProps) => {
    const pourcentage = total > 0 ? (valeur / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{label}</span>
                <span>{Math.round(pourcentage)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pourcentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${couleur} rounded-full ${shadow} shadow-[0_0_10px_currentcolor]`} 
                />
            </div>
        </div>
    );
}

export default GestionFinance;
