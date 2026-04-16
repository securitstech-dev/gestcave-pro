import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator, ArrowLeft, ChevronLeft,
  History, Zap, Phone, UserPlus, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { LigneCommande } from '../../store/posStore';

const InterfaceCaissier = () => {
  const { tables, commandes, encaisserCommande, ouvrirVenteEmporter } = usePOSStore();
  const { nomEmploye, etablissementId } = usePosteSession();
  const navigate = useNavigate();
  
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile' | 'carte' | 'credit' | null>(null);
  const [montantSaisi, setMontantSaisi] = useState(''); // Montant réellement reçu (acompte ou total)
  const [nomClient, setNomClient] = useState('');
  const [contactClient, setContactClient] = useState('');
  const [remise, setRemise] = useState(0);

  const commandesActives = commandes.filter(c => c.statut !== 'payee');
  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalNet = Math.max(0, (commandeActive?.total || 0) - remise);
  const montantRecu = parseFloat(montantSaisi) || 0;
  
  const resteAPayer = Math.max(0, totalNet - montantRecu);
  const monnaieRendue = (modePaiement === 'especes' && montantRecu > totalNet) 
    ? montantRecu - totalNet 
    : 0;

  // Groupement par tournées pour le résumé de caisse
  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    
    commandeActive.lignes.forEach(ligne => {
      const key = ligne.heureEnvoi || 'en_attente';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ligne);
    });

    return Object.entries(groups).map(([time, items]) => ({
      time: time === 'en_attente' ? null : time,
      items,
      total: items.reduce((sum, item) => sum + item.sousTotal, 0)
    })).sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
  }, [commandeActive]);

  const finaliserPaiement = () => {
    if (!commandeSelectionnee || !modePaiement) return;
    
    // Validation spécifique
    if (modePaiement === 'credit' || resteAPayer > 0) {
      if (!nomClient || !contactClient) {
        toast.error('Nom et Contact requis pour une dette ou un acompte !');
        return;
      }
    }

    if (modePaiement === 'especes' && montantRecu === 0) {
        toast.error('Veuillez saisir le montant reçu');
        return;
    }

    const toastId = toast.loading("Enregistrement de la transaction...");
    try {
      encaisserCommande(
        commandeSelectionnee, 
        modePaiement === 'credit' ? 'credit' : 'comptant', 
        nomClient, 
        remise, 
        montantRecu, 
        contactClient
      );
      
      toast.success(`Encaissement réussi ! ${resteAPayer > 0 ? '(Dette enregistrée)' : ''}`, { id: toastId, icon: '💰' });
      
      setCommandeSelectionnee(null);
      setModePaiement(null);
      setMontantSaisi('');
      setNomClient('');
      setContactClient('');
      setRemise(0);
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    }
  };

  const demarrerVenteEmporter = async () => {
    const id = await ouvrirVenteEmporter(etablissementId || 'caissier', nomEmploye);
    setCommandeSelectionnee(id);
    toast.success('Nouvelle vente directe', { icon: '⚡' });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl">
      {/* Liste des Tickets en attente */}
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] bg-slate-50/50 border-r border-slate-100 flex-col`}>
        <header className="p-8 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
                    <Wallet size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none uppercase">CONTOIR CAISSE</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {nomEmploye}
                    </p>
                </div>
            </div>

            <button 
              onClick={demarrerVenteEmporter}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag size={18} /> Vente Directe (Comptoir)
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En attente ({commandesActives.length})</h2>
            </div>

            {commandesActives.map(commande => {
                const estSelectionnee = commandeSelectionnee === commande.id;
                return (
                  <button
                    key={commande.id}
                    onClick={() => {
                        setCommandeSelectionnee(commande.id);
                        setModePaiement(null);
                        setMontantSaisi('');
                        setNomClient('');
                        setContactClient('');
                        setRemise(0);
                    }}
                    className={`w-full p-6 rounded-3xl text-left transition-all border-2 flex justify-between items-center ${
                      estSelectionnee 
                        ? 'border-slate-900 bg-white shadow-xl shadow-slate-900/5' 
                        : 'border-transparent bg-white hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                             estSelectionnee ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                        }`}>
                            {commande.type === 'a_emporter' ? <ShoppingBag size={20} /> : <Receipt size={20} />}
                        </div>
                        <div>
                            <span className="font-black text-slate-900 text-lg block leading-none uppercase">{commande.tableNom || 'DIRECTE'}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Serveur: {commande.serveurNom}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-display font-black text-slate-900 tracking-tighter">{commande.total.toLocaleString()} F</div>
                    </div>
                  </button>
                );
            })}
        </div>
      </aside>

      {/* Règlement et Détails */}
      <main className={`${!commandeSelectionnee ? 'hidden md:flex' : 'flex'} flex-1 bg-white flex-col overflow-hidden`}>
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-32 h-32 rounded-[3rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
                  <Calculator size={48} className="text-slate-200" />
              </div>
              <h2 className="text-2xl font-display font-black text-slate-300 uppercase tracking-[0.2em] max-w-sm">Prêt pour l'encaissement</h2>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full">
                {/* Sommaire détaillé */}
                <div className="flex-1 p-8 lg:p-14 overflow-y-auto no-scrollbar border-r border-slate-100">
                    <button onClick={() => setCommandeSelectionnee(null)} className="md:hidden flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 border border-slate-100 p-3 rounded-xl">
                        <ChevronLeft size={16} /> Retour
                    </button>

                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Ticket prêt à solder</p>
                            <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">{commandeActive.tableNom || 'COMPTOIR'}</h2>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Résumé Commande</p>
                             <p className="font-black text-slate-900">N° {commandeActive.id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="space-y-14">
                        {tournees.map((tournee, idx) => (
                            <div key={idx} className="relative pl-12">
                                <div className="absolute left-[21px] top-2 bottom-0 w-px bg-slate-100" />
                                <div className={`absolute left-0 top-0 w-11 h-11 rounded-[15px] border-2 flex items-center justify-center z-10 bg-white ${tournee.time ? 'border-slate-50 text-slate-300' : 'border-slate-900 text-slate-900'}`}>
                                    {tournee.time ? <Clock size={16} /> : <Zap size={16} />}
                                </div>
                                <div className="flex justify-between items-baseline mb-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                        {tournee.time ? `TOURNÉE DU ${new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'SÉLECTION ACTUELLE'}
                                    </h4>
                                    <span className="font-display font-black text-slate-300 text-base">{tournee.total.toLocaleString()} F</span>
                                </div>
                                <div className="space-y-4">
                                    {tournee.items.map(ligne => (
                                        <div key={ligne.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 text-[11px]">x{ligne.quantite}</span>
                                                <span className="font-bold text-slate-600 text-sm uppercase tracking-tight">{ligne.produitNom}</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-sm">{ligne.sousTotal.toLocaleString()} F</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-12 bg-slate-950 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] text-white">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-6">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">MONTANT TOTAL DU TICKET</span>
                            <span className="font-display font-bold text-slate-400 text-2xl">{commandeActive.total.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-display font-black uppercase tracking-tight">À ENCAISSER</span>
                            <span className="text-6xl font-display font-black text-white tracking-tighter">{totalNet.toLocaleString()} <span className="text-sm">F</span></span>
                        </div>
                    </div>
                </div>

                {/* Panneau de Règlement (Sidebar Droite) */}
                <aside className="w-full lg:w-[500px] p-8 lg:p-14 bg-slate-50/50 flex flex-col">
                    <div className="mb-14">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">MODE DE RÈGLEMENT</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'especes', label: 'ESPÈCES / CASH', icon: <Banknote size={24} /> },
                                { id: 'mobile', label: 'M-MONEY', icon: <Smartphone size={24} /> },
                                { id: 'carte', label: 'CARTE BANC.', icon: <CreditCard size={24} /> },
                                { id: 'credit', label: 'CRÉDIT / DETTE', icon: <HistoryIcon size={24} /> },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setModePaiement(m.id as any);
                                        if (m.id !== 'credit') setMontantSaisi(totalNet.toString());
                                        else setMontantSaisi('0');
                                    }}
                                    className={`p-10 rounded-[2rem] flex flex-col items-center gap-4 transition-all border-2 ${
                                        modePaiement === m.id 
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' 
                                        : 'bg-white border-transparent text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    {m.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                        <AnimatePresence mode="wait">
                            {(modePaiement && modePaiement !== 'credit') && (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">MONTANT REÇU (Paiement Partiel Possible)</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <input 
                                                type="number" 
                                                value={montantSaisi} 
                                                onChange={e => setMontantSaisi(e.target.value)}
                                                className="w-full text-center text-6xl font-display font-black text-slate-900 outline-none bg-transparent"
                                                autoFocus
                                            />
                                            <span className="text-2xl font-display font-black text-slate-300">F</span>
                                        </div>
                                    </div>
                                    {resteAPayer > 0 && (
                                         <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex justify-between items-center px-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight">RESTE À PAYER<br/>(Dette Client)</p>
                                            </div>
                                            <p className="text-3xl font-display font-black text-amber-800">{resteAPayer.toLocaleString()} F</p>
                                         </div>
                                    )}
                                    {monnaieRendue > 0 && (
                                         <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex justify-between items-center px-10">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">MONNAIE À RENDRE</p>
                                            <p className="text-3xl font-display font-black text-emerald-800">{monnaieRendue.toLocaleString()} F</p>
                                         </div>
                                    )}
                                </motion.div>
                            )}

                            {(modePaiement === 'credit' || resteAPayer > 0) && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Informations Débiteur obligatoire</h4>
                                    <div className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-xl shadow-red-500/5 space-y-6">
                                        <div className="flex items-center gap-5 border-b border-slate-50 pb-4">
                                            <UserPlus size={24} className="text-slate-300" />
                                            <input 
                                                type="text" 
                                                value={nomClient} 
                                                onChange={e => setNomClient(e.target.value)}
                                                placeholder="Nom complet du client..."
                                                className="w-full text-lg font-bold text-slate-900 outline-none bg-transparent placeholder:text-slate-200"
                                            />
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <Phone size={24} className="text-slate-300" />
                                            <input 
                                                type="text" 
                                                value={contactClient} 
                                                onChange={e => setContactClient(e.target.value)}
                                                placeholder="Contact (Tél, Adresse...)"
                                                className="w-full text-lg font-bold text-slate-900 outline-none bg-transparent placeholder:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic text-center px-10 font-medium">Les coordonnées sont enregistrées dans le grand livre des dettes du patron.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={finaliserPaiement}
                        disabled={!modePaiement}
                        className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[12px] shadow-2xl disabled:opacity-20 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-5 mt-10"
                    >
                        {modePaiement ? 'Finaliser & Clôturer' : 'Sélectionner Mode'} <ArrowRight size={24} />
                    </button>
                </aside>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 1024px) {
            .h-[calc(100vh-140px)] { height: auto; min-height: 100vh; }
        }
      `}</style>
    </div>
  );
};

export default InterfaceCaissier;
