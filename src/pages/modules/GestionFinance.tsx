import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';

interface Transaction {
  id: string;
  total: number;
  modePaiement: 'comptant' | 'credit'; // simplified for reporting
  clientNom?: string;
  type: 'sur_place' | 'a_emporter';
  date: string;
}

const GestionFinance = () => {
  const { profil } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tauxTaxe, setTauxTaxe] = useState(5.5); // Exemple : 5.5%

  useEffect(() => {
    if (!profil?.id) return;

    // Récupérer toutes les transactions de l'établissement
    // Note: Pour une vraie app, on filtrerait par mois/jour par défaut
    const q = query(
      collection(db, 'transactions_pos'), 
      where('etablissementId', '==', profil.id),
      orderBy('date', 'desc')
    );
    
    // Fallback if index is not yet created
    const qBasic = query(collection(db, 'transactions_pos'), where('etablissementId', '==', profil.id));

    const unsub = onSnapshot(qBasic, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      // Sort manually if basic query used
      const sorted = data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, [profil?.id]);

  // Calculs
  const chiffreAffairesTotal = transactions.reduce((acc, t) => acc + (t.modePaiement === 'comptant' ? t.total : 0), 0);
  const totalCredits = transactions.reduce((acc, t) => acc + (t.modePaiement === 'credit' ? t.total : 0), 0);
  const taxesEstimees = (chiffreAffairesTotal * tauxTaxe) / 100;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Comptabilité & Taxes</h2>
          <p className="text-slate-400 mt-1">Gérez vos finances, vos crédits et vos obligations fiscales.</p>
        </div>
        <div className="flex gap-3">
            <button className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Calendar size={16} /> Ce mois
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm py-2">
                <FileText size={16} /> Exporter Rapport
            </button>
        </div>
      </header>

      {/* Résumé Financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardFinance 
            label="Chiffre d'Affaires (Comptant)" 
            valeur={`${chiffreAffairesTotal.toLocaleString()} F`} 
            icone={<TrendingUp className="text-emerald-400" />}
            tendance="+8.2%"
            couleur="emerald"
          />
          <CardFinance 
            label="Total Crédits (En attente)" 
            valeur={`${totalCredits.toLocaleString()} F`} 
            icone={<CreditCard className="text-amber-400" />}
            tendance="À recouvrer"
            couleur="amber"
          />
          <CardFinance 
            label="Taxes à Déclarer (Est.)" 
            valeur={`${taxesEstimees.toLocaleString()} F`} 
            icone={<Calculator className="text-indigo-400" />}
            tendance={`Taux: ${tauxTaxe}%`}
            couleur="indigo"
          />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          {/* Liste des Transactions */}
          <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel overflow-hidden border-white/5">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <ArrowUpRight size={18} className="text-primary" />
                        Transactions Récentes
                    </h3>
                    <div className="flex gap-2">
                         <button className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white"><Filter size={16} /></button>
                    </div>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Date & Heure</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice(0, 15).map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-white">
                             {new Date(t.date).toLocaleDateString('fr-FR')}
                           </div>
                           <div className="text-[10px] text-slate-500">
                             {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                             t.modePaiement === 'credit' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                           }`}>
                             {t.modePaiement}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                           {t.clientNom || (t.type === 'a_emporter' ? 'Vente Express' : 'Table')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">
                           {t.total.toLocaleString()} F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>

          {/* Module Taxes et Régularisation */}
          <div className="space-y-6">
              <div className="glass-panel p-6 border-indigo-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-indigo-400" />
                      Calculateur de Taxes
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Taux Global (%)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={tauxTaxe}
                            onChange={(e) => setTauxTaxe(Number(e.target.value))}
                            className="glass-input w-full text-xl font-bold" 
                          />
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                         <p className="text-xs text-slate-500 mb-1">Total à verser (Est.)</p>
                         <p className="text-2xl font-black text-indigo-400">{taxesEstimees.toLocaleString()} F</p>
                      </div>
                      <button className="btn-primary w-full py-3 text-sm">
                          Déclarer le Paiement
                      </button>
                  </div>
              </div>

              <div className="glass-panel p-6 border-amber-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <PieChartIcon size={20} className="text-amber-400" />
                      Répartition
                  </h3>
                  <div className="space-y-3">
                      <BarreProgres label="Ventes Comptant" valeur={chiffreAffairesTotal} total={chiffreAffairesTotal + totalCredits} couleur="bg-emerald-500" />
                      <BarreProgres label="Dettes Clients" valeur={totalCredits} total={chiffreAffairesTotal + totalCredits} couleur="bg-amber-500" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// Composants Internes
const CardFinance = ({ label, valeur, icone, tendance, couleur }: any) => (
    <div className="glass-panel p-6 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${couleur}-500 opacity-[0.03] rounded-full group-hover:scale-110 transition-transform`} />
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-2xl">{icone}</div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-${couleur}-500/10 text-${couleur}-500`}>
                {tendance}
            </span>
        </div>
        <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
            <h4 className="text-3xl font-display font-black text-white">{valeur}</h4>
        </div>
    </div>
);

const BarreProgres = ({ label, valeur, total, couleur }: any) => {
    const pourcentage = total > 0 ? (valeur / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>{label}</span>
                <span>{Math.round(pourcentage)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${couleur} rounded-full`} style={{ width: `${pourcentage}%` }} />
            </div>
        </div>
    );
}

export default GestionFinance;
