import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, ShieldCheck } from 'lucide-react';
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
      toast.success('Connexion réussie — Bienvenue !');
      if (email.toLowerCase() === 'securitstech@gmail.com') {
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
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl shadow-lg shadow-slate-900/20">
              🍷
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GESTCAVE PRO</span>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 transition-colors text-sm font-medium">
            ← Retour au site
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-900/10 p-10 text-center">

            {/* Logo */}
            <div className="w-20 h-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-900/30 text-4xl">
              🍷
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GESTCAVE PRO</h1>
            <div className="inline-block mt-3 mb-2 px-4 py-1 bg-slate-100 border border-slate-200 rounded-full">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Version Alpha 1.5 · Onboarding Auto</p>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-6 mb-1">
              {typeCompte === 'admin' ? 'Accès Administrateur' : 'Espace de Gestion'}
            </h2>
            <p className="text-slate-400 text-sm font-medium mb-8">
              {typeCompte === 'admin'
                ? 'Connexion sécurisée — Plateforme SaaS Global.'
                : 'Connectez-vous pour piloter votre POS et votre ERP.'}
            </p>

            <form onSubmit={gererConnexion} className="space-y-5 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900"
                    placeholder="contact@monbar.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
                  <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors">Oublié ?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Déverrouiller l'accès <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">© 2026 GESTCAVE PRO · Données chiffrées de bout en bout.</p>
          <div
            className="flex items-center gap-2 text-slate-200 hover:text-slate-400 transition-colors text-sm cursor-default select-none"
            onDoubleClick={() => setTypeCompte(prev => prev === 'admin' ? 'client' : 'admin')}
            title="..."
          >
            <Shield size={16} /> Serveur Sécurisé
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageConnexion;
