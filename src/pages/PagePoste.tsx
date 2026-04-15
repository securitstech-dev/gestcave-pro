import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Receipt, LayoutDashboard, Key, Wifi, WifiOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
      titre: 'Serveur',
      description: 'Prise de commandes en salle',
      emoji: '🛎️',
      role: 'serveur',
      route: '/serveur',
      couleur: 'from-indigo-500/20 to-indigo-700/20',
      borderColor: 'hover:border-indigo-500/50',
    },
    {
      id: 'cuisine',
      titre: 'Cuisine / Bar',
      description: 'Bons de commande en temps réel',
      emoji: '👨‍🍳',
      role: 'cuisine',
      route: '/cuisine',
      couleur: 'from-orange-500/20 to-red-600/20',
      borderColor: 'hover:border-orange-500/50',
    },
    {
      id: 'caisse',
      titre: 'Caissier',
      description: 'Encaissement et clôture',
      emoji: '💰',
      role: 'caissier',
      route: '/caisse',
      couleur: 'from-emerald-500/20 to-green-700/20',
      borderColor: 'hover:border-emerald-500/50',
    },
  ];

  // Charger le nom de l'établissement et démarrer la sync temps réel
  useEffect(() => {
    if (!etablissementId) return;
    
    const chargerEtablissement = async () => {
      try {
        const etabRef = doc(db, 'etablissements', etablissementId);
        const etabSnap = await getDoc(etabRef);
        
        if (etabSnap.exists()) {
          setNomEtablissement(etabSnap.data().nom || 'Mon Établissement');
          // Démarrer la synchronisation temps réel avec l'établissement
          initialiserTempsReel(etablissementId);
          setConnecte(true);
        } else {
          toast.error('Lien de poste invalide. Demandez un nouveau lien au patron.');
          setNomEtablissement('Établissement introuvable');
        }
      } catch (error) {
        console.error('Erreur connexion poste:', error);
        setNomEtablissement('Erreur de connexion');
      }
    };

    chargerEtablissement();
  }, [etablissementId, initialiserTempsReel]);

  const gererSelection = (mode: any) => {
    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  const validerPIN = async () => {
    if (pin.length < 4 || !etablissementId) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'employes'),
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', pin)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const employe = snap.docs[0].data();

        // Stocker temporairement l'identité de l'employé et l'établissement
        sessionStorage.setItem('poste_employe_nom', employe.nom);
        sessionStorage.setItem('poste_employe_role', employe.role);
        sessionStorage.setItem('poste_etablissement_id', etablissementId);

        if (employe.role === selectedMode.role || employe.role === 'admin') {
          toast.success(`Bienvenue, ${employe.nom} ! 👋`);
          setShowPinModal(false);
          navigate(selectedMode.route);
        } else {
          toast.error(`Accès refusé. Votre poste est "${employe.role}", pas "${selectedMode.role}".`);
          setPin('');
        }
      } else {
        toast.error('Code PIN incorrect. Réessayez.');
        setPin('');
      }
    } catch (error) {
      toast.error('Erreur de vérification. Vérifiez la connexion internet.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full -z-10" />

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 mb-5 text-4xl">
          🍷
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">{nomEtablissement}</h1>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          connecte 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {connecte ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connecte ? 'Connecté · Synchronisation active' : 'Connexion en cours...'}
        </div>
        <p className="text-slate-500 text-sm mt-4">Sélectionnez votre poste et entrez votre code PIN</p>
      </motion.div>

      {/* Grille des postes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => gererSelection(mode)}
            disabled={!connecte}
            className={`
              relative p-8 rounded-[2rem] border-2 bg-gradient-to-br transition-all duration-300 text-center
              ${mode.couleur} ${mode.borderColor} border-white/5
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            <div className="text-5xl mb-5">{mode.emoji}</div>
            <h2 className="text-xl font-bold text-white mb-2">{mode.titre}</h2>
            <p className="text-sm text-slate-400">{mode.description}</p>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
              <Key size={12} /> Code PIN requis
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer d'info */}
      <p className="mt-12 text-slate-600 text-xs text-center max-w-sm">
        GESTCAVE PRO · Toutes les données sont synchronisées en temps réel<br />
        avec le tableau de bord du patron via Firebase.
      </p>

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
                        if (newPin.length === 4) setTimeout(() => validerPIN(), 300);
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
                      if (newPin.length === 4) setTimeout(() => validerPIN(), 300);
                    }
                  }}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-white text-2xl font-bold transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => { setShowPinModal(false); setPin(''); }}
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

export default PagePoste;
