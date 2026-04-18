import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Play, Lock, ShieldCheck, 
  Clock, User, TrendingUp, ChevronRight,
  Wallet, CreditCard, Smartphone, AlertCircle,
  FileText, ArrowDownRight, History
} from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';

const GestionSessions = () => {
  const { profil } = useAuthStore();
  const { sessionActive, historiqueSessions, ouvrirSession, fermerSession } = usePOSStore();
  const [fondsSaisi, setFondsSaisi] = useState<number>(0);
  const [showConfirmCloture, setShowConfirmCloture] = useState(false);

  const handleOuverture = async () => {
    if (!profil) return;
    await ouvrirSession(fondsSaisi);
    setFondsSaisi(0);
  };

  const handleCloture = async () => {
    if (!sessionActive || !profil) return;
    await fermerSession(fondsSaisi);
    setShowConfirmCloture(false);
    setFondsSaisi(0);
  };

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Sessions & Flux</h2>
          <p className="text-slate-500 font-medium text-[8px] mt-0.5">Supervisez l'activité de caisse et validez les clôtures financières.</p>
        </div>
        <div className="flex gap-3">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Serveur Live</span>
            </div>
        </div>
      </header>

      {!sessionActive ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">Aucune session active</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto font-medium text-xs leading-relaxed">
            La caisse est verrouillée. Initialisez une nouvelle session.
          </p>
          
          <div className="max-w-xs mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Fonds de caisse initial</label>
            <input 
              type="number" 
              value={fondsSaisi}
              onChange={(e) => setFondsSaisi(Number(e.target.value))}
              placeholder="0"
              className="w-full h-12 bg-white border border-slate-200 rounded-xl text-center text-2xl font-black text-slate-900 outline-none focus:border-indigo-600 transition-all mb-4 shadow-inner"
            />
            <button 
              onClick={handleOuverture}
              className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play size={14} fill="currentColor" /> Lancer la session
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard Session Active */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-emerald-400">Session Active</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">ID Session</p>
                            <p className="font-mono text-[8px] opacity-50">{sessionActive.id.slice(0, 12).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <p className="text-[10px] font-medium text-slate-400 mb-1">Caissier</p>
                            <h3 className="text-xl font-black tracking-tight mb-4">{sessionActive.caissierNom}</h3>
                            
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Ouverture</p>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-indigo-400" />
                                        <span className="font-bold text-sm">{new Date(sessionActive.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Initial</p>
                                    <div className="flex items-center gap-1.5">
                                        <Wallet size={12} className="text-indigo-400" />
                                        <span className="font-bold text-sm">{sessionActive.fondsInitial.toLocaleString()} F</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">CA Théorique</p>
                            <div className="flex items-baseline gap-2 mb-4 px-1">
                                <span className="text-4xl font-black tracking-tighter">{(sessionActive.totalVentesTheorique || 0).toLocaleString()}</span>
                                <span className="text-xs font-bold text-slate-500">FCFA</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Espèces</p>
                                    <p className="text-xs font-black text-emerald-400">{(sessionActive.totalEspeces || 0).toLocaleString()} F</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Mobile</p>
                                    <p className="text-xs font-black text-orange-400">{(sessionActive.totalMobile || 0).toLocaleString()} F</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-slate-400">
                            <AlertCircle size={16} />
                            <p className="text-[9px] font-medium max-w-sm">
                                La clôture génère un rapport Z et réinitialise les compteurs.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowConfirmCloture(true)}
                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-[8px] transition-all flex items-center gap-2 shadow-xl shadow-rose-600/30"
                        >
                            <Lock size={14} /> Clôturer shift
                        </button>
                    </div>
                </div>
                
                <div className="absolute -bottom-20 -right-20 opacity-5 rotate-12 scale-150">
                    <TrendingUp size={400} />
                </div>
            </div>

            {/* Ventilation des paiements */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3">
                        <Smartphone size={16} />
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Money</p>
                    <p className="text-sm font-black text-slate-900">{(sessionActive.totalMobile || 0).toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3">
                        <CreditCard size={16} />
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cartes</p>
                    <p className="text-sm font-black text-slate-900">{(sessionActive.totalCarte || 0).toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center mb-3">
                        <FileText size={16} />
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Crédit</p>
                    <p className="text-sm font-black text-slate-900">{(sessionActive.totalCredit || 0).toLocaleString()} F</p>
                </div>
            </div>
          </motion.div>

          {/* Historique Récent */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <History className="text-slate-400" size={16} />
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Archive Sessions</h4>
              </div>

              <div className="space-y-3 flex-grow overflow-y-auto pr-1 max-h-[500px]">
                {historiqueSessions.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                        <p className="text-[8px] font-black uppercase">Aucun historique</p>
                    </div>
                ) : (
                    historiqueSessions.sort((a,b) => new Date(b.dateOuverture).getTime() - new Date(a.dateOuverture).getTime()).map((s) => (
                        <div key={s.id} className="group p-3 bg-slate-50 hover:bg-slate-900 rounded-xl border border-slate-100 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">
                                        {new Date(s.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="font-bold text-[11px] text-slate-900 group-hover:text-white transition-colors">{s.caissierNom}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[11px] text-slate-900 group-hover:text-white transition-colors">{(s.totalVentesTheorique || 0).toLocaleString()} F</p>
                                    <p className="text-[8px] text-emerald-500 font-bold uppercase">OK</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 border-t border-slate-200 group-hover:border-white/10 pt-2">
                                <span className="flex items-center gap-1"><Clock size={9} /> {new Date(s.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Clôture */}
      <AnimatePresence>
        {showConfirmCloture && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">VÉRIFICATION</h3>
                        <p className="text-slate-500 font-medium text-[10px] mt-1 px-4">Saisissez le montant total en espèces dans le tiroir.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                <span>Attendu</span>
                                <span className="text-slate-900">{(sessionActive?.totalEspeces || 0).toLocaleString()} F</span>
                            </div>
                            <input 
                                type="number" 
                                autoFocus
                                value={fondsSaisi}
                                onChange={(e) => setFondsSaisi(Number(e.target.value))}
                                className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl text-center text-2xl font-black text-slate-900 outline-none focus:border-rose-600 transition-all shadow-inner"
                            />
                        </div>

                        {fondsSaisi !== (sessionActive?.totalEspeces || 0) && (
                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3">
                                <AlertCircle className="text-amber-600 shrink-0" size={16} />
                                <div>
                                    <p className="text-[8px] font-black text-amber-800 uppercase tracking-widest">Écart détecté</p>
                                    <p className="text-[10px] font-bold text-amber-700 leading-tight">
                                        Un écart de <span className="text-rose-600">{Math.abs(fondsSaisi - (sessionActive?.totalEspeces || 0)).toLocaleString()} F</span> sera enregistré.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmCloture(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Retour</button>
                            <button onClick={handleCloture} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl shadow-slate-900/30 active:scale-95 transition-all">
                                Clôturer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionSessions;
