import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator, ArrowLeft, ChevronLeft,
  History, Zap, Phone, UserPlus, AlertCircle, Search,
  Lock, Unlock, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore, imprimerTicket } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { LigneCommande } from '../../store/posStore';

const InterfaceCaissier = () => {
  const { 
    tables, commandes, encaisserCommande, ouvrirVenteEmporter,
    sessionActive, ouvrirSession, fermerSession 
  } = usePOSStore();
  const { nomEmploye, etablissementId, quitterPoste } = usePosteSession();
  const navigate = useNavigate();
  
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile' | 'carte' | 'credit' | null>(null);
  const [montantSaisi, setMontantSaisi] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [contactClient, setContactClient] = useState('');
  const [remise, setRemise] = useState(0);
  const [refPaiement, setRefPaiement] = useState('');
  
  const [showOuvertureModal, setShowOuvertureModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [fondsSaisi, setFondsSaisi] = useState('0');

  const [searchQuery, setSearchQuery] = useState('');

  const commandesActives = useMemo(() => {
    return commandes
      .filter(c => c.statut !== 'payee')
      .filter(c => 
        (c.tableNom || 'DIRECTE').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.serveurNom || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [commandes, searchQuery]);

  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalNet = Math.max(0, (commandeActive?.total || 0) - remise);
  const montantRecu = parseFloat(montantSaisi) || 0;
  
  const resteAPayer = Math.max(0, totalNet - montantRecu);
  const monnaieRendue = (modePaiement === 'especes' && montantRecu > totalNet) 
    ? montantRecu - totalNet 
    : 0;

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
      total: items.reduce((sum, item) => sum + (Number(item.sousTotal) || 0), 0)
    })).sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
  }, [commandeActive]);

  const finaliserPaiement = () => {
    if (!commandeSelectionnee || !modePaiement) return;
    
    if ((modePaiement === 'credit' || resteAPayer > 0) && (!nomClient || !contactClient)) {
      toast.error('Nom et Contact requis pour une dette !');
      return;
    }

    if (modePaiement === 'especes' && montantRecu === 0) {
      toast.error('Veuillez saisir le montant reçu');
      return;
    }

    const toastId = toast.loading("Enregistrement...");
    try {
      encaisserCommande(
        commandeSelectionnee, 
        modePaiement === 'credit' ? 'credit' : 'comptant', 
        nomClient, 
        remise, 
        montantRecu, 
        contactClient,
        refPaiement
      );
      
      toast.success("Transaction validée !", { id: toastId, icon: '💰' });
      
      // On propose l'impression
      const etablissementNom = (window as any).etablissement_nom || 'Votre Établissement';
      if (commandeActive) {
         if (window.confirm("Voulez-vous imprimer le ticket ?")) {
            imprimerTicket(commandeActive, etablissementNom);
         }
      }
      
      setCommandeSelectionnee(null);
      setModePaiement(null);
      setMontantSaisi('');
      setNomClient('');
      setContactClient('');
      setRemise(0);
      setRefPaiement('');
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
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-50 font-display overflow-hidden text-slate-900">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Sidebar : Liste des tickets */}
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[450px] bg-white border-r border-slate-200 flex-col shadow-2xl z-20`}>
        <header className="p-8 space-y-8 bg-white/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl shadow-slate-950/20">
                <Banknote size={28} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase">Caisse Centrale</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nomEmploye}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
               <button 
                onClick={quitterPoste}
                className="p-4 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
              >
                <LogOut size={20} />
              </button>
              {sessionActive && (
                <button 
                  onClick={() => setShowClotureModal(true)}
                  className="p-4 rounded-xl hover:bg-amber-50 text-slate-300 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                  title="Clôturer la caisse"
                >
                  <Lock size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={demarrerVenteEmporter}
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ShoppingBag size={20} /> Nouveau Comptoir
            </button>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="RECHERCHER TICKET..."
                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white outline-none font-black text-[10px] tracking-widest transition-all"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4 no-scrollbar">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tickets en attente</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">{commandesActives.length}</span>
          </div>

          {commandesActives.length === 0 ? (
            <div className="text-center py-20">
               <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center mb-4">
                 <Receipt size={32} className="text-slate-200" />
               </div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun ticket actif</p>
            </div>
          ) : (
            commandesActives.map(c => (
              <motion.button
                key={c.id}
                layout
                onClick={() => setCommandeSelectionnee(c.id)}
                className={`w-full p-8 rounded-[2.5rem] border-2 text-left transition-all ${
                  commandeSelectionnee === c.id 
                    ? 'bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-950/20' 
                    : 'bg-white border-transparent hover:border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                   <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase ${
                     commandeSelectionnee === c.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {c.type === 'a_emporter' ? '⚡ Comptoir' : '🏠 Salle'}
                   </div>
                   <span className={`text-2xl font-black tracking-tighter ${commandeSelectionnee === c.id ? 'text-white' : 'text-slate-900'}`}>
                     {(c.total || 0).toLocaleString()} <span className="text-xs opacity-50">F</span>
                   </span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                  {c.tableNom || 'Directe'}
                </h3>
                <div className="flex items-center justify-between items-center gap-2 mt-4">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${commandeSelectionnee === c.id ? 'text-white/40' : 'text-slate-400'}`}>
                     {c.serveurNom}
                   </p>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                     <Clock size={12} /> {new Date(c.dateOuverture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </aside>
      
      {/* Overlay Ouverture de Caisse */}
      {!sessionActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-indigo-600">
              <Unlock size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Ouverture de Caisse</h2>
            <p className="text-slate-400 text-sm mb-10">Veuillez saisir le fonds de caisse initial pour démarrer la session.</p>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] mb-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fonds Initial (FCFA)</p>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => setFondsSaisi(e.target.value)}
                className="w-full text-center text-4xl font-black outline-none bg-transparent"
                autoFocus
               />
            </div>

            <button 
              onClick={() => ouvrirSession(Number(fondsSaisi))}
              className="w-full h-20 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/10"
            >
              Démarrer la Session
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal Clôture de Caisse */}
      {showClotureModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl text-center"
          >
            <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-amber-600">
              <Lock size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Clôture de Caisse</h2>
            <p className="text-slate-400 text-sm mb-10">Confirmez le montant total présent en caisse (espèces + autres) pour clôturer.</p>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] mb-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Montant de Clôture (FCFA)</p>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => setFondsSaisi(e.target.value)}
                className="w-full text-center text-4xl font-black outline-none bg-transparent"
                autoFocus
               />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowClotureModal(false)}
                className="flex-1 h-20 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest"
              >
                Annuler
              </button>
              <button 
                onClick={async () => {
                  await fermerSession(Number(fondsSaisi));
                  setShowClotureModal(false);
                }}
                className="flex-1 h-20 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-red-500/20"
              >
                Clôturer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Panel : Encaissement */}
      <main className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-20 text-center"
            >
              <div className="w-40 h-40 bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 flex items-center justify-center mb-10 text-slate-200">
                <Calculator size={64} />
              </div>
              <h2 className="text-3xl font-black text-slate-300 uppercase tracking-[0.4em] max-w-md">Selectionnez un ticket pour l'encaissement</h2>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 px-10 flex items-center justify-between flex-shrink-0 z-10">
                 <div className="flex items-center gap-6">
                    <button onClick={() => setCommandeSelectionnee(null)} className="p-4 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                       <ArrowLeft size={24} />
                    </button>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">{commandeActive.tableNom || 'Comptoir'}</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ticket #...{commandeActive.id.slice(-6)}</p>
                    </div>
                 </div>
                 <div className="lg:hidden text-right">
                    <p className="text-2xl font-black tracking-tighter text-indigo-600">{(commandeActive.total || 0).toLocaleString()} F</p>
                 </div>
              </header>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Details Items */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar border-r border-slate-100">
                  {tournees.map((tournee, tidx) => (
                    <div key={tidx} className="relative pl-12">
                      <div className="absolute left-4 top-4 bottom-[-30px] w-px bg-slate-200 last:bg-transparent" />
                      <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center z-10 bg-white ${tournee.time ? 'border-slate-100 text-slate-300' : 'border-indigo-600 text-indigo-600'}`}>
                        {tournee.time ? <History size={14} /> : <Zap size={14} />}
                      </div>
                      
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {tournee.time ? `Tournée ${new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Tournée en cours'}
                        </span>
                        <span className="font-bold text-slate-400 text-sm">{tournee.total.toLocaleString()} F</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {tournee.items.map(ligne => (
                          <div key={ligne.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                            <div className="flex items-center gap-5">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-900 text-xs">x{ligne.quantite}</div>
                               <div>
                                  <p className="font-bold text-sm uppercase tracking-tight">{ligne.produitNom}</p>
                                  <p className="text-[10px] font-bold text-slate-300 mt-0.5 tracking-widest">{ligne.prixUnitaire.toLocaleString()} F / unité</p>
                               </div>
                            </div>
                            <span className="font-black text-slate-900">{ligne.sousTotal.toLocaleString()} F</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Card */}
                  <div className="mt-20 p-12 bg-slate-950 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
                     <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/10">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Commande</span>
                           <span className="text-3xl font-black tracking-tighter opacity-50">{(commandeActive.total || 0).toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Montant Net à Payer</p>
                              <p className="text-7xl font-black tracking-tighter leading-none">
                                 {totalNet.toLocaleString()} <span className="text-xl">F</span>
                              </p>
                           </div>
                           <Receipt size={48} className="text-white/5 mb-2" />
                        </div>
                     </div>
                  </div>
                </div>

                {/* Bloc Paiement */}
                <div className="w-full lg:w-[500px] bg-white border-l border-slate-200 p-10 flex flex-col shadow-2xl z-10">
                   <div className="flex-1 space-y-12 overflow-y-auto no-scrollbar pb-10">
                      <section>
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">Mode de règlement</h3>
                         <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'especes', label: 'Espèces', icon: <Banknote size={24} /> },
                                { id: 'mobile', label: 'Mobile', icon: <Smartphone size={24} /> },
                                { id: 'carte', label: 'Carte', icon: <CreditCard size={24} /> },
                                { id: 'credit', label: 'Note / Dette', icon: <HistoryIcon size={24} /> },
                            ].map(m => (
                              <button
                                 key={m.id}
                                 onClick={() => {
                                   setModePaiement(m.id as any);
                                   if (m.id !== 'credit') setMontantSaisi(totalNet.toString());
                                   else setMontantSaisi('0');
                                 }}
                                 className={`h-36 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-2 ${
                                   modePaiement === m.id 
                                     ? 'bg-slate-950 border-slate-950 text-white shadow-xl scale-[1.02]' 
                                     : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                                 }`}
                              >
                                 <div className={`p-3 rounded-2xl ${modePaiement === m.id ? 'bg-white/10' : 'bg-white'}`}>
                                    {m.icon}
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                              </button>
                            ))}
                         </div>
                      </section>

                      <AnimatePresence mode="wait">
                         {modePaiement && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                               {modePaiement !== 'credit' && (
                                  <div className="space-y-4">
                                     <div className="bg-slate-50 p-10 rounded-[3rem] text-center border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Montant du versement</p>
                                        <div className="flex items-center justify-center gap-4">
                                           <input 
                                              type="number" 
                                              value={montantSaisi} 
                                              onChange={e => setMontantSaisi(e.target.value)}
                                              className="w-full text-center text-6xl font-black text-slate-950 bg-transparent outline-none tracking-tighter"
                                              autoFocus
                                           />
                                           <span className="text-3xl font-black text-slate-200">F</span>
                                        </div>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-4">
                                        {monnaieRendue > 0 && (
                                           <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center">
                                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Monnaie à rendre</p>
                                              <p className="text-2xl font-black text-emerald-800 tracking-tighter">{monnaieRendue.toLocaleString()} F</p>
                                           </div>
                                        )}
                                        {resteAPayer > 0 && (
                                           <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 text-center">
                                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Dette client</p>
                                              <p className="text-2xl font-black text-amber-800 tracking-tighter">{resteAPayer.toLocaleString()} F</p>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               )}

                               {modePaiement === 'mobile' && (
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-3 ml-4 mb-2">
                                        <Zap size={16} className="text-indigo-500" />
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Preuve de Transfert</span>
                                     </div>
                                     <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6 shadow-xl shadow-indigo-500/5">
                                        <Smartphone size={24} className="text-indigo-300" />
                                        <input 
                                           value={refPaiement} onChange={e => setRefPaiement(e.target.value)}
                                           placeholder="N° TRANSACTION (Réf)..."
                                           className="w-full font-black text-sm uppercase outline-none bg-transparent placeholder:text-indigo-200 text-indigo-900"
                                        />
                                     </div>
                                  </div>
                               )}

                               {(modePaiement === 'credit' || resteAPayer > 0) && (
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-3 ml-4 mb-2">
                                        <ShieldCheck size={16} className="text-red-500" />
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Identification Débiteur</span>
                                     </div>
                                     <div className="bg-white p-8 rounded-[2.5rem] border-2 border-red-100 space-y-6 shadow-xl shadow-red-500/5">
                                        <div className="flex items-center gap-6 border-b border-slate-50 pb-4">
                                           <User size={24} className="text-slate-200" />
                                           <input 
                                              value={nomClient} onChange={e => setNomClient(e.target.value)}
                                              placeholder="NOM DU DÉBITEUR..."
                                              className="w-full font-black text-sm uppercase outline-none placeholder:text-slate-200"
                                           />
                                        </div>
                                        <div className="flex items-center gap-6">
                                           <Phone size={24} className="text-slate-200" />
                                           <input 
                                              value={contactClient} onChange={e => setContactClient(e.target.value)}
                                              placeholder="CONTACT / TÉL..."
                                              className="w-full font-black text-sm uppercase outline-none placeholder:text-slate-200"
                                           />
                                        </div>
                                     </div>
                                  </div>
                               )}
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   <button
                      onClick={finaliserPaiement}
                      disabled={!modePaiement}
                      className="h-24 w-full rounded-[2.5rem] bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.4em] text-xs shadow-2xl transition-all active:scale-[0.98] disabled:opacity-10 flex items-center justify-center gap-4"
                   >
                     {modePaiement ? 'Valider le Paiement' : 'Attente Règlement'} <ArrowRight size={20} />
                   </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};


export default InterfaceCaissier;
