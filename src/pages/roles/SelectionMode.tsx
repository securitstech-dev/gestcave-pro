import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Receipt, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ============================================================
// PAGE SÉLECTION DE RÔLE / MODE — après connexion réussie
// ============================================================
const SelectionMode = () => {
  const navigate = useNavigate();
  const { profil, deconnexion } = useAuthStore();

  const modes = [
    {
      id: 'serveur',
      titre: 'Interface Serveur',
      description: 'Prendre des commandes aux tables depuis votre tablette ou téléphone.',
      emoji: '🛎️',
      icon: <Smartphone size={32} />,
      couleur: 'from-primary/30 to-indigo-600/30',
      bordure: 'border-primary/40',
      ombre: 'hover:shadow-[0_0_40px_rgba(109,40,217,0.3)]',
      route: '/serveur',
      badge: 'Tablette / Mobile',
    },
    {
      id: 'cuisine',
      titre: 'Écran Cuisine',
      description: 'Voir les bons de commande arriver en temps réel pour préparation.',
      emoji: '👨‍🍳',
      icon: <ChefHat size={32} />,
      couleur: 'from-orange-500/30 to-red-600/30',
      bordure: 'border-orange-500/40',
      ombre: 'hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]',
      route: '/cuisine',
      badge: 'Grand Écran / Mural',
    },
    {
      id: 'caisse',
      titre: 'Interface Caissier',
      description: 'Encaisser les clients, gérer les modes de paiement et calculer la monnaie.',
      emoji: '💰',
      icon: <Receipt size={32} />,
      couleur: 'from-green-500/30 to-emerald-600/30',
      bordure: 'border-green-500/40',
      ombre: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]',
      route: '/caisse',
      badge: 'Poste Fixe',
    },
    {
      id: 'admin',
      titre: 'Tableau de Bord Admin',
      description: 'Gestion complète de l\'établissement : stocks, RH, comptabilité, taxes.',
      emoji: '👑',
      icon: <LayoutDashboard size={32} />,
      couleur: 'from-yellow-500/30 to-amber-600/30',
      bordure: 'border-yellow-500/40',
      ombre: 'hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]',
      route: '/tableau-de-bord',
      badge: 'Patron / Manager',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 mb-5">
          <span className="text-4xl">🍷</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
          Bonjour, {profil?.prenom || 'Bienvenue'} !
        </h1>
        <p className="text-slate-400 text-lg">
          Quel est votre rôle aujourd'hui ?
        </p>
      </motion.div>

      {/* Grille des modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(mode.route)}
            className={`
              relative group p-7 rounded-3xl border-2 text-left
              bg-gradient-to-br ${mode.couleur} ${mode.bordure}
              backdrop-blur-sm transition-all duration-300 ${mode.ombre}
            `}
          >
            <div className="text-5xl mb-5">{mode.emoji}</div>
            
            <div className="mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {mode.badge}
              </span>
            </div>
            
            <h2 className="text-xl font-display font-bold mb-2 text-white">{mode.titre}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{mode.description}</p>
            
            <div className="mt-6 flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Accéder</span>
              <span className="text-lg">→</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Déconnexion */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => { deconnexion(); navigate('/connexion'); }}
        className="mt-12 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm"
      >
        <LogOut size={16} /> Se déconnecter
      </motion.button>
    </div>
  );
};

export default SelectionMode;
