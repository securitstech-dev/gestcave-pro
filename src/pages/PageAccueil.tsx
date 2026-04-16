import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ChefHat, Receipt, ArrowRight, BarChart3, ShieldCheck, Mail, Phone, MapPin, Building2, User, Send, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PageAccueil = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className="text-xl">🍷</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white drop-shadow-md">GESTCAVE PRO</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <button onClick={() => scrollToSection('fonctionnalites')} className="hover:text-white transition-colors">Fonctionnalités</button>
            <button onClick={() => scrollToSection('roles')} className="hover:text-white transition-colors">Multi-Rôles</button>
            <button onClick={() => scrollToSection('tarifs')} className="hover:text-white transition-colors">Tarifs</button>
          </nav>
          <div className="flex gap-4">
            <button onClick={() => navigate('/connexion')} className="btn-secondary py-2 px-5 text-sm">
              Connexion
            </button>
            <button onClick={() => navigate('/inscription')} className="btn-primary accent py-2 px-5 text-sm hidden md:flex">
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
                ERP SaaS Cloud • Securits Technologies
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
              <button onClick={() => scrollToSection('inscription-section')} className="btn-primary accent text-lg px-10 py-4 shadow-glow">
                Démarrer mon essai <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection('roles')} className="btn-secondary text-lg px-10 py-4 group">
                Voir la démo <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">✨</span>
              </button>
            </motion.div>
          </div>

          {/* FONCTIONNALITES SECTION */}
          <div id="fonctionnalites" className="mt-40 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bento-item p-10 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                   <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestion de Table Flow</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Visualisez en temps réel l'occupation de vos tables. Temps d'attente, statut de préparation et encaissement en un coup d'œil.</p>
              </div>
              <div className="bento-item p-10 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                   <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Stocks & Casiers</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Gérez vos boissons par casiers ou par unités. Déduction automatique sur chaque vente et alertes de réapprovisionnement.</p>
              </div>
              <div className="bento-item p-10 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                   <Smartphone size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Multi-Écrans Cloud</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Utilisez n'importe quelle tablette ou smartphone. Aucune installation serveur requise, tout est dans le cloud sécurisé.</p>
              </div>
            </div>
          </div>

          {/* APPLICATION EXPLANATION - BENTO GRID */}
          <div id="roles" className="mt-20 scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Un écran taillé pour chaque rôle</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">L'administrateur (Le Patron) a un contrôle total, tandis que le personnel n'accède qu'à ses fonctions critiques via un accès sécurisé par PIN.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardRole icon={<Smartphone />} color="indigo" title="Serveurs" desc="Prise de commande mobile ultra-rapide et envoi en cuisine." />
              <CardRole icon={<ChefHat />} color="orange" title="Cuisine" desc="Écran mural. Bons digitalisés et jauge d'urgence urgence." />
              <CardRole icon={<Receipt />} color="emerald" title="Caissier" desc="Encaissement fluide, fractionnement et Mobile Money." />
              <CardRole icon={<BarChart3 />} color="yellow" title="Le Patron" desc="Contrôle global : Stocks, RH, Comptabilité et Rapports." />
            </div>
          </div>

          {/* TARIFS SECTION */}
          <div id="tarifs" className="mt-40 mb-32 scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Plans Flexibles</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Choisissez le plan adapté à la taille de votre établissement.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PriceCard 
                name="Essai" 
                price="Gratuit" 
                duration="14 jours" 
                features={["Toutes les fonctions", "Zéro engagement", "1 établissement"]} 
                onClick={() => scrollToSection('inscription-section')}
              />
              <PriceCard 
                name="Standard" 
                price="25.000 F" 
                isRecommended={true}
                duration="/ mois" 
                features={["Multi-serveurs", "Gestion de stock", "Support 24/7"]} 
                onClick={() => scrollToSection('inscription-section')}
              />
              <PriceCard 
                name="Premium" 
                price="Local" 
                duration="Sur devis" 
                features={["Multi-sites", "Tableaux d'analyse", "Personnalisation"]} 
                onClick={() => scrollToSection('inscription-section')}
              />
            </div>
          </div>

          {/* FORMULAIRE D'INSCRIPTION DIRECT */}
             <InscriptionDirecte />
          </div>

          {/* TEMOIGNAGES */}
          <div className="mt-40 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-white mb-4">Ils nous font confiance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TestimonialCard 
                name="Mireille M." 
                role="Gérante de La Cave Dorée" 
                content="Depuis qu'on utilise GestCave Pro, je ne perds plus une seule bouteille. Le suivi des stocks par casier est une révolution pour mon inventaire." 
              />
              <TestimonialCard 
                name="Jean-Paul B." 
                role="Propriétaire de l'Escale VIP" 
                content="Mes serveurs ne courent plus dans tous les sens. La commande part en cuisine instantanément. Le gain de temps est incroyable." 
              />
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-40 mb-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-white text-center mb-16">Questions Fréquentes</h2>
            <div className="space-y-6">
              <FAQItem question="Mes données sont-elles sécurisées ?" answer="Oui, toutes vos données sont stockées sur les serveurs sécurisés de Google Firebase avec des sauvegardes quotidiennes et un chiffrement de bout en bout." />
              <FAQItem question="Puis-je l'utiliser sur mon téléphone ?" answer="Absolument. GestCave Pro est une application Cloud optimisée pour smartphones, tablettes et ordinateurs sans aucune installation requise." />
              <FAQItem question="Comment se passe le paiement de l'abonnement ?" answer="Le paiement se fait par Mobile Money ou virement. Notre équipe vous contacte 5 jours avant la fin de votre période pour renouveler votre accès." />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 relative z-10 bg-slate-900/40 backdrop-blur-3xl py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">G</div>
              <span className="font-display font-bold text-white text-xl uppercase tracking-wider">GESTCAVE PRO</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Propulsez votre établissement avec la solution de gestion cloud nouvelle génération de Securits Technologies.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Nous Contacter</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail size={16} className="text-indigo-400" /> securitstech@gmail.com
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone size={16} className="text-indigo-400" /> +242 05 302 8383
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone size={16} className="text-indigo-400" /> +242 06 811 7104
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Siège Social</h4>
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <MapPin size={16} className="text-indigo-400" /> Brazzaville, République du Congo
            </div>
            <div className="pt-6 border-t border-white/5">
              <span className="text-slate-500 text-xs">© 2026 Securits Technologies — Tous droits réservés.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// -- Sous-Composants --

