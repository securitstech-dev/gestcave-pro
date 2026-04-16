import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator, ArrowLeft, ChevronLeft,
  History, Zap
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
  const [montantDonne, setMontantDonne] = useState('');
  const [nomClientCredit, setNomClientCredit] = useState('');
  const [remise, setRemise] = useState(0);

  const commandesActives = commandes.filter(c => c.statut !== 'payee');
  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalFinal = Math.max(0, (commandeActive?.total || 0) - remise);
  const monnaieRendue = modePaiement === 'especes' && montantDonne 
    ? parseInt(montantDonne) - totalFinal
    : null;

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
      return new Date(a.time).getTime() - new Date(b.time).getTime(); // Ordre chronologique en caisse
    });
  }, [commandeActive]);

  const finaliserPaiement = () => {
    if (!commandeSelectionnee || !modePaiement) return;
    
    if (modePaiement === 'especes' && (!montantDonne || parseInt(montantDonne) < totalFinal)) {
      toast.error('Montant perçu insuffisant !');
      return;
    }
    if (modePaiement === 'credit' && !nomClientCredit) {
      toast.error('Identité du client requise pour le crédit');
      return;
    }

    const toastId = toast.loading("Finalisation de l'encaissement...");
    try {
      const methode = modePaiement === 'credit' ? 'credit' : 'comptant';
      encaisserCommande(commandeSelectionnee, methode, modePaiement === 'credit' ? nomClientCredit : undefined, remise);
      toast.success(`Transaction enregistrée avec succès !`, { id: toastId, icon: '✅' });
      
      setCommandeSelectionnee(null);
      setModePaiement(null);
      setMontantDonne('');
      setNomClientCredit('');
      setRemise(0);
    } catch {
      toast.error("Échec de l'encaissement", { id: toastId });
    }
  };

  const demarrerVenteEmporter = async () => {
    const id = await ouvrirVenteEmporter(etablissementId || 'caissier', nomEmploye);
    setCommandeSelectionnee(id);
    toast.success('Vente directe ouverte', { icon: '🛍️' });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Liste des Tickets */}
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] bg-slate-50 border-r border-slate-200 flex-col`}>
        <header className="p-8 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                    <Wallet size={24} />
                </div>
                <div>
                    <h1 className="text-lg font-display font-black text-slate-900 tracking-tight leading-none uppercase">CAISSE CENTRALE</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{nomEmploye}</p>
                </div>
            </div>

            <button 
              onClick={demarrerVenteEmporter}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag size={18} /> Vente Directe
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets Ouverts</h2>
                <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-black">{commandesActives.length}</span>
            </div>

            {commandesActives.map(commande => {
                const estSelectionnee = commandeSelectionnee === commande.id;
                return (
                  <button
                    key={commande.id}
                    onClick={() => {
                        setCommandeSelectionnee(commande.id);
                        setModePaiement(null);
                        setMontantDonne('');
                        setNomClientCredit('');
                        setRemise(0);
                    }}
                    className={`w-full p-6 rounded-2xl text-left transition-all border-2 relative group flex justify-between items-center ${
                      estSelectionnee 
                        ? 'border-slate-900 bg-white shadow-xl shadow-slate-900/5' 
                        : 'border-transparent bg-white hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                             estSelectionnee ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                        }`}>
                            {commande.type === 'a_emporter' ? <ShoppingBag size={18} /> : <Receipt size={18} />}
                        </div>
                        <div>
                            <span className="font-black text-slate-900 text-base block leading-none uppercase">{commande.tableNom || 'DIRECTE'}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Serveur: {commande.serveurNom}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-display font-black text-slate-900 tracking-tighter">{commande.total.toLocaleString()} F</div>
                    </div>
                  </button>
                );
            })}
        </div>
      </aside>

      {/* Zone de Règlement */}
      <main className={`${!commandeSelectionnee ? 'hidden md:flex' : 'flex'} flex-1 bg-white flex-col overflow-hidden`}>
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                  <Calculator size={40} className="text-slate-200" />
              </div>
              <h2 className="text-xl font-display font-black text-slate-300 uppercase tracking-[0.2em]">Sélectionnez une commande à encaisser</h2>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full">
                {/* Facture Détaillée avec Groupement par Tournées */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar border-r border-slate-100">
                    <button onClick={() => setCommandeSelectionnee(null)} className="md:hidden flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 border border-slate-200 rounded-lg px-4 py-2">
                        <ChevronLeft size={16} /> Liste
                    </button>

                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Résumé de la consommation</p>
                            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">{commandeActive.tableNom || 'VENTE DIRECTE'}</h2>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session ID</p>
                             <p className="font-black text-slate-900 text-sm">#{commandeActive.id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        {tournees.map((tournee, idx) => (
                            <div key={idx} className="relative pl-10">
                                <div className="absolute left-[18px] top-2 bottom-0 w-px bg-slate-100" />
                                <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center z-10 bg-white ${tournee.time ? 'border-slate-100 text-slate-400' : 'border-slate-900 text-slate-900'}`}>
                                    {tournee.time ? <History size={16} /> : <Zap size={16} />}
                                </div>
                                <div className="flex justify-between items-baseline mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        {tournee.time ? `TOURNÉE #${idx + (tournees[0].time?1:0)} • ${new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'EN ATTENTE DE VALIDATION'}
                                    </h4>
                                    <span className="font-display font-black text-slate-400 text-sm">{tournee.total.toLocaleString()} F</span>
                                </div>
                                <div className="space-y-4">
                                    {tournee.items.map(ligne => (
                                        <div key={ligne.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 text-[10px]">x{ligne.quantite}</span>
                                                <span className="font-bold text-slate-600 text-sm uppercase tracking-tight">{ligne.produitNom}</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-sm">{ligne.sousTotal.toLocaleString()} F</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 p-10 bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HORS TAXES / BRUT</span>
                            <span className="font-display font-bold text-slate-400 text-xl">{commandeActive.total.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-display font-black uppercase tracking-tight">TOTAL À PAYER</span>
                            <span className="text-5xl font-display font-black text-emerald-400 tracking-tighter">{totalFinal.toLocaleString()} <span className="text-sm">F</span></span>
                        </div>
                    </div>
                </div>

                {/* Sélecteur de Paiement */}
                <aside className="w-full lg:w-[480px] p-8 md:p-12 bg-slate-50 flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">MODE DE RÈGLEMENT</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            {[
                                { id: 'especes', label: 'ESPÈCES', icon: <Banknote size={24} /> },
                                { id: 'mobile', label: 'M-MONEY', icon: <Smartphone size={24} /> },
                                { id: 'carte', label: 'CARTE BANC.', icon: <CreditCard size={24} /> },
                                { id: 'credit', label: 'AU CRÉDIT', icon: <HistoryIcon size={24} /> },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setModePaiement(m.id as any)}
                                    className={`p-8 rounded-3xl flex flex-col items-center gap-4 transition-all border-2 ${
                                        modePaiement === m.id 
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                                        : 'bg-white border-transparent text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    {m.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {modePaiement === 'especes' && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Montant Reçu (Client)</p>
                                        <div className="flex items-baseline gap-4">
                                            <input 
                                                type="number" 
                                                value={montantDonne} 
                                                onChange={e => setMontantDonne(e.target.value)}
                                                placeholder="Saisir montant..."
                                                className="w-full text-5xl font-display font-black text-slate-900 outline-none bg-transparent"
                                                autoFocus
                                            />
                                            <span className="text-xl font-black text-slate-300">F</span>
                                        </div>
                                    </div>
                                    {monnaieRendue !== null && monnaieRendue > 0 && (
                                        <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">MONNAIE À RENDRE</p>
                                            <p className="text-3xl font-display font-black text-emerald-700">{monnaieRendue.toLocaleString()} F</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {modePaiement === 'credit' && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Identité du Client (Débit)</p>
                                        <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-2">
                                            <User size={24} className="text-slate-300" />
                                            <input 
                                                type="text" 
                                                value={nomClientCredit} 
                                                onChange={e => setNomClientCredit(e.target.value)}
                                                placeholder="Nom du client ou Matricule..."
                                                className="w-full text-xl font-bold text-slate-900 outline-none bg-transparent"
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold mt-4 italic">Cette commande sera marquée comme "À Payer" dans les rapports financiers.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={finaliserPaiement}
                        disabled={!modePaiement}
                        className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-slate-900/40 disabled:opacity-20 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                        {modePaiement ? 'Valider la Transaction' : 'Choisir Règlement'} <ArrowRight size={20} />
                    </button>
                </aside>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default InterfaceCaissier;
