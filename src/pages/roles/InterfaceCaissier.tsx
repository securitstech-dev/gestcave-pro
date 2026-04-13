import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';

// ============================================================
// INTERFACE CAISSIER — Encaissement & Gestion des paiements
// ============================================================
const InterfaceCaissier = () => {
  const { tables, commandes, encaisserCommande } = usePOSStore();
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile' | 'carte' | null>(null);
  const [montantDonne, setMontantDonne] = useState('');

  // Tables qui attendent l'encaissement
  const tablesAEncaisser = tables.filter(t => t.statut === 'en_attente_paiement' || t.statut === 'occupee');
  
  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  const monnaieRendue = modePaiement === 'especes' && montantDonne 
    ? parseInt(montantDonne) - (commandeActive?.total || 0) 
    : null;

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  const finaliserPaiement = () => {
    if (!commandeSelectionnee || !modePaiement) return;
    if (modePaiement === 'especes' && (!montantDonne || parseInt(montantDonne) < (commandeActive?.total || 0))) {
      toast.error('Montant insuffisant !');
      return;
    }
    encaisserCommande(commandeSelectionnee, modePaiement);
    toast.success(`Paiement encaissé ! Table libérée 🎉`, { icon: '💰', duration: 4000 });
    setCommandeSelectionnee(null);
    setModePaiement(null);
    setMontantDonne('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Panneau gauche : liste des tables */}
      <div className="w-80 bg-slate-900 border-r border-white/5 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="bg-green-600 p-2.5 rounded-xl">
            <Receipt size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Caisse</h1>
            <p className="text-xs text-slate-400">Alice K. • Service</p>
          </div>
        </div>

        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Tables actives</h2>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {tablesAEncaisser.map(table => {
            const commande = commandes.find(c => c.id === table.commandeActiveId);
            if (!commande) return null;
            const mins = minutesEcoulees(commande.dateOuverture);
            const estSelectionnee = commandeSelectionnee === commande.id;

            return (
              <motion.button
                key={table.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCommandeSelectionnee(commande.id);
                  setModePaiement(null);
                  setMontantDonne('');
                }}
                className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                  estSelectionnee 
                    ? 'bg-primary/20 border-primary/50 shadow-glow-sm' 
                    : 'bg-slate-800 border-transparent hover:bg-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg">{table.nom}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
                    table.statut === 'en_attente_paiement' 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {table.statut === 'en_attente_paiement' ? 'Prêt' : 'En cours'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users size={12} /> {commande.nombreCouverts} pers.
                  </span>
                  <span className="font-bold text-accent">{commande.total.toLocaleString()} F</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock size={10} /> Ouvert depuis {mins} min • {commande.serveurNom}
                </div>
              </motion.button>
            );
          })}

          {tablesAEncaisser.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune table à encaisser</p>
            </div>
          )}
        </div>
      </div>

      {/* Panneau droit : ticket + encaissement */}
      <div className="flex-1 p-6 flex flex-col">
        {!commandeActive ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <Receipt size={80} className="mb-6 opacity-20" />
            <p className="text-2xl font-bold">Sélectionnez une table</p>
            <p className="text-slate-500 mt-2">pour voir le ticket et encaisser</p>
          </div>
        ) : (
          <div className="flex gap-6 flex-1">
            {/* Ticket détaillé */}
            <div className="flex-1 glass-card overflow-hidden flex flex-col max-w-md">
              <div className="p-5 border-b border-white/5 bg-slate-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-display font-bold">{commandeActive.tableNom}</h2>
                    <p className="text-slate-400 text-sm">{commandeActive.serveurNom} • {commandeActive.nombreCouverts} couvert(s)</p>
                  </div>
                  <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg">
                    #{commandeActive.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {commandeActive.lignes.map(ligne => (
                  <div key={ligne.id} className="flex justify-between items-center py-2 border-b border-white/5">
                    <div>
                      <p className="font-medium">{ligne.produitNom}</p>
                      <p className="text-xs text-slate-400">{ligne.prixUnitaire.toLocaleString()} F × {ligne.quantite}</p>
                    </div>
                    <span className="font-bold text-white">{ligne.sousTotal.toLocaleString()} F</span>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-slate-800/50 border-t border-white/5">
                <div className="flex justify-between text-4xl font-display font-bold">
                  <span className="text-slate-400 text-base self-end mb-2">TOTAL</span>
                  <span className="text-accent">{commandeActive.total.toLocaleString()} F</span>
                </div>
              </div>
            </div>

            {/* Module encaissement */}
            <div className="flex-1 flex flex-col gap-4 max-w-sm">
              <h3 className="text-lg font-bold text-slate-300">Mode de paiement</h3>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: 'especes', label: 'Espèces', icon: <Banknote size={24} /> },
                  { val: 'mobile', label: 'Mobile Money', icon: <Smartphone size={24} /> },
                  { val: 'carte', label: 'Carte', icon: <CreditCard size={24} /> },
                ].map(opts => (
                  <button
                    key={opts.val}
                    onClick={() => {
                      setModePaiement(opts.val as any);
                      setMontantDonne('');
                    }}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                      modePaiement === opts.val 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {opts.icon}
                    <span className="text-xs font-bold text-center leading-tight">{opts.label}</span>
                  </button>
                ))}
              </div>

              {/* Calcul monnaie pour espèces */}
              {modePaiement === 'especes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Montant reçu du client</h3>
                  <div className="glass-card p-4 mb-3">
                    <input
                      type="number"
                      value={montantDonne}
                      onChange={e => setMontantDonne(e.target.value)}
                      placeholder={`Min. ${commandeActive.total.toLocaleString()} F`}
                      className="w-full bg-transparent text-4xl font-display font-bold text-white outline-none placeholder-slate-600"
                    />
                    <p className="text-xs text-slate-500 mt-1">Francs CFA</p>
                  </div>
                  
                  {monnaieRendue !== null && (
                    <div className={`p-4 rounded-2xl text-center ${
                      monnaieRendue >= 0 ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-red-500/20 border-2 border-red-500/30'
                    }`}>
                      <p className="text-sm text-slate-400 mb-1">Monnaie à rendre</p>
                      <p className={`text-4xl font-display font-bold ${monnaieRendue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {monnaieRendue >= 0 ? monnaieRendue.toLocaleString() : '⚠ Insuffisant'} {monnaieRendue >= 0 ? 'F' : ''}
                      </p>
                    </div>
                  )}

                  {/* Touches rapides */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[5000, 10000, 20000].map(val => (
                      <button
                        key={val}
                        onClick={() => setMontantDonne(String(val))}
                        className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-sm font-bold transition-colors"
                      >
                        {val.toLocaleString()} F
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {modePaiement && modePaiement !== 'especes' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-6 text-center"
                >
                  <p className="text-5xl mb-3">{modePaiement === 'mobile' ? '📱' : '💳'}</p>
                  <p className="font-bold text-lg">{commandeActive.total.toLocaleString()} F</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {modePaiement === 'mobile' ? 'Confirmer réception Mobile Money' : 'Faire passer la carte au terminal'}
                  </p>
                </motion.div>
              )}

              <div className="flex-1" />

              <button
                onClick={finaliserPaiement}
                disabled={!modePaiement}
                className="w-full py-5 rounded-2xl font-bold text-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={28} /> Valider le Paiement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterfaceCaissier;
