import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, UserCheck, Coffee, LogOut, 
  ChevronRight, AlertCircle, Fingerprint,
  CheckCircle2, History, ArrowLeft, Home, X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, query, where, getDocs, doc, updateDoc, 
  Timestamp, addDoc, limit, orderBy 
} from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PagePointage = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [employe, setEmploye] = useState<any>(null);
  const [sessionActuelle, setSessionActuelle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState<any[]>([]);

  // Temps réel
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePIN = async (val: string) => {
    if (loading) return;
    const nouveauPIN = pin + val;
    if (nouveauPIN.length <= 4) {
      setPin(nouveauPIN);
      if (nouveauPIN.length === 4) {
        verifierEmploye(nouveauPIN);
      }
    }
  };

  const verifierEmploye = async (code: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', code)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error("PIN Incorrect");
        setPin('');
        setLoading(false);
        return;
      }

      const empData = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setEmploye(empData);
      
      // Vérifier si une session de présence est ouverte aujourd'hui
      const qSession = query(
        collection(db, 'pointage_presence'),
        where('employe_id', '==', empData.id),
        where('statut', 'in', ['present', 'pause']),
        limit(1)
      );
      const snapSession = await getDocs(qSession);
      if (!snapSession.empty) {
        setSessionActuelle({ id: snapSession.docs[0].id, ...snapSession.docs[0].data() });
      }

      // Charger historique récent
      const qHist = query(
        collection(db, 'pointage_presence'),
        where('employe_id', '==', empData.id),
        orderBy('debut', 'desc'),
        limit(5)
      );
      const snapHist = await getDocs(qHist);
      setHistorique(snapHist.docs.map(d => d.data()));

    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const actionPointage = async (type: 'arrivee' | 'pause_debut' | 'pause_fin' | 'depart') => {
    if (!employe) return;
    setLoading(true);
    try {
      if (type === 'arrivee') {
        await addDoc(collection(db, 'pointage_presence'), {
          employe_id: employe.id,
          employe_nom: employe.nom,
          etablissement_id: etablissementId,
          debut: Timestamp.now(),
          statut: 'present',
          pauses: []
        });
        toast.success(`Arrivée enregistrée : ${employe.nom}`);
      } else if (type === 'depart') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        await updateDoc(ref, {
          fin: Timestamp.now(),
          statut: 'termine'
        });
        toast.success("Bonne soirée ! Départ validé.");
      } else if (type === 'pause_debut') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        const nouvellesPauses = [...(sessionActuelle.pauses || []), { debut: Timestamp.now() }];
        await updateDoc(ref, { 
          pauses: nouvellesPauses,
          statut: 'pause'
        });
        toast.success("Pause commencée");
      } else if (type === 'pause_fin') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        const pauses = [...sessionActuelle.pauses];
        pauses[pauses.length - 1].fin = Timestamp.now();
        await updateDoc(ref, { 
          pauses,
          statut: 'present'
        });
        toast.success("Retour de pause");
      }
      
      // Reset
      setEmploye(null);
      setSessionActuelle(null);
      setPin('');
    } catch (error) {
      toast.error("Erreur de pointage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Bouton Retour (Navigation Terminal) */}
      <div className="absolute top-8 left-8">
        <button 
          onClick={() => navigate(`/poste/${etablissementId}`)}
          className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Quitter le Terminal
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Colonne Gauche : Terminal PIN */}
        <div className="space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
              <Fingerprint size={40} className="text-emerald-500" />
              Pointeur HR
            </h1>
            <p className="text-slate-400 font-medium">Saisissez votre PIN pour pointer votre présence.</p>
            <div className="mt-4 text-5xl font-mono font-black text-emerald-400 tabular-nums">
              {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length >= i ? 'bg-emerald-500 border-emerald-500 scale-125' : 'border-slate-600'}`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} onClick={() => handlePIN(n.toString())} className="h-20 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-3xl font-black transition-all active:scale-90 border border-white/5 shadow-lg active:bg-emerald-500/20">
                  {n}
                </button>
              ))}
              <button onClick={() => setPin('')} className="h-20 rounded-2xl bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all border border-rose-500/20 flex items-center justify-center gap-2">
                <X size={16} /> Effacer
              </button>
              <button onClick={() => handlePIN('0')} className="h-20 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-3xl font-black transition-all active:scale-90 border border-white/5 shadow-lg active:bg-emerald-500/20">0</button>
              <div className="h-20 flex items-center justify-center">
                 {loading && <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Actions ou Info */}
        <AnimatePresence mode="wait">
          {!employe ? (
            <motion.div key="waiting" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]"
            >
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 animate-pulse">
                <Clock size={40} />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">En attente de pointage</h2>
              <p className="text-slate-500 text-sm max-w-[200px]">Utilisez le clavier pour vous identifier.</p>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-black">
                  {employe.nom[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{employe.nom}</h2>
                  <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={12} /> {employe.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {!sessionActuelle ? (
                  <button onClick={() => actionPointage('arrivee')} 
                    className="w-full py-6 rounded-2xl bg-emerald-600 text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    <UserCheck size={28} /> Pointer Arrivée
                  </button>
                ) : (
                  <>
                    <div className="bg-emerald-50 rounded-2xl p-4 flex justify-between items-center mb-2">
                       <div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase">Présent depuis</p>
                         <p className="text-xl font-black text-slate-900">
                           {new Date(sessionActuelle.debut.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                       <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full animate-pulse">EN POSTE</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {sessionActuelle.statut === 'pause' ? (
                        <button onClick={() => actionPointage('pause_fin')} 
                          className="py-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex flex-col items-center gap-2"
                        >
                          <History size={24} /> Retour de Pause
                        </button>
                      ) : (
                        <button onClick={() => actionPointage('pause_debut')} 
                          className="py-6 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all flex flex-col items-center gap-2"
                        >
                          <Coffee size={24} /> Prendre une Pause
                        </button>
                      )}
                      <button onClick={() => actionPointage('depart')} 
                        className="py-6 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 active:scale-95 transition-all flex flex-col items-center gap-2"
                      >
                        <LogOut size={24} /> Fin de Journée
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <button onClick={() => setEmploye(null)} className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
                   Ce n'est pas moi / Annuler
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">GestCave Pro • Terminal de Pointage v2</p>
      </div>
    </div>
  );
};

export default PagePointage;
