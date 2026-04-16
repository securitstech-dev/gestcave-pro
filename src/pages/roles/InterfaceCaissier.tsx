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
    <div className="min-h-screen bg-slate-950 flex text-white overflow-hidden">
      {/* Sidebar de Caisse (Touch List) */}
      <aside className="w-[380px] bg-slate-900 border-r border-white/5 flex flex-col shadow-2xl relative z-20">
        <header className="p-8 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Wallet size={24} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-black tracking-tight uppercase">SYSTÈME <span className="text-emerald-500">CAISSE</span></h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{nomEmploye}</p>
                    </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 transition-colors"
                >
                  <LogOut size={20} />
                </button>
            </div>

            <button 
              onClick={demarrerVenteEmporter}
              className="w-full py-5 rounded-[1.8rem] bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag size={18} /> VENTE DIRECTE
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
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
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        setCommandeSelectionnee(commande.id);
                        setModePaiement(null);
                        setMontantDonne('');
                        setNomClientCredit('');
                    }}
                    className={`w-full p-6 bg-slate-800/40 rounded-[2rem] text-left transition-all border-2 relative overflow-hidden group ${
                      estSelectionnee 
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-indigo-500/10 shadow-lg' 
                        : 'border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                pretPourEncaissement ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                            }`}>
                                {commande.type === 'a_emporter' ? <ShoppingBag size={18} /> : (pretPourEncaissement ? <CheckCircle2 size={18} /> : <Clock size={18} />)}
                            </div>
                            <div>
                                <span className="font-bold text-white text-lg block leading-none">{table ? table.nom : 'Vente Directe'}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">#{commande.id.slice(-4)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{commande.nombreCouverts} Convives</span>
                        <div className="text-right">
                             <div className="text-2xl font-display font-black text-white">{commande.total.toLocaleString()} F</div>
                             {pretPourEncaissement && (
                                 <span className="text-[9px] font-black text-emerald-500 animate-pulse tracking-widest block mt-1">✓ PRÊT À PAYER</span>
                             )}
                        </div>
                    </div>
                  </motion.button>
                );
            })}

            {commandesActives.length === 0 && (
                <div className="py-20 text-center text-slate-600">
                    <HistoryIcon size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun ticket actif</p>
                </div>
            )}
        </div>
      </aside>

      {/* Workspace d'Encaissement */}
      <main className="flex-1 bg-slate-950 p-8 flex flex-col relative">
        <AnimatePresence mode="wait">
          {!commandeActive ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center mb-10 opacity-20">
                  <Calculator size={64} />
              </div>
              <h2 className="text-4xl font-display font-black text-slate-800">POSTE EN ATTENTE</h2>
              <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[11px] mt-4">Sélectionnez un ticket à gauche pour finaliser la vente</p>
            </motion.div>
          ) : (
            <div className="flex-1 flex gap-10">
                {/* Visualisation Facture */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[450px] bg-white rounded-[2.5rem] p-10 text-slate-950 shadow-2xl relative flex flex-col"
                >
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Résumé du ticket</p>
                            <h2 className="text-4xl font-display font-black">{commandeActive.tableNom}</h2>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-3xl">
                             <Receipt size={24} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 px-2 custom-scrollbar-light">
                        {commandeActive.lignes.map(ligne => (
                            <div key={ligne.id} className="flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-sm text-slate-500">
                                        {ligne.quantite}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm uppercase tracking-tight">{ligne.produitNom}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{ligne.prixUnitaire.toLocaleString()} F / u</p>
                                    </div>
                                </div>
                                <span className="font-display font-black text-lg">{ligne.sousTotal.toLocaleString()} F</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 border-t-2 border-dashed border-slate-100">
                        {remise > 0 && (
                            <div className="flex justify-between items-center mb-4 text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                                <span className="text-[10px] uppercase tracking-widest">Remise Commerciale</span>
                                <span className="text-sm">-{remise.toLocaleString()} F</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end mb-4 px-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net à Payer</span>
                             <span className="text-[10px] font-black text-slate-900 uppercase">TVA 0%</span>
                        </div>
                        <div className="text-6xl font-display font-black text-slate-900 tracking-tighter px-2">
                            {totalFinal.toLocaleString()} <span className="text-xl text-slate-400">F</span>
                        </div>
                    </div>
                </motion.div>

                {/* Module de Paiement Premium */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 flex flex-col gap-8 h-full"
                >
                    {/* Selecteur de Mode */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] px-1">Choisir le règlement</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { val: 'especes', label: 'ESPÈCES', icon: <Banknote size={24} /> },
                                { val: 'mobile', label: 'MOBILE MONEY', icon: <Smartphone size={24} /> },
                                { val: 'carte', label: 'CARTE BANCAIRE', icon: <CreditCard size={24} /> },
                                { val: 'credit', label: 'COMPTE CLIENT', icon: <HistoryIcon size={24} /> },
                            ].map(opts => (
                                <button
                                    key={opts.val}
                                    onClick={() => {
                                        setModePaiement(opts.val as any);
                                        setMontantDonne('');
                                        setNomClientCredit('');
                                    }}
                                    className={`p-6 rounded-[2rem] flex items-center gap-6 border-2 transition-all group ${
                                        modePaiement === opts.val 
                                        ? 'bg-emerald-600 border-white/20 text-white shadow-xl shadow-emerald-500/20' 
                                        : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10 hover:text-white'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                        modePaiement === opts.val ? 'bg-white/20' : 'bg-slate-800'
                                    }`}>
                                        {opts.icon}
                                    </div>
                                    <span className="flex-1 font-black text-xs tracking-widest text-left">{opts.label}</span>
                                    {modePaiement === opts.val && <CheckCircle2 size={24} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options Supplémentaires : Split & Remise */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-900/50 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Division</p>
                                    <p className="text-sm font-black text-white">{nbParts} parts</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setNbParts(Math.max(1, nbParts - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">-</button>
                                <button onClick={() => setNbParts(nbParts + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">+</button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-900/50 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <TrendingUp size={18} />
                                </div>
                                <div className="flex-1 min-w-[80px]">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Remise</p>
                                    <input 
                                        type="number"
                                        value={remise || ''}
                                        onChange={(e) => setRemise(Number(e.target.value))}
                                        placeholder="0"
                                        className="bg-transparent border-none outline-none text-white font-black text-sm w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                        <AnimatePresence mode="wait">
                            {modePaiement === 'especes' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 relative shadow-inner">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Montant reçu du client</label>
                                        <div className="flex items-end gap-4">
                                            <input
                                                type="number"
                                                value={montantDonne}
                                                onChange={e => setMontantDonne(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-transparent text-7xl font-display font-black text-white outline-none placeholder-slate-800"
                                                autoFocus
                                            />
                                            <span className="text-2xl font-black text-slate-700 mb-2">F</span>
                                        </div>
                                    </div>

                                    {monnaieRendue !== null && (
                                        <motion.div 
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`p-10 rounded-[2.5rem] text-center border-2 transition-all ${
                                                monnaieRendue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5 shadow-2xl' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5 border-dashed'
                                            }`}
                                        >
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total à rendre</p>
                                            <p className={`text-6xl font-display font-black leading-none ${monnaieRendue >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                {monnaieRendue >= 0 ? monnaieRendue.toLocaleString() : 'INSUPPORTABLE'} 
                                                {monnaieRendue >= 0 && <span className="text-xl ml-2">F</span>}
                                            </p>
                                            {nbParts > 1 && monnaieRendue >= 0 && (
                                                <div className="mt-4 pt-4 border-t border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                                    Soit {partParPersonne?.toLocaleString()} F par personne
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-3 gap-3">
                                        {[2000, 5000, 10000, 20000].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setMontantDonne(String(val))}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 py-5 rounded-2xl text-[11px] font-black tracking-widest text-slate-400 transition-all uppercase"
                                            >
                                                Billet {val.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {modePaiement === 'credit' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                                            <User className="text-indigo-400" />
                                        </div>
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Identité du Client Débiteur</label>
                                        <input 
                                            type="text" 
                                            value={nomClientCredit}
                                            onChange={(e)=>setNomClientCredit(e.target.value)}
                                            placeholder="Ex: Agent Municipal Jean"
                                            className="w-full bg-transparent text-3xl font-black text-white outline-none border-b border-indigo-500/30 pb-4 placeholder-slate-800"
                                            autoFocus
                                        />
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                            ℹ Cette opération clôture le ticket et l'ajoute au grand livre des dettes clients.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {modePaiement && ['mobile', 'carte'].includes(modePaiement) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-slate-900 rounded-[2.5rem] p-12 border border-white/5 text-center shadow-inner"
                                >
                                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mx-auto mb-8 border border-white/5">
                                        {modePaiement === 'mobile' ? <Smartphone size={40} className="text-indigo-400" /> : <CreditCard size={40} className="text-indigo-400" />}
                                    </div>
                                    <h4 className="text-3xl font-display font-black text-white mb-2">Terminal Prêt</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">Veuillez valider la transaction sur l'appareil externe</p>
                                    <div className="py-2 px-6 bg-white/5 rounded-full text-indigo-400 font-mono text-xl font-black inline-block border border-white/5">
                                        {commandeActive.total.toLocaleString()} F
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={finaliserPaiement}
                            disabled={!modePaiement}
                            className="w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] bg-indigo-600 hover:bg-emerald-600 disabled:opacity-30 disabled:grayscale text-white shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                        >
                            {modePaiement ? 'CONFIRMER L\'ENCAISSEMENT' : 'ATTENTE MODE PAIEMENT'} <ArrowRight size={20} />
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
