import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Wallet, Users, ShoppingBag, Receipt, 
  ArrowLeft, LogOut, TrendingUp, AlertTriangle,
  Plus, Clock, Package, CheckCircle2, DollarSign,
  Activity, Calendar, ArrowRight, Zap, X, Filter
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, 
  addDoc, doc, getDoc, Timestamp, orderBy, limit 
} from 'firebase/firestore';
import { usePOSStore } from '../store/posStore';
import toast from 'react-hot-toast';

/**
 * PAGE TERMINAL MANAGER : Interface dédiée au gérant de l'espace.
 * Accessible via PIN personnel, elle regroupe finance, RH, et approvisionnements.
 * URL: /manager/:etablissementId
 */

const PageTerminalManager = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const { initialiserTempsReel } = usePOSStore();

  const [employe, setEmploye] = useState<any>(null);
  const [etablissement, setEtablissement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'finance' | 'presence' | 'achats'>('finance');
  const [loading, setLoading] = useState(true);

  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [presents, setPresents] = useState<any[]>([]);
  const [achats, setAchats] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);

  // Auth check from sessionStorage (set by PagePoste)
  useEffect(() => {
    const empId = sessionStorage.getItem('poste_employe_id');
    const role = sessionStorage.getItem('poste_employe_role');
    const storedEtabId = sessionStorage.getItem('poste_etablissement_id');

    if (!empId || (role !== 'gerant' && role !== 'admin' && role !== 'client_admin') || storedEtabId !== etablissementId) {
      toast.error("Accès non autorisé");
      navigate(`/poste/${etablissementId}`);
      return;
    }

    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'employes', empId));
      if (docSnap.exists()) {
        setEmploye({ id: docSnap.id, ...docSnap.data() });
      }
      
      const etabSnap = await getDoc(doc(db, 'etablissements', etablissementId!));
      if (etabSnap.exists()) {
        setEtablissement({ id: etabSnap.id, ...etabSnap.data() });
      }
      setLoading(false);
    };

    fetchProfile();
    initialiserTempsReel(etablissementId!);
  }, [etablissementId, navigate, initialiserTempsReel]);

  // Real-time Data Listeners
  useEffect(() => {
    if (!etablissementId) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    // Transactions du jour
    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', today.toISOString())
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Employés présents (pointage actif)
    const qPresence = query(
      collection(db, 'pointage_presence'),
      where('etablissement_id', '==', etablissementId),
      where('statut', 'in', ['present', 'pause'])
    );
    const unsubPresence = onSnapshot(qPresence, (snap) => {
      setPresents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Achats récents
    const qAchats = query(
      collection(db, 'achats'),
      where('etablissement_id', '==', etablissementId),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubAchats = onSnapshot(qAchats, (snap) => {
      setAchats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTrans(); unsubPresence(); unsubAchats(); };
  }, [etablissementId]);

  // Calculations
  const metrics = useMemo(() => {
    const totalVentes = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
    const totalEspeces = transactions.filter(t => t.modePaiement === 'especes').reduce((acc, t) => acc + (t.total || 0), 0);
    const totalMobile = transactions.filter(t => t.modePaiement === 'mobile').reduce((acc, t) => acc + (t.total || 0), 0);
    const totalDettes = transactions.filter(t => t.modePaiement === 'credit').reduce((acc, t) => acc + (t.montantRestant || 0), 0);
    
    return { totalVentes, totalEspeces, totalMobile, totalDettes };
  }, [transactions]);

  if (loading) return <div className="h-screen bg-slate-50 flex items-center justify-center font-black text-emerald-500 animate-pulse tracking-widest uppercase">Initialisation Manager Terminal...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-950">{etablissement?.nom || 'Manager Pro'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-[0.2em]">Terminal Gérant</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {employe?.nom}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { sessionStorage.clear(); navigate(`/poste/${etablissementId}`); }}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-all border border-slate-200 shadow-sm flex items-center gap-3"
          >
            <LogOut size={16} /> Verrouiller
          </button>
        </div>
      </header>

      {/* Quick Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Caisse du Jour" val={metrics.totalVentes} suffix="F" icon={<Wallet size={20} />} color="indigo" />
        <MetricCard label="Espèces Main" val={metrics.totalEspeces} suffix="F" icon={<DollarSign size={20} />} color="emerald" />
        <MetricCard label="Crédits Clients" val={metrics.totalDettes} suffix="F" icon={<AlertTriangle size={20} />} color="rose" />
        <MetricCard label="Staff en Poste" val={presents.length} suffix="Pers." icon={<Users size={20} />} color="amber" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col min-h-[600px] shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
          <TabButton active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<TrendingUp size={18} />} label="Finance & Flux" />
          <TabButton active={activeTab === 'presence'} onClick={() => setActiveTab('presence')} icon={<Clock size={18} />} label="Pointage & RH" />
          <TabButton active={activeTab === 'achats'} onClick={() => setActiveTab('achats')} icon={<ShoppingBag size={18} />} label="Approvisionnement" />
        </div>

        {/* Tab Panels */}
        <div className="flex-1 p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'finance' && (
              <motion.div key="fin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                    <Receipt className="text-indigo-500" /> Flux de Trésorerie
                  </h3>
                  <button onClick={() => setShowActionModal('charge')} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">
                    Saisir une Charge
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Répartition Paiements</p>
                      <div className="space-y-4">
                         <ProgressLine label="Espèces (Cash)" val={metrics.totalEspeces} max={metrics.totalVentes} color="emerald" />
                         <ProgressLine label="Mobile Money" val={metrics.totalMobile} max={metrics.totalVentes} color="indigo" />
                         <ProgressLine label="Crédit / Dette" val={metrics.totalDettes} max={metrics.totalVentes} color="rose" />
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 overflow-y-auto max-h-[300px] no-scrollbar">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Derniers Encaissements</p>
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-900 uppercase">{t.serveurNom || 'Caisse'}</p>
                              <p className="text-[8px] text-slate-500 uppercase font-black">{new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            </div>
                            <p className="font-black text-emerald-600">{t.total.toLocaleString()} F</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'presence' && (
              <motion.div key="rh" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                    <Users className="text-amber-500" /> Présence & Personnel
                  </h3>
                  <div className="flex gap-3">
                     <button onClick={() => navigate(`/pointage/${etablissementId}`)} className="px-6 py-3 rounded-2xl bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">Ouvrir Pointeur</button>
                     <button onClick={() => setShowActionModal('avance')} className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20">Accorder Avance</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {presents.map((p, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-black uppercase">
                         {p.employe_nom[0]}
                       </div>
                       <div>
                          <p className="text-[12px] font-black text-slate-900 uppercase">{p.employe_nom}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={`w-1.5 h-1.5 rounded-full ${p.statut === 'pause' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{p.statut === 'pause' ? 'En Pause' : 'Au Travail'}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {presents.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-[0.4em]">Personne n'a encore pointé</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'achats' && (
              <motion.div key="ach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                    <Package className="text-rose-500" /> Approvisionnements
                  </h3>
                  <button onClick={() => setShowActionModal('achat')} className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20">
                    Nouvel Achat / Stock
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                         <tr>
                            <th className="p-6">Date</th>
                            <th className="p-6">Désignation</th>
                            <th className="p-6">Fournisseur</th>
                            <th className="p-6">Montant</th>
                            <th className="p-6">Statut</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {achats.map((a, i) => (
                           <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="p-6 text-[10px] font-medium text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                              <td className="p-6 font-black uppercase text-[11px] text-slate-900">{a.description || 'Approvisionnement'}</td>
                              <td className="p-6 text-[10px] text-slate-500 uppercase font-black">{a.fournisseur || '-'}</td>
                              <td className="p-6 font-black text-rose-600">{a.montant.toLocaleString()} F</td>
                              <td className="p-6">
                                 <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase">Réglé</span>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   {achats.length === 0 && (
                     <div className="py-20 text-center text-slate-400 font-black uppercase tracking-[0.4em]">Aucun achat enregistré récemment</div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Modals Placeholder */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border border-slate-100"
             >
                <button onClick={() => setShowActionModal(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"><X /></button>
                <div className="mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                     {showActionModal === 'charge' ? 'Nouvelle Charge' : showActionModal === 'avance' ? 'Accorder Avance' : 'Enregistrer Achat'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saisie rapide terminal manager</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Montant (F CFA)</label>
                      <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-2xl font-black text-emerald-600 outline-none focus:border-emerald-500/50 transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Description / Motif</label>
                      <input type="text" placeholder="..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 outline-none focus:border-indigo-500/50 transition-all" />
                   </div>
                   
                   <button 
                    onClick={() => { toast.success("Enregistrement simulé (Backend integration pending)"); setShowActionModal(null); }}
                    className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                   >
                     Valider l'opération
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-20 text-center opacity-50">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">GestCave Pro • Executive Terminal v3.0</p>
      </footer>
    </div>
  );
};

const MetricCard = ({ label, val, suffix, icon, color }: any) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all cursor-default overflow-hidden relative">
    <div className={`absolute top-0 right-0 p-4 text-${color}-500 opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{val.toLocaleString()}</h4>
      <span className={`text-[10px] font-black text-${color}-600 uppercase`}>{suffix}</span>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
      active ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {icon} {label}
  </button>
);

const ProgressLine = ({ label, val, max, color }: any) => {
  const percent = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
         <span className="text-slate-500">{label}</span>
         <span className="text-slate-900">{val.toLocaleString()} F</span>
       </div>
       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full bg-${color}-500 shadow-sm shadow-${color}-500/20`} />
       </div>
    </div>
  );
};

export default PageTerminalManager;
