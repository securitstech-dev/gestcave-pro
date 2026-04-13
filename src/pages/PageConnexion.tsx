import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, Store, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const PageConnexion = () => {
  const navigate = useNavigate();
  const connexion = useAuthStore((state) => state.connexion);

  const [typeCompte, setTypeCompte] = useState<'client' | 'admin'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) throw new Error("Veuillez remplir tous les champs");
      await connexion(email, password);
      
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Connexion réussie</span>
          <span className="text-sm">Bienvenue dans GESTCAVE PRO</span>
        </div>,
        { icon: '🔓', duration: 3000 }
      );
      
      if (typeCompte === 'admin' && email === 'securitstech@gmail.com') {
        navigate('/super-admin');
      } else {
        navigate('/choisir-role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden">
      
      {/* HEADER DE CONNEXION */}
      <header className="w-full z-50 bg-slate-950/20 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🍷</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white drop-shadow-md">GESTCAVE PRO</span>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
            ← Retour au site public
          </button>
        </div>
      </header>

      {/* ZONE CENTRALE (CONTENEUR CONNEXION) */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[450px]"
        >
          {/* Toggle Type de Compte */}
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-6 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setTypeCompte('client')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                typeCompte === 'client' 
                  ? 'bg-slate-800 text-white shadow-lg border border-white/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store size={18} />
              Établissement (Client)
            </button>
            <button
              type="button"
              onClick={() => setTypeCompte('admin')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                typeCompte === 'admin' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={18} />
              Portail Super Admin
            </button>
          </div>

          {/* Le panneau Glassmorphism Bento */}
          <div className="glass-panel p-8 sm:p-10 text-center relative overflow-hidden">
            
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${typeCompte === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-800 border border-white/10'}`}>
              {typeCompte === 'admin' ? <ShieldCheck size={32} className="text-white" /> : <span className="text-3xl">🍷</span>}
            </div>

            <h1 className="text-3xl font-display font-bold text-white mb-2">
              {typeCompte === 'admin' ? 'Accès Privé' : 'Espace de Gestion'}
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              {typeCompte === 'admin' 
                ? 'Connexion sécurisée pour la gestion globale de la plateforme SaaS.'
                : 'Connectez-vous pour piloter votre POS et votre ERP.'}
            </p>

            <form onSubmit={gererConnexion} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Adresse Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-11 h-12"
                    placeholder={typeCompte === 'admin' ? "securitstech@gmail.com" : "contact@monbar.com"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                  <span>Mot de passe</span>
                  {typeCompte === 'client' && <a href="#" className="text-indigo-400 hover:text-indigo-300 text-xs">Oublié ?</a>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-11 h-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-4 h-12 ${typeCompte === 'admin' ? 'btn-primary accent' : 'btn-primary'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                    Analyse des accès...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Déverrouiller l'accès <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* FOOTER DE CONNEXION */}
      <footer className="w-full z-50 bg-slate-950/20 backdrop-blur-md border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2026 GESTCAVE PRO. Protégé par un chiffrement de bout en bout.</p>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium opacity-70">
            <Shield size={16} /> Serveur Sécurisé
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageConnexion;

