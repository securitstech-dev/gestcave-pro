import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ChefHat, Receipt, ArrowRight, BarChart3, ShieldCheck, Mail, Phone, MapPin, Building2, User, Send, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PageAccueil = () => {
  const navigate = useNavigate();

  const [annuel, setAnnuel] = React.useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between overflow-x-hidden text-slate-900">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/logo_gestcave.png" alt="GestCave Pro Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-slate-900/20" />
            <span className="font-display font-bold text-2xl tracking-tight text-slate-900">GESTCAVE PRO</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-500 uppercase tracking-wider">
            <button onClick={() => scrollToSection('fonctionnalites')} className="hover:text-slate-900 transition-colors">Fonctionnalités</button>
            <button onClick={() => scrollToSection('roles')} className="hover:text-slate-900 transition-colors">Multi-Rôles</button>
            <button onClick={() => scrollToSection('tarifs')} className="hover:text-slate-900 transition-colors">Tarifs</button>
          </nav>
          <div className="flex gap-4">
            <button onClick={() => navigate('/connexion')} className="px-5 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Connexion
            </button>
            <button onClick={() => navigate('/inscription')} className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-colors hidden md:flex items-center">
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-600 font-bold tracking-wide mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ERP SaaS Cloud • Securits Technologies
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-[5.5rem] font-display font-black tracking-tight text-slate-900 leading-[1.1] mb-8"
            >
              Écoulez plus. <br/>
              <span className="text-slate-500">Perdez moins.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl"
            >
              Le logiciel de caisse et de gestion de stock pensé pour l'Afrique Centrale. Stoppez les vols de bouteilles, accélérez vos encaissements et surveillez votre bar depuis votre téléphone.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
              <button onClick={() => scrollToSection('inscription-section')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-lg px-10 py-4 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                Démarrer mon essai <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection('roles')} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl text-lg px-10 py-4 shadow-sm transition-transform active:scale-95 group">
                Voir la démo <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">✨</span>
              </button>
            </motion.div>
          </div>

          {/* FONCTIONNALITES SECTION */}
          <div id="fonctionnalites" className="mt-40 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                   <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Gestion de Table Flow</h3>
                <p className="text-slate-500 text-sm leading-relaxed font- মাঝারি">Visualisez en temps réel l'occupation de vos tables. Temps d'attente, statut de préparation et encaissement en un coup d'œil.</p>
              </div>
              <div className="bg-white p-10 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                   <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Stocks & Casiers</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">Gérez vos boissons par casiers ou par unités. Déduction automatique sur chaque vente et alertes de réapprovisionnement.</p>
              </div>
              <div className="bg-white p-10 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                   <Smartphone size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Écrans Cloud</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">Utilisez n'importe quelle tablette ou smartphone. Aucune installation serveur requise, tout est dans le cloud sécurisé.</p>
              </div>
            </div>
          </div>

          {/* APPLICATION EXPLANATION - BENTO GRID */}
          <div id="roles" className="mt-20 scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-4">Un écran taillé pour chaque rôle</h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto">L'administrateur (Le Patron) a un contrôle total, tandis que le personnel n'accède qu'à ses fonctions critiques via un accès sécurisé par PIN.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardRole icon={<Smartphone />} color="indigo" title="Serveurs" desc="Prise de commande mobile ultra-rapide et envoi en cuisine." />
              <CardRole icon={<ChefHat />} color="orange" title="Cuisine" desc="Écran mural. Bons digitalisés et jauge d'urgence urgence." />
              <CardRole icon={<Receipt />} color="emerald" title="Caissier" desc="Encaissement fluide, fractionnement et Mobile Money." />
              <CardRole icon={<BarChart3 />} color="slate" title="Le Patron" desc="Contrôle global : Stocks, RH, Comptabilité et Rapports." />
            </div>
          </div>

          {/* TARIFS SECTION */}
          <div id="tarifs" className="mt-40 mb-32 scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-4">Plans Flexibles</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto mb-10">Choisissez le plan adapté à la taille de votre établissement.</p>
              
              <div className="flex items-center justify-center gap-4 mb-10">
                <span className={`text-sm font-bold ${!annuel ? 'text-slate-900' : 'text-slate-400'}`}>Mensuel</span>
                <button 
                  onClick={() => setAnnuel(!annuel)}
                  className="w-14 h-8 bg-slate-200 rounded-full relative p-1 transition-colors"
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${annuel ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${annuel ? 'text-slate-900' : 'text-slate-400'}`}>Annuel</span>
                  <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase"> -20% </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PriceCard 
                name="Starter" 
                price={annuel ? "144.000 F" : "15.000 F"} 
                duration={annuel ? "/ an" : "/ mois"} 
                features={["1 Poste (Caisse/Serveur)", "Gestion inventaire simple", "Rapports journaliers"]} 
                onClick={() => navigate(`/inscription?plan=starter&period=${annuel ? 'annuel' : 'mensuel'}`)}
              />
              <PriceCard 
                name="Premium" 
                price={annuel ? "288.000 F" : "30.000 F"} 
                isRecommended={true}
                duration={annuel ? "/ an" : "/ mois"} 
                features={["Multi-postes (Cuisine/Salle)", "Gestion Casiers/Unités", "Commissions Serveurs"]} 
                onClick={() => navigate(`/inscription?plan=premium&period=${annuel ? 'annuel' : 'mensuel'}`)}
              />
              <PriceCard 
                name="Business" 
                price={annuel ? "576.000 F" : "60.000 F"} 
                duration={annuel ? "/ an" : "/ mois"} 
                features={["Postes illimités", "Consolidation multi-sites", "Support Prioritaire 24/7"]} 
                onClick={() => navigate(`/inscription?plan=business&period=${annuel ? 'annuel' : 'mensuel'}`)}
              />
            </div>
          </div>

          {/* FORMULAIRE D'INSCRIPTION DIRECT */}
          <InscriptionDirecte />

          {/* TEMOIGNAGES */}
          <div className="mt-40 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-black text-slate-900 mb-4">Ils nous font confiance</h2>
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
            <h2 className="text-3xl font-display font-black text-slate-900 text-center mb-16">Questions Fréquentes</h2>
            <div className="space-y-4">
              <FAQItem question="Mes données sont-elles sécurisées ?" answer="Oui, toutes vos données sont stockées sur les serveurs sécurisés de Google Firebase avec des sauvegardes quotidiennes et un chiffrement de bout en bout." />
              <FAQItem question="Puis-je l'utiliser sur mon téléphone ?" answer="Absolument. GestCave Pro est une application Cloud optimisée pour smartphones, tablettes et ordinateurs sans aucune installation requise." />
              <FAQItem question="Comment se passe le paiement de l'abonnement ?" answer="Le paiement se fait par Mobile Money ou virement. Notre équipe vous contacte 5 jours avant la fin de votre période pour renouveler votre accès." />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img src="/logo_gestcave.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md" />
              <span className="font-display font-black text-slate-900 text-xl uppercase tracking-wider">GESTCAVE PRO</span>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
              Propulsez votre établissement avec la solution de gestion cloud nouvelle génération de Securits Technologies.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nous Contacter</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                <Mail size={16} className="text-slate-400" /> securitstech@gmail.com
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                <Phone size={16} className="text-slate-400" /> +242 05 302 8383
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                <Phone size={16} className="text-slate-400" /> +242 06 811 7104
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Siège Social</h4>
            <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
              <MapPin size={16} className="text-slate-400" /> Brazzaville, République du Congo
            </div>
            <div className="pt-6 border-t border-slate-100 mt-8">
              <span className="text-slate-400 text-xs font-medium">© 2026 Securits Technologies — Tous droits réservés.</span>
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
  <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm flex flex-col items-start gap-4">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 border border-${color}-100 text-${color}-600 flex items-center justify-center`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mt-2">{title}</h3>
    <p className="text-slate-500 font-medium text-sm leading-relaxed">{desc}</p>
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
  <div className={`bg-white p-8 rounded-3xl border relative flex flex-col ${isRecommended ? 'border-slate-900 shadow-xl shadow-slate-900/10' : 'border-slate-200 shadow-sm'}`}>
    {isRecommended && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] uppercase font-black tracking-widest shadow-md">
        Plus Populaire
      </span>
    )}
    <h4 className="text-slate-400 font-black mb-2 uppercase text-[10px] tracking-widest">{name}</h4>
    <div className="mb-8">
      <span className="text-4xl font-black text-slate-900">{price}</span>
      <span className="text-slate-400 font-medium ml-2 text-sm">{duration}</span>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
           {f}
        </li>
      ))}
    </ul>
    <button onClick={onClick} className={`w-full py-4 rounded-xl font-bold transition-all ${isRecommended ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'}`}>
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
      <div id="inscription-section" className="bg-white p-12 text-center max-w-2xl mx-auto rounded-3xl border border-emerald-200 shadow-xl shadow-emerald-500/10">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-4">Demande Reçue !</h3>
        <p className="text-slate-500 font-medium">
          Merci {formData.nom_contact}. Votre demande pour <b className="text-slate-900">{formData.nom_etablissement}</b> est en cours de validation par notre équipe. Vous recevrez un email sous peu.
        </p>
      </div>
    );
  }

  return (
    <div id="inscription-section" className="grid lg:grid-cols-2 gap-16 items-center scroll-mt-24">
      <div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6">Prêt à digitaliser votre établissement ?</h2>
        <p className="text-slate-500 font-medium text-lg mb-8">Remplissez ces quelques informations. Un conseiller Securits Technologies vous recontactera pour finaliser l'installation cloud.</p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-slate-700 font-bold">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><ShieldCheck size={20}/></div>
            <span>14 jours d'essai gratuit, sans engagement.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-700 font-bold">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><Smartphone size={20}/></div>
            <span>Disponible sur Web, Android et iOS.</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Établissement</label>
              <input required value={formData.nom_etablissement} onChange={(e)=>setFormData({...formData, nom_etablissement:e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900" placeholder="Nom du bar/resto" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
              <input required value={formData.nom_contact} onChange={(e)=>setFormData({...formData, nom_contact:e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900" placeholder="Votre nom complet" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de contact</label>
            <input required type="email" value={formData.email_contact} onChange={(e)=>setFormData({...formData, email_contact:e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900" placeholder="exemple@gmail.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
            <input required value={formData.telephone_contact} onChange={(e)=>setFormData({...formData, telephone_contact:e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-slate-900 transition-all font-medium text-slate-900" placeholder="+242 05..." />
          </div>
          <button type="submit" disabled={loading} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] mt-4 flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-md">
            {loading ? 'Envoi en cours...' : <>Envoyer ma demande <Send size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

const TestimonialCard = ({ name, role, content }: { name: string, role: string, content: string }) => (
  <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden group">
    <p className="text-slate-600 italic font-medium mb-6 relative z-10">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-900 text-sm">
        {name.charAt(0)}
      </div>
      <div>
        <h4 className="text-slate-900 font-bold text-sm">{name}</h4>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{role}</p>
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm group">
    <h4 className="text-slate-900 font-bold mb-2 flex items-center justify-between">
      {question}
    </h4>
    <p className="text-slate-500 font-medium text-sm leading-relaxed">{answer}</p>
  </div>
);

export default PageAccueil;
