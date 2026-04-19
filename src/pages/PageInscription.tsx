import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building, Mail, Lock, User, 
  ArrowRight, Sparkles, ChevronLeft, 
  Loader2, Globe, ShieldCheck, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PageInscription = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    etablissementNom: ''
  });
  const [loading, setLoading] = useState(false);
  const { inscription } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inscription(formData.email, formData.motDePasse, formData.nom, formData.etablissementNom);
      toast.success("Bienvenue dans l'écosystème GestCave !");
      navigate('/tableau-de-bord');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-100">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-orange-100 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="max-w-6xl w-full bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 border border-white">
        
        {/* Left Side: Branding & Value Props */}
        <div className="md:w-[40%] bg-[#1E3A8A] p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="space-y-10 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <ChevronLeft size={16} /> Portail Principal
            </Link>
            <div className="flex items-center gap-4">
              <img src="/logo_gestcave.png" alt="Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-xl font-black tracking-tight uppercase">GestCave Pro</h1>
            </div>
          </div>

          <div className="space-y-12 relative z-10">
            <div className="space-y-6">
                <h2 className="text-5xl font-black leading-[1.1] tracking-tight uppercase">
                    Bâtissez <br/> 
                    <span className="text-[#FF7A00]">le futur.</span>
                </h2>
                <p className="text-blue-100/60 leading-relaxed font-medium text-lg">
                    Rejoignez des centaines d'établissements qui automatisent leur succès avec GestCave.
                </p>
            </div>

            <div className="space-y-6">
                {[
                    { icon: <Zap size={18} />, text: 'Déploiement en 60 secondes' },
                    { icon: <ShieldCheck size={18} />, text: 'IA de surveillance prédictive' },
                    { icon: <Globe size={18} />, text: 'Accès Cloud Multi-Postes' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#FF7A00] border border-white/5">
                            {item.icon}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-blue-100/80">{item.text}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 text-[10px] font-black text-blue-100/40 uppercase tracking-[0.3em] relative z-10">
            Sovereign Ledger Technology — 2026
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-[60%] p-16 md:p-24 bg-white overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="max-w-md mx-auto space-y-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[#FF7A00] text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                 <Sparkles size={12} /> Nouveau Partenaire
              </div>
              <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none">Créer un Compte</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Configurez votre environnement de gestion</p>
            </div>

            <form onSubmit={handleRegister} className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'Établissement</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <Building size={22} />
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={formData.etablissementNom} 
                    onChange={e => setFormData({...formData, etablissementNom: e.target.value})}
                    placeholder="Lounge Bar, Cave à vins, etc."
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'Administrateur</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <User size={22} />
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={formData.nom} 
                    onChange={e => setFormData({...formData, nom: e.target.value})}
                    placeholder="Jean Dupont"
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Professionnel</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <Mail size={22} />
                  </div>
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@etablissement.com"
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe de Sécurité</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <Lock size={22} />
                  </div>
                  <input 
                    required 
                    type="password" 
                    value={formData.motDePasse} 
                    onChange={e => setFormData({...formData, motDePasse: e.target.value})}
                    placeholder="Minimum 8 caractères"
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-20 bg-[#FF7A00] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-orange-900/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    Lancer la Configuration
                    <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 text-center border-t border-slate-50">
              <p className="text-slate-400 text-sm font-bold">
                Déjà partenaire ? {' '}
                <Link to="/connexion" className="text-[#1E3A8A] hover:text-[#FF7A00] transition-colors border-b-2 border-blue-50 hover:border-orange-100 pb-0.5">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageInscription;
