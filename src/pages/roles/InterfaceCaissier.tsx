import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';

const InterfaceCaissier = () => {
  const { tables, commandes, encaisserCommande, ouvrirVenteEmporter } = usePOSStore();
  const { nomEmploye, etablissementId } = usePosteSession();
  const navigate = useNavigate();
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile' | 'carte' | 'credit' | null>(null);
  const [montantDonne, setMontantDonne] = useState('');
  const [nomClientCredit, setNomClientCredit] = useState('');
  const [remise, setRemise] = useState(0);
  const [nbParts, setNbParts] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);

  // Commandes actives pour la caisse
  const commandesActives = commandes.filter(c => c.statut !== 'payee');
  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalFinal = Math.max(0, (commandeActive?.total || 0) - remise);
  const partParPersonne = nbParts > 1 ? Math.ceil(totalFinal / nbParts) : null;

  const monnaieRendue = modePaiement === 'especes' && montantDonne 
    ? parseInt(montantDonne) - totalFinal
    : null;

  const finaliserPaiement = () => {
    if (!commandeSelectionnee || !modePaiement) return;
    
    if (modePaiement === 'especes' && (!montantDonne || parseInt(montantDonne) < (commandeActive?.total || 0))) {
      toast.error('Montant perçu insuffisant !');
      return;
    }
    if (modePaiement === 'credit' && !nomClientCredit) {
      toast.error('Identité du client requise pour le crédit');
      return;
    }

    const toastId = toast.loading("Sécurisation de la transaction...");

    try {
      const methode = modePaiement === 'credit' ? 'credit' : 'comptant';
      encaisserCommande(commandeSelectionnee, methode, modePaiement === 'credit' ? nomClientCredit : undefined, remise);
      
      toast.success(`Transaction terminée ! 💸`, { id: toastId, icon: '🏦' });
      
      // Reset
      setCommandeSelectionnee(null);
      setModePaiement(null);
      setMontantDonne('');
      setNomClientCredit('');
      setRemise(0);
      setNbParts(1);
    } catch {
      toast.error("Échec de l'encaissement", { id: toastId });
    }
  };

  const demarrerVenteEmporter = async () => {
    const id = await ouvrirVenteEmporter(etablissementId || 'caissier', 'Caisse Centrale');
    setCommandeSelectionnee(id);
    toast.success('Vente directe ouverte', { icon: '🛍️' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-white overflow-hidden">
      {/* Sidebar de Caisse (Touch List) */}
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] bg-slate-900 border-r border-white/5 flex-col shadow-2xl relative z-20 h-screen md:h-auto overflow-hidden`}>
        <header className="p-6 md:p-8 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Wallet size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-display font-black tracking-tight uppercase leading-none">SYSTÈME <span className="text-emerald-500">CAISSE</span></h1>
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{nomEmploye}</p>
                    </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
            </div>

            <button 
              onClick={demarrerVenteEmporter}
              className="w-full py-4 md:py-5 rounded-2xl md:rounded-[1.8rem] bg-white text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 md:gap-3"
            >
              <ShoppingBag size={16} /> VENTE DIRECTE
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 custom-scrollbar">
            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                <span>Tickets en attente</span>
                <span className="bg-white/5 px-2 py-0.5 rounded text-indigo-400">{commandesActives.length}</span>
            </h2>

            {commandesActives.map(commande => {
                const table = tables.find(t => t.id === commande.tableId);
                const estSelectionnee = commandeSelectionnee === commande.id;
                const pretPourEncaissement = table?.statut === 'en_attente_paiement';

                return (
                  <motion.button
                    key={commande.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setCommandeSelectionnee(commande.id);
                        setModePaiement(null);
                        setMontantDonne('');
                        setNomClientCredit('');
                    }}
                    className={`w-full p-4 md:p-6 bg-slate-800/40 rounded-2xl md:rounded-[2rem] text-left transition-all border-2 relative overflow-hidden group ${
                      estSelectionnee 
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-indigo-500/10' 
                        : 'border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${
                                pretPourEncaissement ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                            }`}>
                                {commande.type === 'a_emporter' ? <ShoppingBag size={14} /> : (pretPourEncaissement ? <CheckCircle2 size={14} /> : <Clock size={14} />)}
                            </div>
                            <div>
                                <span className="font-bold text-white text-base md:text-lg block leading-none">{table ? table.nom : 'Vente Directe'}</span>
                                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-tight">#{commande.id.slice(-4)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{commande.nombreCouverts} Convives</span>
                        <div className="text-right">
                             <div className="text-xl md:text-2xl font-display font-black text-white">{commande.total.toLocaleString()} F</div>
                        </div>
                    </div>
                  </motion.button>
                );
            })}
        </div>
      </aside>

      {/* Workspace d'Encaissement */}
      <main className={`${!commandeSelectionnee ? 'hidden md:flex' : 'flex'} flex-1 bg-slate-950 p-4 md:p-8 flex-col h-screen md:h-auto overflow-y-auto no-scrollbar`}>
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-10"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/5 flex items-center justify-center mb-6 md:mb-10 opacity-20">
                  <Calculator size={48} md:size={64} />
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-black text-slate-800">POSTE EN ATTENTE</h2>
              <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[9px] md:text-[11px] mt-4">Sélectionnez un ticket pour finaliser la vente</p>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-10 pb-20 md:pb-0">
                {/* Back button for mobile */}
                <button 
                    onClick={() => setCommandeSelectionnee(null)}
                    className="md:hidden flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2"
                >
                    <ArrowRight size={14} className="rotate-180" /> Retour à la liste
                </button>

                {/* Visualisation Facture */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full lg:w-[450px] bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-slate-950 shadow-2xl relative flex flex-col min-h-[400px]"
                >
                    <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div>
                            <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Résumé du ticket</p>
                            <h2 className="text-2xl md:text-4xl font-display font-black">{commandeActive.tableNom}</h2>
                        </div>
                        <div className="bg-slate-100 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                             <Receipt size={20} md:size={24} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 px-2 custom-scrollbar-light max-h-[200px] md:max-h-none">
                        {commandeActive.lignes.map(ligne => (
                            <div key={ligne.id} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] md:text-sm text-slate-500">
                                        {ligne.quantite}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[11px] md:text-sm uppercase tracking-tight">{ligne.produitNom}</p>
                                    </div>
                                </div>
                                <span className="font-display font-black text-base md:text-lg">{ligne.sousTotal.toLocaleString()} F</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-100">
                        <div className="flex justify-between items-end mb-2">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Net</span>
                        </div>
                        <div className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tighter">
                            {totalFinal.toLocaleString()} <span className="text-xl text-slate-400">F</span>
                        </div>
                    </div>
                </motion.div>

                {/* Module de Paiement */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 flex flex-col gap-6 md:gap-8 h-full"
                >
                    {/* Selecteur de Mode */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Choisir le règlement</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {[
                                { val: 'especes', label: 'ESPÈCES', icon: <Banknote size={24} /> },
                                { val: 'mobile', label: 'MOBILE', icon: <Smartphone size={24} /> },
                                { val: 'carte', label: 'CARTE', icon: <CreditCard size={24} /> },
                                { val: 'credit', label: 'CRÉDIT', icon: <HistoryIcon size={24} /> },
                            ].map(opts => (
                                <button
                                    key={opts.val}
                                    onClick={() => {
                                        setModePaiement(opts.val as any);
                                        setMontantDonne('');
                                        setNomClientCredit('');
                                    }}
                                    className={`p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-4 md:gap-6 border-2 transition-all group ${
                                        modePaiement === opts.val 
                                        ? 'bg-emerald-600 border-white/20 text-white shadow-xl shadow-emerald-500/20' 
                                        : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'
                                    }`}
                                >
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
                                        modePaiement === opts.val ? 'bg-white/20' : 'bg-slate-800'
                                    }`}>
                                        {opts.icon}
                                    </div>
                                    <span className="font-black text-[9px] md:text-xs tracking-widest text-left">{opts.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center w-full">
                        <AnimatePresence mode="wait">
                            {modePaiement === 'especes' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 rounded-3xl p-6 md:p-10 border border-white/5"
                                >
                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Reçu du client</label>
                                    <input
                                        type="number"
                                        value={montantDonne}
                                        onChange={e => setMontantDonne(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-transparent text-5xl md:text-7xl font-display font-black text-white outline-none"
                                        autoFocus
                                    />
                                    {monnaieRendue !== null && monnaieRendue >= 0 && (
                                        <div className="mt-8 p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendre au client</p>
                                            <p className="text-3xl font-display font-black text-emerald-400">{monnaieRendue.toLocaleString()} F</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={finaliserPaiement}
                            disabled={!modePaiement}
                            className="w-full py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] bg-indigo-600 hover:bg-emerald-600 disabled:opacity-30 text-white shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:gap-4"
                        >
                            {modePaiement ? 'VALIDER PAIEMENT' : 'CHOISIR MODE'} <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InterfaceCaissier;