interface CardRoleProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}

const CardRole = ({ icon, color, title, desc }: CardRoleProps) => (
  <div className="bento-item p-8 flex flex-col items-start gap-4">
    <div className={`w-16 h-16 rounded-2xl bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 flex items-center justify-center`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mt-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

interface PriceCardProps {
  name: string;
  price: string;
  duration: string;
  features: string[];
  onClick: () => void;
  isRecommended?: boolean;
}

const PriceCard = ({ name, price, duration, features, onClick, isRecommended = false }: PriceCardProps) => (
  <div className={`glass-panel p-8 relative flex flex-col ${isRecommended ? 'border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.2)]' : ''}`}>
    {isRecommended && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-tighter">
        Plus Populaire
      </span>
    )}
    <h4 className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-widest">{name}</h4>
    <div className="mb-8">
      <span className="text-4xl font-extrabold text-white">{price}</span>
      <span className="text-slate-500 ml-2 text-sm">{duration}</span>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-glow" />
           {f}
        </li>
      ))}
    </ul>
    <button onClick={onClick} className={`w-full py-4 rounded-xl font-bold transition-all ${isRecommended ? 'bg-indigo-600 text-white shadow-glow hover:bg-indigo-500' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
      Choisir ce plan
    </button>
  </div>
);

const InscriptionDirecte = () => {
  const [loading, setLoading] = React.useState(false);
  const [envoye, setEnvoye] = React.useState(false);
  const [formData, setFormData] = React.useState({
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
      toast.success('Demande envoyée !');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setLoading(false);
    }
  };

  if (envoye) {
    return (
      <div className="glass-panel p-12 text-center max-w-2xl mx-auto border-emerald-500/30">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">Demande Reçue !</h3>
        <p className="text-slate-400">
          Merci {formData.nom_contact}. Votre demande pour <b>{formData.nom_etablissement}</b> est en cours de validation par notre Super Admin. Vous recevrez un email sous peu.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Prêt à digitaliser votre établissement ?</h2>
        <p className="text-slate-400 text-lg mb-8">Remplissez ces quelques informations. Un conseiller Securits Technologies vous recontactera pour finaliser l'installation cloud.</p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400"><ShieldCheck size={20}/></div>
            <span>14 jours d'essai gratuit, sans engagement.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400"><Smartphone size={20}/></div>
            <span>Disponible sur Web, Android et iOS (Tablette).</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-10 border-white/10 shadow-2xl relative">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-600/20 blur-2xl rounded-full" />
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Établissement</label>
              <input required value={formData.nom_etablissement} onChange={(e)=>setFormData({...formData, nom_etablissement:e.target.value})} className="glass-input w-full" placeholder="Nom du bar/resto" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsable</label>
              <input required value={formData.nom_contact} onChange={(e)=>setFormData({...formData, nom_contact:e.target.value})} className="glass-input w-full" placeholder="Votre nom complet" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de contact</label>
            <input required type="email" value={formData.email_contact} onChange={(e)=>setFormData({...formData, email_contact:e.target.value})} className="glass-input w-full" placeholder="exemple@gmail.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone</label>
            <input required value={formData.telephone_contact} onChange={(e)=>setFormData({...formData, telephone_contact:e.target.value})} className="glass-input w-full" placeholder="+242 05..." />
          </div>
          <button type="submit" disabled={loading} className="btn-primary accent w-full py-4 mt-4 flex items-center justify-center gap-3 text-lg">
            {loading ? 'Envoi...' : <>Envoyer ma demande <Send size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

// -- Nouveaux Composants --

const TestimonialCard = ({ name, role, content }: { name: string, role: string, content: string }) => (
  <div className="glass-panel p-8 border-white/5 bg-white/5 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 text-indigo-500 opacity-20">
      <CheckCircle2 size={40} />
    </div>
    <p className="text-slate-300 italic mb-6 relative z-10">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
        {name.charAt(0)}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm">{name}</h4>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest">{role}</p>
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all group">
    <h4 className="text-white font-bold mb-2 flex items-center justify-between">
      {question}
      <ArrowRight size={16} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
    </h4>
    <p className="text-slate-400 text-sm leading-relaxed">{answer}</p>
  </div>
);

export default PageAccueil;
