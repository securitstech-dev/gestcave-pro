import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, User, Mail, Send, CheckCircle2 } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 max-w-lg text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">Demande Reçue !</h1>
          <p className="text-slate-400 mb-8">
            Merci {formData.nom_contact}. Votre demande pour <span className="text-white font-bold">{formData.nom_etablissement}</span> a bien été transmise. 
            Notre équipe (Super Admin) va valider vos informations et vous contactera par email très prochainement pour activer votre essai gratuit de 14 jours.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full py-4">
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        
        {/* TEXTE EXPLICATIF */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              Essai Gratuit • 14 Jours
            </span>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-white mt-6 leading-tight">
              Propulsez votre <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">établissement.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md mt-6">
              Rejoignez les dizaines de bars et restaurants qui utilisent GESTCAVE PRO pour synchroniser leur salle et leur cuisine en temps réel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureSmall title="Zéro Frais" desc="Installation gratuite" />
            <FeatureSmall title="Cloud Sync" desc="Données sécurisées" />
            <FeatureSmall title="Temps Réel" desc="Cuisine synchronisée" />
            <FeatureSmall title="Support 24/7" desc="Équipe à votre écoute" />
          </div>
        </div>

        {/* FORMULAIRE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 sm:p-10"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Demander mon accès</h2>
          <p className="text-slate-400 text-sm mb-8">Remplissez ce formulaire et notre administrateur validera votre compte rapidement.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputGroup 
              icon={<Building2 size={18} />} 
              label="Nom de l'établissement" 
              placeholder="ex: Le Grand Bar de Brazza"
              value={formData.nom_etablissement}
              onChange={(e) => setFormData({...formData, nom_etablissement: e.target.value})}
            />

            <InputGroup 
              icon={<MapPin size={18} />} 
              label="Adresse Complète" 
              placeholder="ex: Rue Case Barnier, Brazzaville"
              value={formData.adresse_etablissement}
              onChange={(e) => setFormData({...formData, adresse_etablissement: e.target.value})}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputGroup 
                icon={<User size={18} />} 
                label="Responsable" 
                placeholder="Votre nom"
                value={formData.nom_contact}
                onChange={(e) => setFormData({...formData, nom_contact: e.target.value})}
              />
              <InputGroup 
                icon={<Phone size={18} />} 
                label="Téléphone" 
                placeholder="+242..."
                value={formData.telephone_contact}
                onChange={(e) => setFormData({...formData, telephone_contact: e.target.value})}
              />
            </div>

            <InputGroup 
              icon={<Mail size={18} />} 
              label="Email de contact" 
              placeholder="email@exemple.com"
              type="email"
              value={formData.email_contact}
              onChange={(e) => setFormData({...formData, email_contact: e.target.value})}
            />

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary accent w-full py-4 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Traitement en cours...' : (
                <>Envoyer la demande <Send size={18} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const InputGroup = ({ icon, label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-400">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
        {icon}
      </div>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        className="glass-input w-full pl-11 h-12"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const FeatureSmall = ({ title, desc }: any) => (
  <div className="flex gap-3 items-center">
    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
    <div>
      <h4 className="text-white text-sm font-bold">{title}</h4>
      <p className="text-slate-500 text-xs">{desc}</p>
    </div>
  </div>
);

export default PageInscription;
