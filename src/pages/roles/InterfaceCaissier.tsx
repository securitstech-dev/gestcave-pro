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
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[190px] bg-white border-r border-slate-200 flex-col shadow-xl z-20`}>
        <header className="p-2 space-y-2 bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white shadow-lg">
                <Banknote size={16} />
              </div>
              <div>
                <h1 className="text-[10px] font-black tracking-tight uppercase leading-none">Caisse</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">{nomEmploye}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
               <button 
                onClick={quitterPoste}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
              >
                <LogOut size={14} />
              </button>
              {sessionActive && (
                <button 
                  onClick={() => setShowClotureModal(true)}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-300 hover:text-amber-600 transition-all"
                  title="Clôturer"
                >
                  <Lock size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <button 
              onClick={demarrerVenteEmporter}
              className="w-full h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[7px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={12} /> Vente Directe
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="RECHERCHER..."
                className="w-full h-7 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-100 focus:border-indigo-400 outline-none font-black text-[7px] tracking-widest"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 no-scrollbar">
          <div className="px-1 py-2 flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tickets actifs</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[8px]">{commandesActives.length}</span>
          </div>

          {commandesActives.length === 0 ? (
            <div className="text-center py-6">
               <Receipt size={20} className="text-slate-200 mx-auto mb-1" />
               <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Aucun ticket</p>
            </div>
          ) : (
            commandesActives.map(c => (
              <motion.button
                key={c.id}
                layout
                onClick={() => setCommandeSelectionnee(c.id)}
                className={`w-full p-1.5 rounded-xl border text-left transition-all ${
                  commandeSelectionnee === c.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className={`px-1.5 py-0.5 rounded text-[7px] font-black tracking-widest uppercase ${
                     commandeSelectionnee === c.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {c.type === 'a_emporter' ? '⚡ Comptoir' : '🏠 Salle'}
                   </div>
                   {tables.find(t => t.commandeActiveId === c.id)?.statut === 'en_attente_paiement' && (
                      <div className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[7px] font-black tracking-widest uppercase animate-pulse">
                         Paiement Demandé
                      </div>
                   )}
                   <span className={`text-[11px] font-black tracking-tight ${commandeSelectionnee === c.id ? 'text-white' : 'text-slate-900'}`}>
                     {(c.total || 0).toLocaleString()} <span className="text-[7px] font-normal opacity-50">F</span>
                   </span>
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-tight leading-none truncate">
                  {c.tableNom || 'Directe'}
                </h3>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                   <p className={`text-[7px] font-black uppercase tracking-widest truncate ${commandeSelectionnee === c.id ? 'text-white/40' : 'text-slate-400'}`}>
                     {c.serveurNom}
                   </p>
                   <div className="flex items-center gap-1 text-[7px] font-bold opacity-60">
                     <Clock size={8} /> {new Date(c.dateOuverture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </aside>
      
      {/* Overlay Ouverture de Caisse */}
      {!sessionActive && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Unlock size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Ouverture de Caisse</h2>
            <p className="text-slate-400 text-[10px] mb-6 uppercase tracking-widest font-bold">Fonds de caisse initial</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">Montant (FCFA)</p>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => setFondsSaisi(e.target.value)}
                className="w-full text-center text-3xl font-black outline-none bg-transparent"
                autoFocus
               />
            </div>

            <button 
              onClick={() => ouvrirSession(Number(fondsSaisi))}
              className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/10 text-[10px]"
            >
              Démarrer la Session
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal Clôture de Caisse */}
      {showClotureModal && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center border border-slate-100"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Clôture de Caisse</h2>
            <p className="text-slate-400 text-[10px] mb-6 uppercase tracking-widest font-bold">Confirmez le montant total</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">Montant de Clôture (FCFA)</p>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => setFondsSaisi(e.target.value)}
                className="w-full text-center text-3xl font-black outline-none bg-transparent"
                autoFocus
               />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowClotureModal(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px]"
              >
                Annuler
              </button>
              <button 
                onClick={async () => {
                  await fermerSession(Number(fondsSaisi));
                  setShowClotureModal(false);
                }}
                className="flex-1 h-12 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-red-500/10"
              >
                Clôturer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Panel : Encaissement */}
      <main className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden h-full">
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mb-6 text-slate-200">
                <Calculator size={48} />
              </div>
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em] max-w-[200px]">Sélectionnez un ticket pour l'encaissement</h2>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <header className="h-8 bg-white border-b border-slate-100 px-3 flex items-center justify-between flex-shrink-0 z-10">
                 <div className="flex items-center gap-3">
                    <button onClick={() => setCommandeSelectionnee(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                       <ArrowLeft size={14} />
                    </button>
                    <div>
                        <h2 className="text-[9px] font-black uppercase tracking-tight leading-none">{commandeActive.tableNom || 'Vente Directe'}</h2>
                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ticket #...{commandeActive.id.slice(-6)}</p>
                    </div>
                 </div>
                 <div className="text-right">
                     <p className="text-[12px] font-black tracking-tight text-indigo-600">{(commandeActive.total || 0).toLocaleString()} F</p>
                 </div>
              </header>

              <div className="flex-1 flex flex-row overflow-hidden">
                {/* Details Items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                  {tournees.map((tournee, tidx) => (
                    <div key={tidx} className="relative pl-4 pb-1 border-l-2 border-slate-100 last:border-transparent">
                      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-lg border flex items-center justify-center z-10 bg-white shadow-sm ${tournee.time ? 'border-slate-100 text-slate-300' : 'border-indigo-600 text-indigo-600'}`}>
                        {tournee.time ? <History size={10} /> : <Zap size={10} />}
                      </div>
                      
                      <div className="flex justify-between items-center mb-1.5 ml-2">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                          {tournee.time ? `Tournée ${new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Dernière Tournée'}
                        </span>
                        <span className="font-bold text-slate-400 text-[8px]">{tournee.total.toLocaleString()} F</span>
                      </div>
  
                      <div className="grid grid-cols-1 gap-1 ml-2">
                        {tournee.items.map(ligne => (
                          <div key={ligne.id} className="flex items-center justify-between p-1.5 bg-white rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-900 text-[8px]">x{ligne.quantite}</div>
                               <div>
                                  <p className="font-bold text-[9px] uppercase tracking-tight leading-none">{ligne.produitNom}</p>
                                  <p className="text-[7px] font-bold text-slate-300 mt-0.5 tracking-widest leading-none">{ligne.prixUnitaire.toLocaleString()} F</p>
                               </div>
                            </div>
                            <span className="font-black text-[9px] text-slate-900">{ligne.sousTotal.toLocaleString()} F</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Card Compact */}
                  <div className="mt-4 p-4 bg-slate-950 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-[30px] rounded-full" />
                     <div className="relative z-10">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                           <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Total Brut</span>
                           <span className="text-[12px] font-black tracking-tight opacity-50">{(commandeActive.total || 0).toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Net à Payer</p>
                              <p className="text-xl font-black tracking-tight leading-none">
                                 {totalNet.toLocaleString()} <span className="text-[10px]">F</span>
                              </p>
                           </div>
                           <Receipt size={18} className="text-white/5 mb-0.5" />
                        </div>
                     </div>
                  </div>
                </div>

                {/* Bloc Paiement */}
                <div className="w-[195px] bg-white border-l border-slate-100 flex flex-col shadow-2xl z-10">
                   <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
                      <section>
                         <h3 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Mode de règlement</h3>
                         <div className="grid grid-cols-2 gap-1">
                            {[
                                { id: 'especes', label: 'Cash', icon: <Banknote size={14} /> },
                                { id: 'mobile', label: 'Mobile', icon: <Smartphone size={14} /> },
                                { id: 'carte', label: 'Carte', icon: <CreditCard size={14} /> },
                                { id: 'credit', label: 'Dette', icon: <HistoryIcon size={14} /> },
                            ].map(m => (
                               <button
                                 key={m.id}
                                 onClick={() => {
                                   setModePaiement(m.id as any);
                                   if (m.id !== 'credit') setMontantSaisi(totalNet.toString());
                                   else setMontantSaisi('0');
                                 }}
                                 className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                                   modePaiement === m.id 
                                     ? 'bg-slate-950 border-slate-950 text-white shadow-lg' 
                                     : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                 }`}
                              >
                                 <div className={`p-1 rounded-lg ${modePaiement === m.id ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                    {m.icon}
                                 </div>
                                 <span className="text-[7px] font-black uppercase tracking-widest">{m.label}</span>
                              </button>
                            ))}
                         </div>
                      </section>

                      <AnimatePresence mode="wait">
                         {modePaiement && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                               {modePaiement !== 'credit' && (
                                  <div className="space-y-2">
                                     <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Perçu</p>
                                        <div className="flex items-center justify-center gap-2">
                                           <input 
                                              type="number" 
                                              value={montantSaisi} 
                                              onChange={e => setMontantSaisi(e.target.value)}
                                              className="w-full text-center text-xl font-black text-slate-950 bg-transparent outline-none tracking-tight"
                                              autoFocus
                                           />
                                           <span className="text-[12px] font-black text-slate-200">F</span>
                                        </div>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-2">
                                        {monnaieRendue > 0 && (
                                           <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                              <p className="text-[6px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Rendu</p>
                                              <p className="text-[11px] font-black text-emerald-800 tracking-tight">{monnaieRendue.toLocaleString()} F</p>
                                           </div>
                                        )}
                                        {resteAPayer > 0 && (
                                           <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-center">
                                              <p className="text-[6px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Reste</p>
                                              <p className="text-[11px] font-black text-amber-800 tracking-tight">{resteAPayer.toLocaleString()} F</p>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               )}

                               {modePaiement === 'mobile' && (
                                  <div className="space-y-2">
                                     <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                                        <Zap size={12} className="text-indigo-400" />
                                        <input 
                                           value={refPaiement} onChange={e => setRefPaiement(e.target.value)}
                                           placeholder="RÉFÉRENCE TRANSACTION..."
                                           className="w-full font-black text-[8px] uppercase outline-none bg-transparent placeholder:text-indigo-200 text-indigo-900"
                                        />
                                     </div>
                                  </div>
                               )}

                               {(modePaiement === 'credit' || resteAPayer > 0) && (
                                  <div className="space-y-2">
                                     <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-3">
                                        <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                                           <User size={14} className="text-slate-300" />
                                           <input 
                                              value={nomClient} onChange={e => setNomClient(e.target.value)}
                                              placeholder="NOM DU DÉBITEUR..."
                                              className="w-full font-black text-[9px] uppercase outline-none placeholder:text-slate-200"
                                           />
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <Phone size={14} className="text-slate-300" />
                                           <input 
                                              value={contactClient} onChange={e => setContactClient(e.target.value)}
                                              placeholder="TÉLÉPHONE..."
                                              className="w-full font-black text-[9px] uppercase outline-none placeholder:text-slate-200"
                                           />
                                        </div>
                                     </div>
                                  </div>
                                )}
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   <div className="p-3 bg-white border-t border-slate-50">
                      <button
                         onClick={finaliserPaiement}
                         disabled={!modePaiement}
                         className="h-12 w-full rounded-xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] shadow-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 group"
                      >
                        {modePaiement ? 'Finaliser Transaction' : 'Choisir Mode'} 
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>
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
