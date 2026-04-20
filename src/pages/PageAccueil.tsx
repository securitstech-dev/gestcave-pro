import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ShoppingBag, Receipt, 
  ChevronRight, ArrowRight, ShieldCheck, Zap, 
  Smartphone, BarChart3, Clock, LayoutDashboard,
  Mail, Phone, MapPin, Menu, X, Globe, Star,
  Server, Cpu, Lock, Send, Flame, BookOpen, Monitor, Terminal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PageAccueil = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [modalPaiement, setModalPaiement] = useState<{ ouvert: boolean, plan: string, prix: string } | null>(null);
  const [etapePaiement, setEtapePaiement] = useState<'choix' | 'mobile' | 'direction'>('choix');
  const [operateur, setOperateur] = useState<'airtel' | 'mtn' | null>(null);
  const [justificatif, setJustificatif] = useState('');
  const [modalLegal, setModalLegal] = useState<{ ouvert: boolean, titre: string, contenu: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-slate-700 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-900/20" />
            <span className="font-bold text-xl tracking-tight text-[#1E3A8A]">GestCave Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Services', 'Technologie', 'Abonnements', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold hover:text-[#FF7A00] transition-colors">{item}</a>
            ))}
            <Link to="/connexion" className="text-sm font-bold text-[#1E3A8A] hover:opacity-70 transition-opacity">Se Connecter</Link>
            <button 
              onClick={() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-[#FF7A00] text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform"
            >
              Essai Gratuit
            </button>
          </div>

          <button className="md:hidden text-[#1E3A8A]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100 py-4 px-6 flex flex-col gap-4 md:hidden">
            {['Services', 'Technologie', 'Abonnements', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold hover:text-[#FF7A00] transition-colors">{item}</a>
            ))}
            <hr className="border-slate-100" />
            <Link to="/connexion" className="text-sm font-bold text-[#1E3A8A]">Se Connecter</Link>
            <button 
              onClick={() => { setMobileMenuOpen(false); document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-8 py-3 bg-[#FF7A00] text-white rounded-full font-bold text-sm text-center"
            >
              Essai Gratuit
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full text-[#1E3A8A] text-xs font-bold tracking-wide uppercase">
              <Star size={14} fill="currentColor" /> Ecosysteme de Gestion Premium 2.0
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1E3A8A] leading-[1.1] tracking-tight">
              Pilotez votre bar <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#FF7A00]">avec précision chirurgicale.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
              De la prise de commande à la clôture fiscale, GestCave Pro automatise chaque aspect de votre établissement. Stock, Cuisine, RH et Finance harmonisés dans une suite unique.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-[#FF7A00] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:-translate-y-1 transition-all"
              >
                Commencer l'expérience
              </button>
              <button className="px-10 py-5 bg-white border-2 border-slate-100 text-[#1E3A8A] rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                Découvrir les Modules <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-20 bg-blue-100/50 rounded-full blur-3xl" />
             <div className="relative bg-[#1E3A8A] rounded-[2.5rem] p-4 shadow-2xl shadow-blue-900/20 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden aspect-[4/3] flex flex-col border border-white/20">
                   {/* CSS Dashboard Mockup */}
                   <div className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full mx-8" />
                   </div>
                   <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-blue-50 mb-3" />
                               <div className="h-4 w-24 bg-slate-100 rounded-full mb-2" />
                               <div className="h-6 w-32 bg-slate-200 rounded-full" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-orange-50 mb-3" />
                               <div className="h-4 w-24 bg-slate-100 rounded-full mb-2" />
                               <div className="h-6 w-32 bg-[#FF7A00]/20 rounded-full" />
                            </div>
                         </div>
                         <div className="bg-white flex-1 h-40 rounded-2xl border border-slate-100 shadow-sm p-4 flex items-end gap-2">
                            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                              <div key={i} className="flex-1 bg-[#1E3A8A]/10 rounded-t-md" style={{ height: `${h}%` }} />
                            ))}
                         </div>
                      </div>
                      <div className="col-span-1 space-y-4">
                         {[1,2,3,4].map(i => (
                           <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                             <div className="w-10 h-10 rounded-full bg-slate-100" />
                             <div className="space-y-2 flex-1">
                               <div className="h-3 w-full bg-slate-200 rounded-full" />
                               <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="services" className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em]">Propulsez votre établissement</h2>
          <p className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight">Une suite logicielle intégrale.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard 
            icon={<ShoppingBag />} 
            title="Inventaire Souverain" 
            desc="Livre de compte intelligent avec suivi des bouteilles, ingrédients et consommables. Alertes de stock critique." 
          />
          <BenefitCard 
            icon={<Flame />} 
            title="KDS : Écran Cuisine" 
            desc="Système d'affichage de cuisine automatisé. Suivi des temps de service et gestion des priorités en temps réel." 
          />
          <BenefitCard 
            icon={<BookOpen />} 
            title="Grand Livre & Finance" 
            desc="Moteur comptable intégré générant des rapports de rentabilité, P&L et bilans fiscaux exports en PDF." 
          />
          <BenefitCard 
            icon={<Clock />} 
            title="RH & Pointage" 
            desc="Terminal de pointage indépendant par PIN. Calcul automatique de la paie et des commissions serveurs." 
          />
          <BenefitCard 
            icon={<Monitor />} 
            title="Multi-Terminaux" 
            desc="Interface dédiée pour chaque rôle : Serveurs (tablettes), Cuisine (moniteur), Caissier et Gérant." 
          />
          <BenefitCard 
            icon={<Terminal />} 
            title="Auto-Diagnostic" 
            desc="Console de maintenance intégrée pour le dépannage autonome. Surveillance de la santé système 24/7." 
          />
        </div>
      </section>

      {/* Technologie Section */}
      <section id="technologie" className="py-32 bg-[#1E3A8A] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-800/20 blur-[100px] rounded-full" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-4">Infrastructure Premium</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-orange-300">
                La puissance du Cloud, <br/> la robustesse du Local.
              </h3>
              <p className="text-blue-100/80 text-lg leading-relaxed mb-10">
                GestCave Pro fusionne la flexibilité du Cloud avec une résilience locale. Votre établissement ne s'arrête jamais, même sans internet.
              </p>
              
              <div className="space-y-6">
                <TechItem icon={<Server />} title="Cloud Distribué" desc="Synchronisation multi-sites instantanée via Firebase Production." />
                <TechItem icon={<Cpu />} title="Intelligence & Lab" desc="Moteur de simulation intégré pour prévoir vos stocks et vos revenus." />
                <TechItem icon={<ShieldCheck />} title="Audit Sécurisé" desc="Chaque centime est tracé. Protection contre la fraude et les erreurs de saisie." />
              </div>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-transparent z-10" />
               <div className="grid grid-cols-2 gap-4 opacity-30 transform rotate-12 scale-110">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-32 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md" />
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="abonnements" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-6 mb-16">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>Mensuel</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-16 h-8 bg-[#1E3A8A]/10 rounded-full p-1 relative transition-colors"
            >
              <div className={`w-6 h-6 bg-[#1E3A8A] rounded-full shadow-lg transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'annually' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
              Annuel <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight">-20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PriceCard 
              name="Starter" 
              price={billingCycle === 'monthly' ? "30.000" : "300.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              features={['1 Établissement', 'Gestion Stocks de base', '100 Commandes/jour', 'Support Email']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Starter', prix: billingCycle === 'monthly' ? "30.000" : "300.000" })}
            />
            <PriceCard 
              name="Premium" 
              price={billingCycle === 'monthly' ? "55.000" : "550.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              isRecommended 
              features={['3 Établissements', 'Stocks avancés + Ingrédients', 'Commandes illimitées', 'Rapports PDF exports', 'Support 24/7']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Premium', prix: billingCycle === 'monthly' ? "55.000" : "550.000" })}
            />
            <PriceCard 
              name="Business" 
              price={billingCycle === 'monthly' ? "95.000" : "950.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              features={['Établissements illimités', 'Gestion Multi-niveaux', 'Salaires & RH auto', 'Audit complet', 'Support Prioritaire']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Business', prix: billingCycle === 'monthly' ? "95.000" : "950.000" })}
            />
          </div>
        </div>
      </section>

      {/* Modal Paiement */}
      {modalPaiement?.ouvert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div onClick={() => setModalPaiement(null)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="bg-white w-full max-w-2xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            <button onClick={() => setModalPaiement(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all">
              <X size={24} />
            </button>

            <div className="text-center mb-10">
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Finaliser mon abonnement</h3>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{modalPaiement.plan} • {modalPaiement.prix} XAF</p>
            </div>

            {etapePaiement === 'choix' && (
              <div className="space-y-4">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-8">Choisissez votre mode de règlement</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setEtapePaiement('mobile'); setOperateur('airtel'); }}
                      className="p-8 bg-rose-50 border-2 border-rose-100 rounded-3xl flex flex-col items-center gap-4 hover:border-rose-300 transition-all group"
                    >
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <img src="/logo_airtel.png" alt="Airtel" className="w-10 h-10 object-contain" />
                       </div>
                       <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">Airtel Money</span>
                    </button>
                    <button 
                      onClick={() => { setEtapePaiement('mobile'); setOperateur('mtn'); }}
                      className="p-8 bg-amber-50 border-2 border-amber-100 rounded-3xl flex flex-col items-center gap-4 hover:border-amber-300 transition-all group"
                    >
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <img src="/logo_mtn.png" alt="MTN" className="w-10 h-10 object-contain" />
                       </div>
                       <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">MTN MoMo</span>
                    </button>
                 </div>
                 <button 
                    onClick={() => setEtapePaiement('direction')}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-center gap-4 hover:border-blue-200 transition-all"
                 >
                    <MapPin size={24} className="text-[#1E3A8A]" />
                    <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">Payer à la direction</span>
                 </button>
              </div>
            )}

            {etapePaiement === 'mobile' && (
               <div className="space-y-8">
                  <div className={`p-8 rounded-[2.5rem] text-center ${operateur === 'airtel' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Transfert Mobile</p>
                     <p className="text-2xl font-black text-[#1E3A8A] mb-2">Envoyez votre paiement au :</p>
                     <p className="text-4xl font-black text-[#FF7A00] tracking-tighter">
                        {operateur === 'airtel' ? '05 302 83 83' : '06 902 44 44'}
                     </p>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Message de justification (ID Transaction / Nom)</label>
                     <textarea 
                        value={justificatif}
                        onChange={(e) => setJustificatif(e.target.value)}
                        placeholder="Ex: ID 92837482 - Cave de la Paix"
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-[#1E3A8A] transition-all font-bold text-sm"
                        rows={3}
                     />
                  </div>

                  <div className="flex gap-4">
                     <button onClick={() => setEtapePaiement('choix')} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Retour</button>
                     <button 
                        onClick={() => { 
                          toast.success("Demande de paiement envoyée !"); 
                          setModalPaiement(null); 
                          setEtapePaiement('choix');
                          setJustificatif('');
                        }}
                        className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10"
                     >
                        Valider mon paiement
                     </button>
                  </div>
               </div>
            )}

            {etapePaiement === 'direction' && (
               <div className="space-y-8 text-center">
                  <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mx-auto shadow-inner">
                     <MapPin size={40} />
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">Adresse de la Direction</h4>
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
                        <div className="flex gap-4">
                           <MapPin className="text-[#FF7A00] flex-shrink-0" size={24} />
                           <p className="text-slate-600 font-bold leading-relaxed">
                             Bâtiment de la préfecture en face du trésor <br/>
                             À la direction départementale des loisirs de pointe-noire
                           </p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                           <ShieldCheck className="text-[#1E3A8A] flex-shrink-0" size={24} />
                           <p className="text-xs font-bold text-[#1E3A8A] leading-relaxed italic">
                             "Une fois sur place, nous encaissons le montant de l'abonnement contre un reçu officiel. Votre application sera débloquée instantanément."
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setEtapePaiement('choix')} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Retour</button>
                     <button 
                        onClick={() => setModalPaiement(null)}
                        className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10"
                     >
                        J'ai compris
                     </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Section */}
      <section id="inscription" className="py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E3A8A]">Prêt à transformer votre bar ?</h2>
          <p className="text-slate-500 text-lg">Inscrivez-vous pour un essai gratuit de 14 jours. Aucune carte bancaire requise. Nos experts vous accompagnent pour la mise en place.</p>
          <div className="p-2 bg-gradient-to-br from-[#1E3A8A] to-blue-900 rounded-[3.5rem] shadow-2xl shadow-blue-900/20">
            <InscriptionDirecte />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-4">Support & Commercial</h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-[#1E3A8A] mb-8">
              Une question ? <br/> Contactez-nous.
            </h3>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Notre équipe est basée à Brazzaville et se tient prête à venir faire une démonstration gratuite directement dans votre établissement.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Téléphone (WhatsApp)</p>
                  <p className="text-xl font-bold text-[#1E3A8A]">+242 05 302 8383</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Email Pro</p>
                  <p className="text-lg font-bold text-[#1E3A8A]">securitstech@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success("Message envoyé ! Nous vous contacterons rapidement."); }}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Nom Complet</label>
                <input required type="text" placeholder="Jean Dupont" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Email ou Téléphone</label>
                <input required type="text" placeholder="Pour vous recontacter" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                <textarea required rows={4} placeholder="Comment pouvons-nous vous aider ?" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <button type="submit" className="w-full h-14 bg-[#1E3A8A] text-white rounded-xl font-bold hover:bg-[#FF7A00] transition-colors flex items-center justify-center gap-2">
                Envoyer le message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-[#0F172A] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                <span className="font-bold text-2xl tracking-tight">GestCave Pro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Le système d'exploitation souverain pour les établissements de loisirs. Conçu pour la performance, audité pour la sécurité.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Globe size={18} /></div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Mail size={18} /></div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Phone size={18} /></div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Solution</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#services" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#technologie" className="hover:text-white transition-colors">Infrastructure Cloud</a></li>
                <li><a href="#abonnements" className="hover:text-white transition-colors">Tarifs & Plans</a></li>
                <li><a href="/connexion" className="hover:text-white transition-colors">Portail Client</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Légal & Protection</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Mentions Légales", contenu: "GestCave Pro est une solution éditée par Securits Tech, basée à Brazzaville et Pointe-Noire. Direction Départementale des Loisirs." })} className="hover:text-white transition-colors">Mentions Légales</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Confidentialité", contenu: "Vos données de ventes, de stocks et de personnel sont strictement confidentielles et cryptées. Aucun accès tiers n'est autorisé." })} className="hover:text-white transition-colors">Politique de Confidentialité</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Conditions d'Utilisation", contenu: "L'utilisation de GestCave Pro implique l'acceptation de nos audits de sécurité. L'abonnement est payable d'avance à la direction." })} className="hover:text-white transition-colors">Conditions (CGU)</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Audit & Sécurité", contenu: "Le système est audité 24/7 pour prévenir toute fraude interne dans votre établissement." })} className="hover:text-white transition-colors">Rapport de Sécurité</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Siège Social</h4>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                Bâtiment de la Préfecture<br/>
                Face au Trésor Public<br/>
                Direction des Loisirs<br/>
                Pointe-Noire, Congo
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              © 2026 Securits Tech • Tous droits réservés
            </p>
            <div className="flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Fait avec excellence au Congo</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Système Opérationnel</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Légal */}
      {modalLegal?.ouvert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div onClick={() => setModalLegal(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
          <div className="bg-white w-full max-w-xl p-12 rounded-[2.5rem] shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight mb-6">{modalLegal.titre}</h3>
            <div className="prose prose-slate mb-8">
              <p className="text-slate-600 font-medium leading-relaxed">{modalLegal.contenu}</p>
            </div>
            <button 
              onClick={() => setModalLegal(null)}
              className="w-full h-14 bg-slate-100 text-[#1E3A8A] rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-10 bg-white rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
      {React.cloneElement(icon as any, { size: 28 })}
    </div>
    <h3 className="text-xl font-bold text-[#1E3A8A] mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

const TechItem = ({ icon, title, desc }: any) => (
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-blue-100/70 text-sm">{desc}</p>
    </div>
  </div>
);

const PriceCard = ({ name, price, duration = 'MOIS', features, onClick, isRecommended = false }: any) => (
  <div className={`p-10 rounded-[2.5rem] relative flex flex-col transition-all ${isRecommended ? 'bg-white shadow-2xl z-10 scale-105 border-2 border-[#1E3A8A]' : 'bg-white border border-slate-100 hover:border-blue-100'}`}>
    {isRecommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF7A00] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Le Plus Populaire</div>}
    <h4 className="font-bold text-[#1E3A8A] text-lg mb-8">{name}</h4>
    <div className="mb-10 text-center">
        <span className="text-5xl font-black text-[#1E3A8A] tracking-tighter">{price}</span>
        <span className="text-slate-400 font-bold ml-2">XAF / {duration}</span>
    </div>
    <ul className="space-y-5 mb-12 flex-grow">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-4 text-sm font-medium text-slate-500">
           <CheckCircle2 size={18} className="text-[#10B981]" />
           {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={onClick} 
      className={`w-full h-16 rounded-2xl font-bold text-sm transition-all ${isRecommended ? 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800' : 'bg-slate-100 text-[#1E3A8A] hover:bg-slate-200'}`}
    >
      Démarrer maintenant
    </button>
  </div>
);

const InscriptionDirecte = () => {
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [formData, setFormData] = useState({
    nom_etablissement: '',
    adresse_etablissement: '',
    telephone_contact: '',
    nom_contact: '',
    email_contact: '',
    accepte_cgu: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'demandes_acces'), {
        ...formData,
        statut: 'en_attente',
        date_demande: Timestamp.now(),
      });
      setEnvoye(true);
      toast.success("Demande envoyée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  if (envoye) return (
    <div className="bg-white p-12 rounded-[3rem]">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="text-emerald-500" size={40} />
      </div>
      <h3 className="text-3xl font-bold mb-4 text-[#1E3A8A]">Demande Reçue !</h3>
      <p className="text-slate-500 font-medium">Nos équipes analysent votre dossier. Vous recevrez un email d'activation sous 24h.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 md:p-14 rounded-[3rem] text-slate-800 text-left grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Établissement</label>
        <input required type="text" placeholder="Nom de votre bar/resto" value={formData.nom_etablissement} onChange={e => setFormData({...formData, nom_etablissement: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Localisation</label>
        <input required type="text" placeholder="Ville, Quartier" value={formData.adresse_etablissement} onChange={e => setFormData({...formData, adresse_etablissement: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Responsable</label>
        <input required type="text" placeholder="Votre nom complet" value={formData.nom_contact} onChange={e => setFormData({...formData, nom_contact: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Téléphone</label>
        <input required type="tel" placeholder="+242 0x xxx xx xx" value={formData.telephone_contact} onChange={e => setFormData({...formData, telephone_contact: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="md:col-span-2 space-y-4 pt-4">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center pt-1">
            <input 
              required 
              type="checkbox" 
              checked={formData.accepte_cgu} 
              onChange={e => setFormData({...formData, accepte_cgu: e.target.checked})}
              className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 bg-slate-50 transition-all checked:border-[#1E3A8A] checked:bg-[#1E3A8A] focus:outline-none"
            />
            <CheckCircle2 size={16} className="pointer-events-none absolute left-1 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            Je certifie l'exactitude de ces informations et j'accepte les <span className="text-[#1E3A8A] underline">Conditions Générales d'Utilisation</span> de GestCave Pro pour protéger mon établissement et garantir la sécurité de mes données.
          </p>
        </label>
      </div>
      <div className="md:col-span-2 pt-2">
        <button type="submit" disabled={loading} className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
          {loading ? 'Traitement en cours...' : 'Envoyer ma Demande d\'Accès'}
        </button>
      </div>
    </form>
  );
};

export default PageAccueil;
