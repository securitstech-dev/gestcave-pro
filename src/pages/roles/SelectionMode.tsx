import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, ChefHat, Receipt, LayoutDashboard, 
  LogOut, Key, ArrowRight, ShieldCheck, 
  Zap, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { runScenarioSeed } from '../../lib/scenarioSeed';
import { runFullScenarioSimulation } from '../../lib/scenarioSimulator';

const SelectionMode = () => {
  const navigate = useNavigate();
  const { profil, deconnexion } = useAuthStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const modes = [
    {
      id: 'serveur',
      titre: 'INTERFACE SERVICE',
      description: 'Prise de commande, gestion des tables et service client.',
      icon: <Smartphone size={32} />,
      role: 'serveur',
      route: '/serveur',
      couleur: 'indigo',
      badge: 'FLUX SALLE',
    },
    {
      id: 'cuisine',
      titre: 'MONITEUR PRODUCTION',
      description: 'Gestion des bons de commande, cuisine et bar.',
      icon: <ChefHat size={32} />,
      role: 'cuisine',
      route: '/cuisine',
      couleur: 'orange',
      badge: 'FLUX CUISINE',
    },
    {
      id: 'caisse',
      titre: 'POSTE ENCAISSEMENT',
      description: 'Gestion des paiements, clôture et ventes directes.',
      icon: <Receipt size={32} />,
      role: 'caissier',
      route: '/caisse',
      couleur: 'emerald',
      badge: 'FLUX FINANCE',
    },
    {
      id: 'admin',
      titre: 'CENTRE DE GESTION',
      description: 'Analyses financières, stocks, RH et configuration.',
      icon: <LayoutDashboard size={32} />,
      role: 'admin',
      route: '/tableau-de-bord',
      couleur: 'amber',
      badge: 'FLUX MANAGER',
    },
    {
        id: 'livraison',
        titre: 'FLUX LIVRAISON',
        description: 'Gestion des courses, livraisons et suivi des colis.',
        icon: <Smartphone size={32} />,
        role: 'livreur',
        route: '/serveur',
        couleur: 'blue',
        badge: 'LOGISTIQUE',
    },
    {
        id: 'securite',
        titre: 'POSTE SÉCURITÉ',
        description: 'Contrôle des flux entrées/sorties et surveillance.',
        icon: <ShieldCheck size={32} />,
        role: 'securite',
        route: '/tableau-de-bord',
        couleur: 'slate',
        badge: 'VIGILANCE',
    },
    ...(profil?.role === 'super_admin' ? [{
      id: 'super-admin',
      titre: 'CONSOLE STRATÉGIQUE',
      description: 'Administration globale du SaaS et gestion des clients.',
      icon: <ShieldCheck size={32} />,
      role: 'super_admin',
      route: '/super-admin',
      couleur: 'rose',
      badge: 'SUPER ADMIN',
    }] : []),
  ];

  const gererSelection = (mode: any) => {
    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  const validerPIN = async (currentPin: string) => {
    // Bypass total pour le Super Admin
    if (profil?.role === 'super_admin') {
      toast.success("Accès Super Admin autorisé");
      setShowPinModal(false);
      navigate(selectedMode.id === 'admin' ? '/tableau-de-bord' : selectedMode.route);
      return;
    }

    setLoading(true);
    try {
      const etablissementId = profil?.etablissement_id || 'demo';
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', currentPin)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const employe = snap.docs[0].data();
        const estAdmin = employe.role === 'admin' || employe.role === 'gerant';

        if (estAdmin || employe.role === selectedMode.role) {
          toast.success(`Session ouverte : ${employe.nom}`, { position: 'top-center' });
          setShowPinModal(false);
          if (estAdmin && selectedMode.id === 'admin') {
            navigate('/tableau-de-bord');
          } else if (selectedMode.id === 'super-admin') {
            navigate('/super-admin');
          } else {
            navigate(selectedMode.route);
          }
        } else {
          toast.error(`Accès restreint aux ${selectedMode.role}s !`);
          setPin('');
        }
      } else if (currentPin === '0000') {
        toast.success("Mode Démonstration : Accès autorisé", { position: 'top-center' });
        setShowPinModal(false);
        navigate(selectedMode.id === 'admin' ? '/tableau-de-bord' : selectedMode.route);
      } else {
        toast.error('Code PIN non reconnu');
        setPin('');
      }
    } catch (error) {
      console.error("Erreur validation PIN:", error);
      toast.error('Erreur réseau ou profil manquant');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !loading) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        validerPIN(newPin);
      }
    }
  };

  // Ajout du support clavier
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPinModal || loading) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, loading, pin]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-1 px-4 py-8 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
                 <Zap className="text-slate-900" size={32} />
            </div>
            <div className="w-1 px-4 py-8 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-display font-black mb-4 tracking-tighter text-slate-900 uppercase">
          Hello, <span className="text-indigo-600">{profil?.nom || 'Équipe'}</span>
        </h1>
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[10px] md:text-xs">
          Sélectionnez votre terminal d'accès sécurisé
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-[1600px] w-full relative z-10">
        <AnimatePresence>
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -10 }}
              onClick={() => gererSelection(mode)}
              className="group relative h-[380px] rounded-[3rem] p-8 bg-white border border-slate-200 hover:border-indigo-200 transition-all duration-500 flex flex-col items-start text-left overflow-hidden shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className={`absolute top-0 inset-x-0 h-1.5 bg-${mode.couleur}-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
              
              <div className={`mb-10 p-6 rounded-[2rem] bg-white border border-slate-100 text-slate-900 group-hover:bg-${mode.couleur}-500 group-hover:text-white transition-all duration-500 shadow-sm relative z-10`}>
                {mode.icon}
              </div>

              <div className="relative z-10">
                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-${mode.couleur}-50 text-${mode.couleur}-600 mb-4 border border-${mode.couleur}-100 uppercase`}>
                  {mode.badge}
                </span>
                <h2 className="text-2xl font-display font-black mb-4 text-slate-900 leading-tight uppercase tracking-tight">
                  {mode.titre}
                </h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                  {mode.description}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 text-slate-300 group-hover:text-indigo-600 transition-all font-black text-[10px] tracking-widest relative z-10 uppercase">
                Ouvrir la session <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => { deconnexion(); navigate('/connexion'); }}
        className="mt-20 px-8 py-4 rounded-full flex items-center gap-4 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all bg-white/50 border border-slate-200 font-black text-[10px] tracking-widest uppercase"
      >
        <LogOut size={16} /> Changer d'établissement
      </motion.button>

      {/* Modal PIN - Version Claire */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-[3.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-1.5 bg-${selectedMode?.couleur}-500`} />
              
              <div className="mx-auto w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 text-slate-900 shadow-inner">
                 {selectedMode?.icon || <Key size={32} />}
              </div>

              <h3 className="text-2xl font-display font-black text-slate-900 mb-2 uppercase tracking-tight">{selectedMode?.titre}</h3>
              <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-10">Entrez votre PIN personnalisé</p>
              
              <div className="flex justify-center gap-5 mb-12">
                {[0, 1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={pin.length > i ? { scale: [1, 1.3, 1] } : {}}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      pin.length > i 
                        ? `bg-${selectedMode?.couleur}-500 border-${selectedMode?.couleur}-600 shadow-lg` 
                        : 'border-slate-200 bg-slate-100'
                    }`} 
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => handleKeyPress(n.toString())}
                    className="h-20 rounded-[1.8rem] bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-100 text-slate-900 text-3xl font-display font-black transition-all flex items-center justify-center"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-20 rounded-[1.8rem] bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-95 border border-rose-100 flex items-center justify-center transition-all"
                >
                  <X size={28} />
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-20 rounded-[1.8rem] bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-100 text-slate-900 text-3xl font-display font-black transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="h-20 rounded-[1.8rem] bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-400 font-black text-[10px] tracking-widest uppercase transition-all"
                >
                  Annuler
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center flex-col gap-4 z-50">
                   <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                   <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px]">Vérification...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
};

export default SelectionMode;
