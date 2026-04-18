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
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Contrôle des Flux & Sessions</h2>
          <p className="text-slate-500 font-medium mt-1">Supervisez l'activité de caisse et validez les clôtures financières.</p>
        </div>
        <div className="flex gap-4">
            <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Serveur Live</span>
            </div>
        </div>
      </header>

      {!sessionActive ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] border border-slate-200 p-16 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">AUCUNE SESSION ACTIVE</h3>
          <p className="text-slate-500 mb-12 max-w-md mx-auto font-medium text-lg leading-relaxed">
            La caisse est actuellement verrouillée. Pour autoriser les transactions de vente, veuillez initialiser une nouvelle session.
          </p>
          
          <div className="max-w-md mx-auto bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Fonds de caisse initial (FCFA)</label>
            <input 
              type="number" 
              value={fondsSaisi}
              onChange={(e) => setFondsSaisi(Number(e.target.value))}
              placeholder="0"
              className="w-full h-20 bg-white border-2 border-slate-200 rounded-3xl text-center text-4xl font-black text-slate-900 outline-none focus:border-indigo-600 transition-all mb-8 shadow-inner"
            />
            <button 
              onClick={handleOuverture}
              className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <Play size={20} fill="currentColor" /> Lancer la session de caisse
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard Session Active */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Session Opérationnelle</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ID Session</p>
                            <p className="font-mono text-xs opacity-50">{sessionActive.id.slice(0, 12).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-2">Responsable de caisse</p>
                            <h3 className="text-4xl font-black tracking-tight mb-8">{sessionActive.caissierNom}</h3>
                            
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ouverture</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-indigo-400" />
                                        <span className="font-bold text-lg">{new Date(sessionActive.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fonds Initial</p>
                                    <div className="flex items-center gap-2">
                                        <Wallet size={16} className="text-indigo-400" />
                                        <span className="font-bold text-lg">{sessionActive.fondsInitial.toLocaleString()} F</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Chiffre d'Affaire Théorique</p>
                            <div className="flex items-baseline gap-3 mb-8">
                                <span className="text-6xl font-black tracking-tighter">{(sessionActive.totalVentesTheorique || 0).toLocaleString()}</span>
                                <span className="text-xl font-bold text-slate-500">FCFA</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Espèces</p>
                                    <p className="font-black text-emerald-400">{(sessionActive.totalEspeces || 0).toLocaleString()} F</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile</p>
                                    <p className="font-black text-orange-400">{(sessionActive.totalMobile || 0).toLocaleString()} F</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-4 text-slate-400">
                            <AlertCircle size={20} />
                            <p className="text-xs font-medium max-w-sm">
                                La clôture génère automatiquement un rapport Z et réinitialise les compteurs de vente pour le prochain shift.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowConfirmCloture(true)}
                            className="px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 shadow-2xl shadow-rose-600/30"
                        >
                            <Lock size={18} /> Clôturer le shift
                        </button>
                    </div>
                </div>
                
                <div className="absolute -bottom-20 -right-20 opacity-5 rotate-12 scale-150">
                    <TrendingUp size={400} />
                </div>
            </div>

            {/* Ventilation des paiements */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                        <Smartphone size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile Money</p>
                    <p className="text-2xl font-black text-slate-900">{(sessionActive.totalMobile || 0).toLocaleString()} F</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                        <CreditCard size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cartes Bancaires</p>
                    <p className="text-2xl font-black text-slate-900">{(sessionActive.totalCarte || 0).toLocaleString()} F</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6">
                        <FileText size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes à Crédit</p>
                    <p className="text-2xl font-black text-slate-900">{(sessionActive.totalCredit || 0).toLocaleString()} F</p>
                </div>
            </div>
          </motion.div>

          {/* Historique Récent */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <History className="text-slate-400" size={20} />
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sessions Clôturées</h4>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-2 max-h-[600px]">
                {historiqueSessions.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <p className="text-[10px] font-black uppercase">Aucune archive</p>
                    </div>
                ) : (
                    historiqueSessions.sort((a,b) => new Date(b.dateOuverture).getTime() - new Date(a.dateOuverture).getTime()).map((s) => (
                        <div key={s.id} className="group p-5 bg-slate-50 hover:bg-slate-900 rounded-3xl border border-slate-100 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest mb-1">
                                        {new Date(s.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="font-bold text-slate-900 group-hover:text-white transition-colors">{s.caissierNom}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 group-hover:text-white transition-colors">{(s.totalVentesTheorique || 0).toLocaleString()} F</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Clôturée</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 border-t border-slate-200 group-hover:border-white/10 pt-4">
                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(s.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>-</span>
                                <span className="flex items-center gap-1"><ArrowDownRight size={10} /> Shift Terminé</span>
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
                    className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl"
                >
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">VÉRIFICATION FINALE</h3>
                        <p className="text-slate-500 font-medium mt-2">Veuillez saisir le montant total en espèces présent dans le tiroir-caisse.</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                <span>Espèces attendues</span>
                                <span className="text-slate-900">{(sessionActive?.totalEspeces || 0).toLocaleString()} F</span>
                            </div>
                            <input 
                                type="number" 
                                autoFocus
                                value={fondsSaisi}
                                onChange={(e) => setFondsSaisi(Number(e.target.value))}
                                className="w-full h-20 bg-slate-100 border-2 border-slate-200 rounded-3xl text-center text-4xl font-black text-slate-900 outline-none focus:border-rose-600 transition-all shadow-inner"
                            />
                        </div>

                        {fondsSaisi !== (sessionActive?.totalEspeces || 0) && (
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                                <AlertCircle className="text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Écart de caisse détecté</p>
                                    <p className="text-sm font-bold text-amber-700 leading-snug">
                                        Un écart de <span className="text-rose-600">{Math.abs(fondsSaisi - (sessionActive?.totalEspeces || 0)).toLocaleString()} F</span> sera enregistré dans le rapport de clôture.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirmCloture(false)} className="flex-1 py-5 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Abandonner</button>
                            <button onClick={handleCloture} className="flex-1 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all">
                                Confirmer la clôture
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
