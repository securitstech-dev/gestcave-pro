import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator, ArrowLeft, ChevronLeft
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

  const commandesActives = commandes.filter(c => c.statut !== 'payee');
  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalFinal = Math.max(0, (commandeActive?.total || 0) - remise);
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
      toast.success(`Transaction terminée !`, { id: toastId, icon: '🏦' });
      
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
    const id = await ouvrirVenteEmporter(etablissementId || 'caissier', 'Caisse Centrale');
    setCommandeSelectionnee(id);
    toast.success('Vente directe ouverte', { icon: '🛍️' });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-slate-200">
      {/* Liste des Tickets */}
      <aside className={`${commandeSelectionnee ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] bg-slate-50 border-r border-slate-200 flex-col`}>
        <header className="p-8 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                    <Wallet size={24} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">POSTE CAISSE</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{nomEmploye}</p>
                </div>
            </div>

            <button 
              onClick={demarrerVenteEmporter}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag size={18} /> Vente Rapide (Emporter)
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar-admin">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En attente de paiement</h2>
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
                    }}
                    className={`w-full p-6 rounded-2xl text-left transition-all border-2 relative group flex justify-between items-center ${
                      estSelectionnee 
                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-500/10' 
                        : 'border-white bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                             estSelectionnee ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {commande.type === 'a_emporter' ? <ShoppingBag size={18} /> : <Receipt size={18} />}
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 text-base block leading-none">{commande.tableNom || 'Directe'}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Poste: {commande.serveurNom}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 tracking-tighter">{commande.total.toLocaleString()} F</div>
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
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-8">
                  <Calculator size={40} className="text-slate-200" />
              </div>
              <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">Sélectionnez un ticket</h2>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full">
                {/* Facture Détaillée */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar-admin border-r border-slate-100">
                    <button onClick={() => setCommandeSelectionnee(null)} className="md:hidden flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">
                        <ChevronLeft size={16} /> Retour à la liste
                    </button>

                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Encaissement en cours</p>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{commandeActive.tableNom || 'Commande Directe'}</h2>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Ticket N°</p>
                             <p className="font-bold text-slate-900">#{commandeActive.id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {commandeActive.lignes.map(ligne => (
                            <div key={ligne.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">x{ligne.quantite}</span>
                                    <span className="font-bold text-slate-900 text-sm uppercase">{ligne.produitNom}</span>
                                </div>
                                <span className="font-bold text-slate-900">{ligne.sousTotal.toLocaleString()} F</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sous-total</span>
                            <span className="font-bold text-slate-600">{commandeActive.total.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-900">
                            <span className="text-lg font-bold uppercase tracking-tight">Total Net</span>
                            <span className="text-4xl font-bold tracking-tighter">{totalFinal.toLocaleString()} <span className="text-sm">F</span></span>
                        </div>
                    </div>
                </div>

                {/* Sélecteur de Paiement */}
                <aside className="w-full lg:w-[480px] p-8 md:p-12 bg-slate-50 flex flex-col">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Mode de paiement</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                            { id: 'especes', label: 'ESPÈCES', icon: <Banknote size={24} /> },
                            { id: 'mobile', label: 'MOBILE', icon: <Smartphone size={24} /> },
                            { id: 'carte', label: 'CARTE', icon: <CreditCard size={24} /> },
                            { id: 'credit', label: 'CRÉDIT', icon: <HistoryIcon size={24} /> },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setModePaiement(m.id as any)}
                                className={`p-6 rounded-2xl flex flex-col items-center gap-4 transition-all border-2 ${
                                    modePaiement === m.id 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                    : 'bg-white border-transparent text-slate-400 hover:border-slate-200 shadow-sm'
                                }`}
                            >
                                {m.icon}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {modePaiement === 'especes' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Montant Reçu</p>
                                        <input 
                                            type="number" 
                                            value={montantDonne} 
                                            onChange={e => setMontantDonne(e.target.value)}
                                            placeholder="0"
                                            className="w-full text-5xl font-bold text-slate-900 outline-none bg-transparent"
                                            autoFocus
                                        />
                                    </div>
                                    {monnaieRendue !== null && monnaieRendue >= 0 && (
                                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Monnaie à rendre</p>
                                            <p className="text-3xl font-bold text-emerald-700">{monnaieRendue.toLocaleString()} F</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {modePaiement === 'credit' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Identité Client</p>
                                        <input 
                                            type="text" 
                                            value={nomClientCredit} 
                                            onChange={e => setNomClientCredit(e.target.value)}
                                            placeholder="Nom ou matricule..."
                                            className="w-full text-xl font-bold text-slate-900 outline-none bg-transparent"
                                            autoFocus
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={finaliserPaiement}
                        disabled={!modePaiement}
                        className="w-full py-6 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.3em] shadow-2xl disabled:opacity-20 hover:bg-emerald-600 transition-all active:scale-[0.98] mt-8 flex items-center justify-center gap-3"
                    >
                        {modePaiement ? 'Finaliser encaissement' : 'Choisir mode'} <ArrowRight size={20} />
                    </button>
                </aside>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InterfaceCaissier;
