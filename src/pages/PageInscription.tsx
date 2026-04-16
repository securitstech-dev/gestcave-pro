import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, User, Mail, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PageInscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const [formData, setFormData] = useState({
    nom_etablissement: '',
    adresse_etablissement: '',
    telephone_contact: '',
    nom_contact: '',
    email_contact: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'demandes_acces'), {
        ...formData,
        statut: 'en_attente',
        date_demande: new Date().toISOString(),
        plan: 'essai_gratuit'
      });

      setEnvoye(true);
      toast.success('Votre demande a été envoyée avec succès !');
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setLoading(false);
    }
  };

  if (envoye) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 max-w-lg text-center rounded-[3rem] shadow-2xl shadow-emerald-500/10 border border-emerald-100"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-inner">
            <CheckCircle2 size={56} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">Demande Reçue !</h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Merci <span className="text-slate-900 font-bold">{formData.nom_contact}</span>. Votre demande d'accès pour <span className="text-indigo-600 font-bold">{formData.nom_etablissement}</span> a été transmise avec succès à notre équipe.
            <br/><br/>
            Un conseiller <span className="text-slate-900 font-bold">Securits Technologies</span> analysera votre dossier et vous contactera par email sous 24h.
          </p>
          <button onClick={() => navigate('/')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
            Retour au site
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="max-w-7xl mx-auto px-6 h-24 flex items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-bold text-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
                  <ArrowLeft size={18} />
              </div>
              <span className="uppercase tracking-widest text-[10px] font-black">Retour Accueil</span>
          </button>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center py-10 pb-32">
        
        <div className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Essai Gratuit • 14 Jours
            </div>
            <h1 className="text-6xl md:text-[5.5rem] font-display font-black text-slate-900 leading-[0.95] tracking-tighter mb-8">
              Digitalisez votre <br/>
              <span className="text-indigo-600">établissement.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                Rejoignez les dizaines d'établissements qui font confiance à <span className="text-slate-900 font-bold">GESTCAVE PRO</span> pour une synchronisation totale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <FeatureItem title="Zéro Frais" desc="Installation gratuite" color="indigo" />
            <FeatureItem title="Cloud Sync" desc="Données sécurisées" color="emerald" />
            <FeatureItem title="Temps Réel" desc="Cuisine synchronisée" color="rose" />
            <FeatureItem title="Support 24/7" desc="Équipe à l'écoute" color="slate" />
          </div>
        </div>

        {/* FORMULAIRE CLAIR & PREMIUM */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 sm:p-14 rounded-[4rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 relative"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">Demander mon accès</h2>
            <p className="text-slate-400 font-medium">Validation immédiate par nos administrateurs.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <ModernInput 
              icon={<Building2 size={20} />} 
              label="Nom de l'établissement" 
              placeholder="ex: Le Grand Bar de Brazza"
              value={formData.nom_etablissement}
              onChange={(e: any) => setFormData({...formData, nom_etablissement: e.target.value})}
            />

            <ModernInput 
              icon={<MapPin size={20} />} 
              label="Adresse Complète" 
              placeholder="ex: Rue Case Barnier, Brazzaville"
              value={formData.adresse_etablissement}
              onChange={(e: any) => setFormData({...formData, adresse_etablissement: e.target.value})}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <ModernInput 
                icon={<User size={20} />} 
                label="Responsable" 
                placeholder="Votre nom"
                value={formData.nom_contact}
                onChange={(e: any) => setFormData({...formData, nom_contact: e.target.value})}
              />
              <ModernInput 
                icon={<Phone size={20} />} 
                label="Téléphone" 
                placeholder="+242 0x xxx xxxx"
                value={formData.telephone_contact}
                onChange={(e: any) => setFormData({...formData, telephone_contact: e.target.value})}
              />
            </div>

            <ModernInput 
              icon={<Mail size={20} />} 
              label="Email de contact" 
              placeholder="contact@exemple.com"
              type="email"
              value={formData.email_contact}
              onChange={(e: any) => setFormData({...formData, email_contact: e.target.value})}
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-20 bg-slate-900 text-white rounded-[1.8rem] font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all mt-6 flex items-center justify-center gap-4 hover:bg-slate-800"
            >
              {loading ? 'Envoi en cours...' : (
                <>Envoyer la demande <Send size={20} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const ModernInput = ({ icon, label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-3">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-slate-900 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        className="w-full pl-14 h-16 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:shadow-xl focus:shadow-indigo-500/5 transition-all font-bold text-slate-900"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const FeatureItem = ({ title, desc, color }: any) => (
  <div className="flex gap-5 items-center group">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-500/5 border border-${color}-100 flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform`}>
        <CheckCircle2 size={24} />
    </div>
    <div>
      <h4 className="text-slate-900 text-base font-black uppercase tracking-tight">{title}</h4>
      <p className="text-slate-400 text-sm font-medium">{desc}</p>
    </div>
  </div>
);

export default PageInscription;
