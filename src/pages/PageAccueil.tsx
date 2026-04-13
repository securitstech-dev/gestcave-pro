import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ChefHat, Receipt, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react';

const PageAccueil = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className="text-xl">🍷</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white drop-shadow-md">GESTCAVE PRO</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#roles" className="hover:text-white transition-colors">Multi-Rôles</a>
            <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
          </nav>
          <div className="flex gap-4">
            <button onClick={() => navigate('/connexion')} className="btn-secondary py-2 px-5 text-sm">
              Connexion
            </button>
            <button onClick={() => navigate('/abonnement')} className="btn-primary accent py-2 px-5 text-sm hidden md:flex">
              Essai Gratuit
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-grow pt-32 pb-20 px-6 z-10 w-full relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mt-10 md:mt-20 max-w-4xl mx-auto mb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 font-medium tracking-wide mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]"></span>
                ERP SaaS Cloud — Design System 2.0
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-[5.5rem] font-display font-extrabold tracking-tight text-white leading-[1.1] mb-8 drop-shadow-lg"
            >
              Le système de gestion <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                absolu pour les pros.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl drop-shadow-md"
            >
              Oubliez les logiciels lourds. GESTCAVE PRO synchronise les serveurs en salle, les écrans en cuisine, et la caisse en temps réel, le tout depuis le Cloud.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
              <button onClick={() => navigate('/abonnement')} className="btn-primary accent text-lg px-10 py-4">
                Démarrer mon essai <ArrowRight size={20} />
              </button>
              <button className="btn-secondary text-lg px-10 py-4 group">
                Voir la démo <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">✨</span>
              </button>
            </motion.div>
          </div>

          {/* APPLICATION EXPLANATION - BENTO GRID */}
          <div id="roles" className="mt-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Un écran taillé pour chaque rôle</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Parce que le serveur n'a pas besoin de voir les informations du cuisinier. Toutes les données sont synchronisées à la milliseconde via notre infrastructure.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bento-item p-8 flex flex-col items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-transparent border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mt-2">Serveurs</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Application Mobile First. Prise de commande ultra-rapide à la table, sélection des couverts et envoi instantané en cuisine.</p>
              </div>

              <div className="bento-item p-8 flex flex-col items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <ChefHat size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mt-2">Cuisine & Bar</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Écran mural de préparation. Bons de commande digitalisés, jauge d'urgence colorimétrique et pointage des items.</p>
              </div>

              <div className="bento-item p-8 flex flex-col items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Receipt size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mt-2">Caissier</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Interface d'encaissement. Fractionnement des tables, calcul de monnaie, intégration Mobile Money et paiements CB.</p>
              </div>

              <div className="bento-item p-8 flex flex-col items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30 text-yellow-500 flex items-center justify-center">
                  <BarChart3 size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mt-2">Administrateur</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Le contrôle global (ERP). Gestion fine des stocks, pointage RH des employés, rapports de comptabilité et taxes fiscales.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 relative z-10 bg-slate-950/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white">GESTCAVE PRO</span>
            <span className="text-slate-500 text-sm">© 2026 — Tous droits réservés.</span>
          </div>
          
          <div className="flex gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2 text-indigo-400 font-medium">
              <ShieldCheck size={16} /> Serveurs Sécurisés
            </div>
            <a href="#" className="hover:text-indigo-300 transition-colors">Mentions Légales</a>
            <a href="#" className="hover:text-indigo-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageAccueil;
