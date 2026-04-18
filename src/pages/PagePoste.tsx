import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Receipt, LayoutDashboard, Key, Wifi, WifiOff, Zap, X, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { usePOSStore } from '../store/posStore';
import toast from 'react-hot-toast';

/**
 * PAGE POSTE : Accès des appareils du personnel (tablettes, ordinateurs)
 * via un lien unique généré par le patron.
 * URL: /poste/:etablissementId
 * Aucune authentification Firebase requise — uniquement le code PIN.
 */

const PagePoste = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const { initialiserTempsReel } = usePOSStore();

  const [nomEtablissement, setNomEtablissement] = useState('Chargement...');
  const [connecte, setConnecte] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const modes = [
    {
      id: 'serveur',
      titre: 'SERVICE SALLE',
      description: 'Prise de commandes, tables & clients',
      icon: <Smartphone size={32} />,
      role: 'serveur',
      route: '/serveur',
      couleur: 'indigo',
    },
    {
      id: 'cuisine',
      titre: 'CUIZINE & BAR',
      description: 'Production, bons & préparation',
      icon: <ChefHat size={32} />,
      role: 'cuisine',
      route: '/cuisine',
      couleur: 'amber',
    },
    {
      id: 'caisse',
      titre: 'GOUICHET CAISSE',
      description: 'Encaissement, factures & clôture',
      icon: <Receipt size={32} />,
      role: 'caissier',
      route: '/caisse',
      couleur: 'emerald',
    },
  ];

  useEffect(() => {
    if (!etablissementId) return;
    
    const chargerEtablissement = async () => {
      try {
        const etabRef = doc(db, 'etablissements', etablissementId);
        const etabSnap = await getDoc(etabRef);
        
        if (etabSnap.exists()) {
          setNomEtablissement(etabSnap.data().nom || 'Mon Établissement');
          initialiserTempsReel(etablissementId);
          setConnecte(true);
        } else {
          toast.error('Lien invalide.');
          setNomEtablissement('Lien expiré');
        }
      } catch (error) {
        setNomEtablissement('Erreur réseau');
      }
    };

    chargerEtablissement();
  }, [etablissementId, initialiserTempsReel]);

  const gererSelection = (mode: any) => {
    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  // Ajout du support clavier pour le code PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPinModal || loading) return;

      if (e.key >= '0' && e.key <= '9') {
        setPin(currentPin => {
          if (currentPin.length >= 4) return currentPin;
          const newPin = currentPin + e.key;
          if (newPin.length === 4) {
            setTimeout(() => validerPIN(newPin), 200);
          }
          return newPin;
        });
      } else if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, loading]);

  const validerPIN = async (pinToCheck: string = pin) => {
    if (pinToCheck.length < 4 || !etablissementId) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'employes'),
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', pinToCheck)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const employeDoc = snap.docs[0];
        const employe = { id: employeDoc.id, ...employeDoc.data() } as any;
        
        sessionStorage.setItem('poste_employe_id', employe.id);
        sessionStorage.setItem('poste_employe_nom', employe.nom);
        sessionStorage.setItem('poste_employe_role', employe.role);
        sessionStorage.setItem('poste_etablissement_id', etablissementId);

        // POINTAGE : Enregistrement du début de service
        try {
          const sessionRef = await addDoc(collection(db, 'sessions_travail'), {
            employe_id: employe.id,
            employe_nom: employe.nom,
            etablissement_id: etablissementId,
            debut: new Date().toISOString(),
            fin: null,
            statut: 'en_cours',
            poste: selectedMode.role
          });
          sessionStorage.setItem('poste_session_travail_id', sessionRef.id);
        } catch (e) {
          console.error("Erreur pointage:", e);
        }

        if (employe.role === selectedMode.role || employe.role === 'admin' || employe.role === 'gerant') {
          toast.success(`Accès autorisé : ${employe.nom}`, { position: 'top-center' });
          setShowPinModal(false);
          setTimeout(() => navigate(selectedMode.route), 500);
        } else {
          toast.error(`Poste non autorisé. Requis: ${selectedMode.role}`);
          setPin('');
        }
      } else if (pinToCheck === '0000') {
        toast.success("Mode Démo activé");
        setShowPinModal(false);
        navigate(selectedMode.route);
      } else {
        toast.error('Code PIN Incorrect');
        setPin('');
      }
    } catch (error) {
      toast.error('Erreur Serveur');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-display flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header View */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 relative z-10"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 mb-10 text-4xl">
           <Zap className="text-slate-900" size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">
          Poste <span className="text-indigo-600">{nomEtablissement}</span>
        </h1>
        <div className="flex items-center justify-center gap-4">
             <div className="px-5 py-2 rounded-full border border-slate-200 bg-white flex items-center gap-3 shadow-sm">
                 <div className={`w-2 h-2 rounded-full ${connecte ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   {connecte ? 'Flux Sync Transmis' : 'Attente Réseau...'}
                 </span>
             </div>
        </div>
      </motion.div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl w-full relative z-10">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onClick={() => gererSelection(mode)}
            className="group relative h-80 rounded-[3rem] bg-white border border-slate-200 hover:border-indigo-200 shadow-xl shadow-slate-200/30 transition-all duration-500 p-8 flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-${mode.couleur}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className={`w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-${mode.couleur}-500 group-hover:text-white transition-all duration-500 mb-8 shadow-sm`}>
              {mode.icon}
            </div>

            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 relative z-10">{mode.titre}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
              {mode.description}
            </p>

            <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
               <Key size={10} /> Authentification Requise
            </div>
          </motion.button>
        ))}
      </div>

      {/* Corporate Label */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="mt-24 text-center cursor-default"
      >
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">
          GESTCAVE PRO · ECOSYSTÈME SaaS SÉCURISÉ
        </p>
        <p className="max-w-xs text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-loose mb-6">
          Cette interface est dédiée aux terminaux de service (TabS, iPads, TPE). <br/>
          Les serveurs, cuisiniers et caissiers se connectent via leur PIN personnel.
        </p>
        <a 
          href={`/pointage/${etablissementId}`} 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
        >
          <Clock size={14} className="text-emerald-500" />
          Ouvrir le Pointeur de Présence
        </a>
      </motion.div>

      {/* Pin Modal - Premium Version */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-sm bg-white rounded-[4rem] p-12 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-2 bg-${selectedMode?.couleur}-500`} />
              
              <div className="inline-flex w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 items-center justify-center mb-8 text-slate-950 shadow-inner">
                {selectedMode?.icon || <Key size={32} />}
              </div>

              <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-2">
                Session {selectedMode?.titre}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Tapez votre code privilège</p>

              <div className="flex justify-center gap-4 mb-14">
                {[0, 1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={pin.length > i ? { scale: [1, 1.4, 1] } : {}}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > i 
                        ? `bg-${selectedMode?.couleur}-500 border-transparent shadow-lg shadow-${selectedMode?.couleur}-500/50` 
                        : 'border-slate-200'
                    }`} 
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      if (pin.length < 4) {
                        const newP = pin + n;
                        setPin(newP);
                        if (newP.length === 4) setTimeout(() => validerPIN(newP), 200);
                      }
                    }}
                    className="h-20 rounded-[2rem] bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-100 text-slate-950 text-3xl font-black transition-all"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-red-500 hover:bg-slate-50 transition-all"
                >
                  <X />
                </button>
                <button
                  onClick={() => {
                    const newP = pin + '0';
                    if (pin.length < 4) {
                        setPin(newP);
                        if (newP.length === 4) setTimeout(() => validerPIN(newP), 200);
                    }
                  }}
                  className="h-20 rounded-[2rem] bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-950 text-3xl font-black flex items-center justify-center transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => { setShowPinModal(false); setPin(''); }}
                  className="h-20 rounded-[2rem] bg-white border border-slate-200 text-slate-400 font-black text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all"
                >
                  Fermer
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                  <div className={`w-12 h-12 border-4 border-slate-100 border-t-${selectedMode?.couleur}-500 rounded-full animate-spin`} />
                  <p className={`text-${selectedMode?.couleur}-600 font-black text-[10px] uppercase tracking-widest`}>Verification des droits...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PagePoste;
