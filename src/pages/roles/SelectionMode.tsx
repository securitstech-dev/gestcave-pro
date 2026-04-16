import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, ChefHat, Receipt, LayoutDashboard, 
  LogOut, Key, ArrowRight, UserPlus, ShieldCheck, 
  Gamepad2, Zap, Star, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
      couleur: 'amber',
      badge: 'FLUX MANAGER',
    },
    {
      id: 'livraison',
      titre: 'FLUX LIVRAISON',
      description: 'Gestion des courses, livraisons et suivi des colis.',
      icon: <Smartphone size={32} />,
      role: 'livreur',
      route: '/serveur', // Pour l'instant on utilise l'interface serveur ou on créera une dédiée
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
    // Ajout dynamique pour le Super Admin
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
    setLoading(true);
    try {
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', profil.etablissement_id),
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
        // Bypass total pour la phase de simulation
        toast.success("Mode Démonstration : Accès autorisé", { position: 'top-center' });
        setShowPinModal(false);
        navigate(selectedMode.id === 'admin' ? '/tableau-de-bord' : selectedMode.route);
      } else {
        toast.error('Code PIN non reconnu');
        setPin('');
      }
    } catch (error) {
      toast.error('Erreur réseau');
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

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-1 px-4 py-8 bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50" />
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl">
                 <Zap className="text-white" size={32} />
            </div>
            <div className="w-1 px-4 py-8 bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-display font-black mb-4 tracking-tighter text-white">
          HELLO, <span className="text-indigo-500">{profil?.nom?.toUpperCase() || 'EQUIPE'}</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] md:text-xs">
          Sélectionnez votre terminal d'accès sécurisé
        </p>
        <div className="mt-2 text-[9px] text-white/20 font-mono italic">
          Rôle détecté : {profil?.role || 'aucun'} | ID : {profil?.id?.slice(0,8)} | Email : {profil?.email || 'inconnu'}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-[1600px] w-full relative z-10">
        <AnimatePresence>
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => gererSelection(mode)}
              className="group relative h-[380px] rounded-[3rem] p-8 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col items-start text-left overflow-hidden shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${mode.couleur}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="mb-10 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 text-white group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-500 relative z-10">
                {mode.icon}
              </div>

              <div className="relative z-10">
                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-${mode.couleur}-500/10 text-${mode.couleur}-500 mb-4 border border-${mode.couleur}-500/20 uppercase`}>
                  {mode.badge}
                </span>
                <h2 className="text-2xl font-display font-black mb-4 text-white leading-tight uppercase tracking-tight">
                  {mode.titre.split(' ').map((word, idx) => (
                    <span key={idx} className={idx === 1 ? `text-${mode.couleur}-500` : ''}>{word} </span>
                  ))}
                </h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-tight leading-relaxed mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                  {mode.description}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 text-white/40 group-hover:text-white transition-all font-black text-[10px] tracking-widest relative z-10">
                OUVRIR LA SESSION <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
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
        className="mt-20 px-8 py-4 rounded-full flex items-center gap-4 text-slate-500 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 font-black text-[10px] tracking-widest"
      >
        <LogOut size={16} /> CHANGER D'ÉTABLISSEMENT
      </motion.button>

      {/* Modal PIN Premium */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="w-full max-w-sm bg-[#0a0f1d] border border-white/10 rounded-[3.5rem] p-10 text-center shadow-[0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-${selectedMode?.couleur}-500 to-transparent`} />
              
              <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 text-white relative">
                 <div className="absolute inset-0 bg-white/5 animate-ping rounded-[2rem] opacity-20" />
                 {selectedMode?.icon || <Key size={32} />}
              </div>

              <h3 className="text-2xl font-display font-black text-white mb-2 uppercase tracking-tight">{selectedMode?.titre}</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mb-10">Accès équipe : Entrez votre PIN personnalisé</p>
              
              {/* Dot Indicators */}
              <div className="flex justify-center gap-5 mb-12">
                {[0, 1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={pin.length > i ? { scale: [1, 1.4, 1], rotate: [0, 90, 0] } : {}}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      pin.length > i 
                        ? `bg-${selectedMode?.couleur}-500 border-${selectedMode?.couleur}-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]` 
                        : 'border-white/10 bg-white/5'
                    }`} 
                  />
                ))}
              </div>
              
              {/* Luxury Keypad */}
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => handleKeyPress(n.toString())}
                    className="h-20 rounded-[1.8rem] bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 border border-white/5 text-white text-3xl font-display font-black transition-all flex items-center justify-center flex-col"
                  >
                    {n}
                    <span className="text-[7px] text-white/20 font-bold mt-1">
                      {n === 1 ? 'ABC' : n === 2 ? 'DEF' : n === 3 ? 'GHI' : ''}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-20 rounded-[1.8rem] bg-rose-500/5 hover:bg-rose-500/10 active:scale-95 border border-rose-500/10 text-rose-500 flex items-center justify-center transition-all"
                >
                  <X size={28} />
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-20 rounded-[1.8rem] bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 border border-white/5 text-white text-3xl font-display font-black transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="h-20 rounded-[1.8rem] bg-white/[0.01] hover:bg-white/[0.05] active:scale-95 border border-white/5 text-slate-500 font-black text-[10px] tracking-widest uppercase transition-all"
                >
                  EXIT
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4 z-50">
                   <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                   <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px]">AUTH EN COURS</p>
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
