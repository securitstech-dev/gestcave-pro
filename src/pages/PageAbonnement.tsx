import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Upload, CreditCard, CheckCircle2, 
  Copy, Info, ArrowLeft, Zap, ShieldCheck, 
  Clock, TrendingUp, Sparkles, X, ChevronRight,
  UserCheck, PlusCircle, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'react-router-dom';


const PageAbonnement = () => {
  const { profil } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [annuel, setAnnuel] = useState(searchParams.get('period') === 'annuel');
  const [chargement, setChargement] = useState(false);
  const [forfaitChoisi, setForfaitChoisi] = useState<any>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [methodePaiement, setMethodePaiement] = useState<'mobile' | 'direction' | null>(null);


  const forfaits = [
    { 
      id: 'starter', 
      nom: 'SaaS STARTER', 
      prix_mensuel: '15 000 FCFA',
      prix_annuel: '144 000 FCFA',
      montant_mensuel: 15000,
      montant_annuel: 144000,
      desc: 'Idéal pour les petites caves & débits de boisson.',
      features: ['1 Poste (Caisse/Serveur)', 'Gestion inventaire simple', 'Rapports journaliers'],
      color: 'slate'
    },
    { 
      id: 'premium', 
      nom: 'SaaS PREMIUM', 
      prix_mensuel: '30 000 FCFA',
      prix_annuel: '288 000 FCFA',
      montant_mensuel: 30000,
      montant_annuel: 288000,
      desc: 'Pour les restaurants & lounges à fort débit.',
      features: ['Multi-postes (Cuisine/Salle)', 'Gestion Casiers/Unités', 'Commissions Serveurs'],
      populaire: true,
      color: 'indigo'
    },
    { 
      id: 'business', 
      nom: 'SaaS BUSINESS', 
      prix_mensuel: '60 000 FCFA',
      prix_annuel: '576 000 FCFA',
      montant_mensuel: 60000,
      montant_annuel: 576000,
      desc: 'Gestion multi-sites & chaines d\'établissements.',
      features: ['Postes illimités', 'Consolidation multi-sites', 'Support Prioritaire'],
      color: 'amber'
    },
  ];


  const gererFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFichier(e.target.files[0]);
    }
  };

  const envoyerPaiement = async () => {
    if (!forfaitChoisi) return;
    setChargement(true);
    
    try {
      let urlPreuve = "";
      if (fichier) {
        const extension = fichier.name.split('.').pop();
        const nomFichier = `preuves/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const imageRef = ref(storage, nomFichier);
        const snapshot = await uploadBytes(imageRef, fichier);
        urlPreuve = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'paiements'), {
        etablissement_id: profil?.etablissement_id || '',
        montant: annuel ? forfaitChoisi.montant_annuel : forfaitChoisi.montant_mensuel,
        statut: 'en_attente',
        preuve_url: urlPreuve,
        methode: methodePaiement,
        periode: annuel ? 'annuel' : 'mensuel',
        date: new Date().toISOString()
      });
      
      toast.success('Demande enregistrée ! Notre équipe va vérifier.');
      setEtape(4);
    } catch (erreur: any) {
      toast.error(erreur.message || 'Erreur lors de l\'envoi');
    } finally {
      setChargement(false);
    }
  };

  const copierNumero = (texte: string) => {
    navigator.clipboard.writeText(texte);
    toast.success('Numéro copié !', { icon: '📋' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white py-12 md:py-20 px-6 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 md:mb-24 text-center">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/tableau-de-bord')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/[0.03] px-6 py-2 rounded-full border border-white/5 mb-10 text-xs font-black tracking-widest uppercase"
          >
            <ArrowLeft size={14} /> Retour au Dashboard
          </motion.button>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tighter"
          >
            VOTRE <span className="text-indigo-500">LICENCE</span> PRO
          </motion.h1>

          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-bold ${!annuel ? 'text-white' : 'text-slate-500'}`}>Mensuel</span>
            <button 
              onClick={() => setAnnuel(!annuel)}
              className="w-14 h-8 bg-white/10 rounded-full relative p-1 transition-colors"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${annuel ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${annuel ? 'text-white' : 'text-slate-500'}`}>Annuel</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase"> -20% </span>
            </div>
          </div>
        </header>


        {/* Stepper Premium */}
        <div className="flex justify-center flex-wrap items-center gap-4 md:gap-8 mb-20">
          {['FORFAIT', 'RÈGLEMENT', 'VALIDATION'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-4 transition-all duration-500 ${
                etape === i + 1 ? 'opacity-100 scale-110' : 'opacity-30'
              }`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${
                  etape === i + 1 ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'border-white/20 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <span className="font-black text-[10px] tracking-[0.2em]">{label}</span>
              </div>
              {i < 2 && <div className={`w-12 h-[2px] rounded-full ${etape > i + 1 ? 'bg-indigo-600' : 'bg-white/5'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {etape === 1 && (
            <motion.div 
              key="stage1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {forfaits.map((f) => (
                <div 
                  key={f.id}
                  onClick={() => { setForfaitChoisi(f); setEtape(2); }}
                  className={`relative p-10 rounded-[3.5rem] bg-white/[0.02] border-2 cursor-pointer transition-all duration-500 group flex flex-col items-center text-center overflow-hidden ${
                    f.populaire ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {f.populaire && (
                    <div className="absolute top-0 right-0 p-8">
                       <Sparkles className="text-indigo-500 animate-pulse" size={24} />
                    </div>
                  )}
                  
                  <div className={`w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform ${f.populaire ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <Zap size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-display font-black mb-2 text-white italic">{f.nom}</h3>
                  <div className="text-4xl font-display font-black text-white mb-6 tracking-tighter">
                     {annuel ? f.prix_annuel : f.prix_mensuel}
                  </div>

                  
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-tight mb-10 leading-relaxed italic">
                    {f.desc}
                  </p>

                  <div className="w-full space-y-4 mb-12">
                     {f.features.map((feat, idx) => (
                       <div key={idx} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <CheckCircle2 size={14} className="text-indigo-500" /> {feat}
                       </div>
                     ))}
                  </div>

                  <button className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest transition-all ${
                    f.populaire ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    SÉLECTIONNER CE PLAN
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {etape === 2 && (
            <motion.div 
              key="stage2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <h3 className="text-3xl font-display font-black text-center mb-10 uppercase italic">Choisir le mode de règlement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  onClick={() => { setMethodePaiement('mobile'); setEtape(3); }}
                  className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-10 cursor-pointer hover:border-indigo-500 group transition-all"
                >
                  <Smartphone className="text-indigo-500 mb-6 group-hover:scale-110 transition-transform" size={48} />
                  <h4 className="text-2xl font-black mb-2">Mobile Money</h4>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Airtel Money ou MTN MoMo</p>
                </div>

                <div 
                  onClick={() => { setMethodePaiement('direction'); setEtape(3); }}
                  className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-10 cursor-pointer hover:border-amber-500 group transition-all"
                >
                  <Building2 className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={48} />
                  <h4 className="text-2xl font-black mb-2">À la Direction</h4>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Paiement en espèces au bureau</p>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 opacity-30 cursor-not-allowed">
                  <CreditCard className="text-slate-500 mb-6" size={48} />
                  <h4 className="text-2xl font-black mb-2">Carte Bancaire</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Bientôt disponible</p>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 opacity-30 cursor-not-allowed text-center flex flex-col items-center justify-center">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Autres modes de paiement <br/> en cours d'intégration...</p>
                </div>
              </div>

              <div className="text-center pt-10">
                <button onClick={() => setEtape(1)} className="text-slate-500 font-black text-[10px] tracking-widest uppercase hover:text-white transition-all">← Retour aux forfaits</button>
              </div>
            </motion.div>
          )}

          {etape === 3 && methodePaiement === 'mobile' && (
            <motion.div 
              key="stage3_mobile"
              className="max-w-3xl mx-auto bg-white/[0.02] border border-white/10 rounded-[4rem] p-10 md:p-16 relative overflow-hidden"
            >
              <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500">
                      <Smartphone size={32} />
                  </div>
                  <div>
                      <h3 className="text-3xl font-display font-black tracking-tight italic uppercase">Règlement Mobile</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">{forfaitChoisi?.nom} — {annuel ? forfaitChoisi.prix_annuel : forfaitChoisi.prix_mensuel}</p>
                  </div>
              </div>

              <div className="space-y-6 mb-12">
                  <PaymentMethod 
                    brand="AIRTEL MONEY" 
                    number="+242 05 302 8383" 
                    color="rose" 
                    onCopy={() => copierNumero('+242053028383')} 
                  />
                  <PaymentMethod 
                    brand="MTN MOBILE MONEY" 
                    number="+242 06 881 7104" 
                    color="amber" 
                    onCopy={() => copierNumero('+242068817104')} 
                  />
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 mb-12 flex gap-6">
                  <Info className="text-indigo-400 shrink-0" size={24} />
                  <div className="text-xs font-bold uppercase tracking-widest leading-relaxed text-indigo-300">
                      Envoyez le montant exact, capturez le SMS de confirmation, puis chargez-le à l'étape suivante.
                  </div>
              </div>

              <div className="flex gap-4">
                  <button onClick={() => setEtape(2)} className="flex-1 py-5 rounded-2xl bg-white/5 text-slate-500 font-black text-[10px] tracking-widest uppercase hover:text-white transition-all">RETOUR</button>
                  <button onClick={() => setEtape(35)} className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest uppercase shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                    J'AI EFFECTUÉ LE TRANSFERT <ChevronRight size={16} />
                  </button>
              </div>
            </motion.div>
          )}

          {etape === 3 && methodePaiement === 'direction' && (
            <motion.div 
              key="stage3_direction"
              className="max-w-xl mx-auto text-center bg-white/[0.02] border border-white/10 rounded-[4rem] p-16"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-10 text-amber-500">
                <Building2 size={40} />
              </div>
              <h3 className="text-4xl font-display font-black mb-4 uppercase tracking-tighter italic">Paiement Physique</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-12 opacity-60 italic leading-relaxed">
                Vous avez choisi de régler à notre siège social. Cliquez sur le bouton ci-dessous pour nous notifier de votre visite. Notre équipe vous attendra avec votre licence prête.
              </p>
              
              <div className="flex gap-4">
                  <button onClick={() => setEtape(2)} className="flex-1 py-5 rounded-2xl bg-white/5 text-slate-500 font-black text-[10px] tracking-widest uppercase hover:text-white transition-all">RETOUR</button>
                  <button onClick={envoyerPaiement} className="flex-[2] py-5 rounded-2xl bg-amber-600 text-white font-black text-[10px] tracking-widest uppercase shadow-2xl hover:bg-amber-500 transition-all">
                    NOTIFIER MA VENUE
                  </button>
              </div>
            </motion.div>
          )}

          {etape === 35 && (
            <motion.div 
              key="stage35"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto text-center"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 text-indigo-400">
                <Upload size={40} className="animate-bounce" />
              </div>
              <h3 className="text-4xl font-display font-black mb-4 uppercase tracking-tighter">Transmission Preuve</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-12 opacity-60 italic">Chargez la capture du SMS de transfert</p>
              
              <div className="mb-12 group">
                <input 
                  type="file" 
                  id="preuve" 
                  className="hidden" 
                  accept="image/*"
                  onChange={gererFichier}
                />
                <label 
                  htmlFor="preuve"
                  className={`block border-2 border-dashed rounded-[3rem] p-16 cursor-pointer transition-all duration-500 bg-white/[0.02] ${
                    fichier ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-indigo-500/50'
                  }`}
                >
                  {fichier ? (
                    <div className="space-y-4">
                      <ShieldCheck className="mx-auto text-emerald-500" size={48} />
                      <p className="text-white font-black text-xs uppercase tracking-widest truncate max-w-xs mx-auto">{fichier.name}</p>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cliquer pour remplacer</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-700">
                          <PlusCircle size={24} />
                      </div>
                      <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Choisir un fichier (PNG, JPG)</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setEtape(3)} className="flex-1 py-5 rounded-2xl bg-white/5 text-slate-500 font-black text-[10px] tracking-widest uppercase hover:text-white transition-all">RETOUR</button>
                <button 
                  onClick={envoyerPaiement}
                  disabled={!fichier || chargement}
                  className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest uppercase shadow-2xl disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3"
                >
                  {chargement ? (
                      <> <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> ENVOI...</>
                  ) : 'VALIDER LE PAIEMENT'}
                </button>
              </div>
            </motion.div>
          )}


          {etape === 4 && (
            <motion.div 
              key="stage4"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="max-w-2xl mx-auto text-center py-10"
            >
              <div className="relative inline-block mb-12">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                    className="bg-indigo-600/20 p-12 rounded-[3.5rem] relative z-10"
                  >
                    <UserCheck className="text-indigo-500 w-24 h-24" />
                  </motion.div>
                  <div className="absolute inset-0 bg-indigo-600 blur-[80px] opacity-20" />
              </div>
              
              <h2 className="text-5xl font-display font-black mb-6 uppercase tracking-tighter italic">Demande Soumise !</h2>
              <p className="text-lg text-slate-500 font-bold uppercase tracking-widest mb-14 max-w-lg mx-auto opacity-70 leading-relaxed italic text-center">
                Merci ! Votre preuve a été envoyée. Notre équipe vérifie le transfert et active votre accès sous 30 minutes.
              </p>
              
              <button 
                onClick={() => navigate('/tableau-de-bord')} 
                className="group h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 mx-auto"
              >
                RETOUR AU TABLEAU DE BORD <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
};

// -- HELPERS --

const PaymentMethod = ({ brand, number, color, onCopy }: any) => {
    const bgColor = color === 'rose' ? 'bg-rose-500/10' : 'bg-amber-500/10';
    const borderColor = color === 'rose' ? 'border-rose-500/20' : 'border-amber-500/20';
    const textColor = color === 'rose' ? 'text-rose-500' : 'text-amber-500';
    const dotColor = color === 'rose' ? 'bg-rose-600' : 'bg-amber-600';

    return (
        <div className={`p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 group hover:border-white/20 transition-all`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{brand}</p>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-2xl md:text-3xl font-display font-black text-white tracking-widest italic">{number}</span>
                <button 
                    onClick={onCopy} 
                    className={`p-4 rounded-xl ${bgColor} ${textColor} hover:scale-110 active:scale-95 transition-all border ${borderColor}`}
                >
                    <Copy size={20} />
                </button>
            </div>
        </div>
    );
};

export default PageAbonnement;
