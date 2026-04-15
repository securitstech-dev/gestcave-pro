import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Receipt, LayoutDashboard, LogOut, Key, ArrowRight } from 'lucide-react';
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
      titre: 'Interface Serveur',
      description: 'Prendre des commandes aux tables.',
      emoji: '🛎️',
      role: 'serveur',
      route: '/serveur',
      couleur: 'from-primary/30 to-indigo-600/30',
      badge: 'Tablette / Mobile',
    },
    {
      id: 'cuisine',
      titre: 'Écran Cuisine',
      description: 'Voir les bons de commande.',
      emoji: '👨‍🍳',
      role: 'cuisine',
      route: '/cuisine',
      couleur: 'from-orange-500/30 to-red-600/30',
      badge: 'Cuisine / Bar',
    },
    {
      id: 'caisse',
      titre: 'Interface Caissier',
      description: 'Encaisser les clients et clôturer.',
      emoji: '💰',
      role: 'caissier',
      route: '/caisse',
      couleur: 'from-green-500/30 to-emerald-600/30',
      badge: 'Poste Fixe',
    },
    {
      id: 'admin',
      titre: 'Tableau de Bord Patron',
      description: 'Gestion complète de l\'établissement.',
      emoji: '👑',
      role: 'admin',
      route: '/tableau-de-bord',
      couleur: 'from-yellow-500/30 to-amber-600/30',
      badge: 'Propriétaire',
    },
  ];

  const gererSelection = (mode: any) => {
    // Tous les accès (y compris le patron) nécessitent un PIN
    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  const validerPIN = async () => {
    if (pin.length < 4) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', profil.etablissement_id),
        where('pin', '==', pin)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const employe = snap.docs[0].data();
        const estAdmin = employe.role === 'admin';

        // L'admin peut accéder à tout. Les autres ont accès uniquement à leur poste.
        if (estAdmin || employe.role === selectedMode.role) {
          toast.success(`Bienvenue, ${employe.nom} !`, { icon: '👋' });
          setShowPinModal(false);
          // Si c'est un admin qui accède au Tableau de Bord Patron
          if (estAdmin && selectedMode.id === 'admin') {
            navigate('/tableau-de-bord');
          } else {
            navigate(selectedMode.route);
          }
        } else {
          toast.error(`Accès refusé. Votre poste est "${employe.role}", pas "${selectedMode.role}".`);
          setPin('');
        }
      } else {
        toast.error('Code PIN incorrect. Réessayez.');
        setPin('');
      }
    } catch (error) {
      toast.error('Erreur de vérification.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-5 text-3xl">
          🍷
        </div>
        <h1 className="text-4xl font-display font-bold mb-3 text-white">
          {profil?.nom || 'GESTCAVE PRO'}
        </h1>
        <p className="text-slate-400">Accès sécurisé pour le personnel</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => gererSelection(mode)}
            className={`
              relative p-8 rounded-[2.5rem] border-2 bg-gradient-to-br transition-all duration-300
              ${mode.couleur} border-white/5 hover:border-white/20 text-left group
            `}
          >
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{mode.emoji}</div>
            <div className="mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                {mode.badge}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">{mode.titre}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">{mode.description}</p>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              Continuer <ArrowRight size={16} />
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => { deconnexion(); navigate('/connexion'); }}
        className="mt-16 flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
      >
        <LogOut size={18} /> Changer de compte
      </button>

      {/* Modal PIN — Clavier Numérique Tactile */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs glass-panel p-8 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <Key size={30} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{selectedMode?.emoji} {selectedMode?.titre}</h3>
              <p className="text-slate-500 text-xs mb-6">Entrez votre code PIN à 4 chiffres</p>
              
              {/* Indicateurs de points */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i 
                      ? 'bg-indigo-500 border-indigo-400 scale-110' 
                      : 'border-white/20 bg-transparent'
                  }`} />
                ))}
              </div>
              
              {/* Clavier numérique */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      if (pin.length < 4) {
                        const newPin = pin + n.toString();
                        setPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => validerPIN(), 300);
                        }
                      }
                    }}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-white text-2xl font-bold transition-all"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-red-500/20 active:scale-95 border border-white/10 text-red-400 text-sm font-bold transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
                <button
                  onClick={() => {
                    if (pin.length < 4) {
                      const newPin = pin + '0';
                      setPin(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => validerPIN(), 300);
                      }
                    }
                  }}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-white text-2xl font-bold transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 text-red-400 text-sm font-bold transition-all"
                >
                  Annuler
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm">
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  Vérification...
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectionMode;
