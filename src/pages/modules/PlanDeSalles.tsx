import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, ShoppingBag, Package, X, Receipt, 
  CheckCircle2, CreditCard, Layout, MapPin, Wine, Info, ArrowUpRight, Activity,
  Smartphone, Banknote, AlertTriangle, Loader2, DoorOpen
} from 'lucide-react';
import { usePOSStore, imprimerTicket } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import type { Produit } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

// ----------- Types locaux -----------
type EtapeModal = 'detail' | 'paiement' | 'liberation';

// ----------- Composant Principal -----------
const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const navigate = useNavigate();
  const [tableSelectionnee, setTableSelectionnee] = useState<{table: TablePlan, commande?: Commande} | null>(null);
  const zones = ['salle', 'terrasse', 'vip'] as const;

  const totalLignes = commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + c.total, 0);
  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const tauxOccupation = Math.round((tablesOccupees / (tables.length || 1)) * 100);

  // Mettre Ã  jour la commande dans le modal si les donnÃ©es changent en temps rÃ©el
  useEffect(() => {
    if (!tableSelectionnee?.commande) return;
    const cmdActualisee = commandes.find(c => c.id === tableSelectionnee.commande!.id);
    if (cmdActualisee) {
      setTableSelectionnee(prev => prev ? { ...prev, commande: cmdActualisee } : prev);
    }
  }, [commandes]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Plan des Salles</h2>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Surveillance de l'Ã©tablissement en direct.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Occupation</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{tauxOccupation}% <span className="text-[10px] text-slate-400 font-bold ml-1">({tablesOccupees}/{tables.length})</span></p>
                </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Activity size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Encours Salle</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{totalLignes.toLocaleString()} F</p>
                </div>
            </div>
            <div className="hidden md:flex bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Libre</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Service</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Addition</span>
                </div>
            </div>
        </div>
      </header>

      <div className="space-y-12">
        {zones.map(zone => {
          const tablesZone = tables.filter(t => t.zone === zone);
          if (tablesZone.length === 0) return null;

          return (
            <div key={zone}>
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Zone {zone}</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {tablesZone.map(table => {
                   const commande = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   return (
                     <TableCard 
                        key={table.id} 
                        table={table} 
                        commande={commande} 
                        onClick={() => setTableSelectionnee({table, commande})}
                      />
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Vitrine des Stocks */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Vue Rapide Inventaire</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">DisponibilitÃ©s critiques</p>
                </div>
            </div>
            <button onClick={() => navigate('/tableau-de-bord/stocks')} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
                <ArrowUpRight size={20} />
            </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {usePOSStore.getState().produits
                .filter(p => ['Boisson', 'Cave'].includes(p.categorie))
                .sort((a, b) => a.stockTotal - b.stockTotal)
                .slice(0, 10).map(produit => (
                    <StockMinCard key={produit.id} produit={produit} />
            ))}
        </div>
      </section>

      {/* MODAL TABLE */}
      <AnimatePresence>
          {tableSelectionnee && (
              <ModalTable
                data={tableSelectionnee}
                onClose={() => setTableSelectionnee(null)}
                navigate={navigate}
              />
          )}
      </AnimatePresence>
    </div>
  );
};

// ----------- Modal Table (Paiement + LibÃ©ration) -----------
const ModalTable = ({ data, onClose, navigate }: {
  data: { table: TablePlan, commande?: Commande },
  onClose: () => void,
  navigate: (path: string) => void
}) => {
  const { encaisserCommande, annulerCommande } = usePOSStore();
  const { profil } = useAuthStore();
  const [etape, setEtape] = useState<EtapeModal>('detail');
  const [modePaiement, setModePaiement] = useState<'comptant' | 'credit'>('comptant');
  const [sousMode, setSousMode] = useState<'especes' | 'mobile'>('especes');
  const [loading, setLoading] = useState(false);

  const { table, commande } = data;

  const handleEncaisser = async () => {
    if (!commande) return;
    setLoading(true);
    try {
      await encaisserCommande(
        commande.id, 
        modePaiement, 
        'Direct', 
        0, 
        commande.total,
        '',
        sousMode
      );
      // Impression optionnelle
      const veutImprimer = window.confirm('âœ… Paiement enregistrÃ© ! Imprimer le ticket client ?');
      if (veutImprimer) {
        imprimerTicket(commande, profil?.etablissement_id || 'GestCave Pro');
      }
      toast.success(`Table ${table.nom} encaissÃ©e et libÃ©rÃ©e !`);
      onClose();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLiberer = async () => {
    if (!commande) return;
    setLoading(true);
    try {
      await annulerCommande(commande.id);
      toast.success(`Table ${table.nom} libÃ©rÃ©e.`);
      onClose();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg bg-white sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl"
      >
        {/* En-tÃªte */}
        <div className={`p-8 text-white flex justify-between items-center ${
          table.statut === 'occupee' ? 'bg-slate-900' : 
          table.statut === 'en_attente_paiement' ? 'bg-amber-600' : 'bg-emerald-700'
        }`}>
          <div>
            <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mb-1">
              {etape === 'detail' ? 'DÃ©tail Table' : etape === 'paiement' ? 'Encaissement' : 'LibÃ©rer la Table'}
            </p>
            <h3 className="text-3xl font-black tracking-tight">{table.nom}</h3>
            {commande && (
              <p className="text-white/70 text-xs font-bold mt-1">Servi par {commande.serveurNom}</p>
            )}
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">

            {/* Ã‰TAPE 1 : DÃ‰TAIL DE LA COMMANDE */}
            {etape === 'detail' && (
              <motion.div key="detail" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {commande ? (
                  <>
                    {/* RÃ©sumÃ© couvert + durÃ©e */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                        <Users size={18} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Couverts</p>
                          <p className="font-black text-slate-900">{commande.nombreCouverts}</p>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                        <Clock size={18} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DurÃ©e</p>
                          <p className="font-black text-slate-900">
                            {Math.floor((Date.now() - new Date(commande.dateOuverture).getTime()) / 60000)}m
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Liste des articles */}
                    <div className="max-h-52 overflow-y-auto pr-1 custom-scrollbar-admin mb-6 space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-2 mb-2 border-b border-slate-100">Consommations</p>
                      {commande.lignes.map((ligne, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">Ã—{ligne.quantite}</span>
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{ligne.produitNom}</span>
                          </div>
                          <span className="font-black text-slate-900 text-sm">{ligne.sousTotal.toLocaleString()} F</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-8 pt-4 border-t-2 border-dashed border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ã  Payer</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{commande.total.toLocaleString()} <span className="text-base">F</span></p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setEtape('liberation')}
                        className="py-4 rounded-2xl border-2 border-rose-100 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex flex-col items-center gap-2"
                      >
                        <DoorOpen size={18} />
                        LibÃ©rer
                      </button>
                      <button 
                        onClick={() => navigate('/tableau-de-bord/caisse')}
                        className="py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex flex-col items-center gap-2"
                      >
                        <Receipt size={18} />
                        Caisse
                      </button>
                      <button 
                        onClick={() => setEtape('paiement')}
                        className="py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-emerald-600 transition-all flex flex-col items-center gap-2 active:scale-95"
                      >
                        <CreditCard size={18} />
                        Payer
                      </button>
                    </div>
                  </>
                ) : (
                  /* Table libre */
                  <div className="py-10 text-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={36} />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter mb-2">Table Libre</h4>
                    <p className="text-sm text-slate-400 font-medium mb-8">CapacitÃ© : {table.capacite} couverts</p>
                    <button 
                      onClick={() => navigate('/tableau-de-bord/caisse')} 
                      className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <ShoppingBag size={18} /> Ouvrir un Ticket
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Ã‰TAPE 2 : CHOIX DU MODE DE PAIEMENT */}
            {etape === 'paiement' && commande && (
              <motion.div key="paiement" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">SÃ©lectionner le mode de rÃ¨glement</p>
                
                {/* Total rappel */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white text-center mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Total</p>
                  <p className="text-5xl font-black tracking-tighter">{commande.total.toLocaleString()} <span className="text-xl">F</span></p>
                </div>

                {/* Modes de paiement */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => { setSousMode('especes'); setModePaiement('comptant'); }}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      sousMode === 'especes' 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Banknote size={28} />
                    <div className="text-center">
                      <p className="font-black text-[11px] uppercase tracking-widest">EspÃ¨ces</p>
                      <p className="text-[9px] font-bold opacity-60 mt-0.5">Paiement cash</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => { setSousMode('mobile'); setModePaiement('comptant'); }}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      sousMode === 'mobile' 
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                        : 'border-slate-200 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    <Smartphone size={28} />
                    <div className="text-center">
                      <p className="font-black text-[11px] uppercase tracking-widest">Mobile Money</p>
                      <p className="text-[9px] font-bold opacity-60 mt-0.5">MTN / Orange / Wave</p>
                    </div>
                  </button>
                </div>

                {/* Option crÃ©dit */}
                <button
                  onClick={() => setModePaiement(modePaiement === 'credit' ? 'comptant' : 'credit')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 mb-8 ${
                    modePaiement === 'credit'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-amber-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    modePaiement === 'credit' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  }`}>
                    {modePaiement === 'credit' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-[11px] uppercase tracking-widest">Enregistrer comme crÃ©dit</p>
                    <p className="text-[9px] font-bold opacity-70 mt-0.5">Le client paiera plus tard</p>
                  </div>
                </button>

                {/* Boutons action */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setEtape('detail')}
                    className="py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                    disabled={loading}
                  >
                    Retour
                  </button>
                  <button 
                    onClick={handleEncaisser}
                    disabled={loading}
                    className="py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirmer
                  </button>
                </div>
              </motion.div>
            )}

            {/* Ã‰TAPE 3 : CONFIRMATION DE LIBÃ‰RATION */}
            {etape === 'liberation' && commande && (
              <motion.div key="liberation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={36} />
                  </div>
                  <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter mb-3">LibÃ©rer {table.nom} ?</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-2">
                    La commande en cours sera <strong className="text-rose-600">annulÃ©e</strong> et la table redeviendra libre.
                  </p>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 text-left">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">âš  Attention</p>
                    <p className="text-xs text-amber-700 font-medium">
                      Les stocks seront restituÃ©s. Utilisez cette option uniquement si la commande n'a pas Ã©tÃ© encaissÃ©e.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setEtape('detail')}
                      className="py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                      disabled={loading}
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleLiberer}
                      disabled={loading}
                      className="py-4 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
                      LibÃ©rer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// ----------- Carte Table -----------
const TableCard = ({ table, commande, onClick }: { table: TablePlan, commande?: Commande, onClick: () => void }) => {
    const estOccupee = table.statut === 'occupee';
    const veutAddition = table.statut === 'en_attente_paiement';
    
    const [duree, setDuree] = useState<string>('0m');
    useEffect(() => {
        if (!commande?.dateOuverture) return;
        const calc = () => {
            const diff = Math.floor((Date.now() - new Date(commande.dateOuverture).getTime()) / 60000);
            setDuree(diff >= 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`);
        };
        calc();
        const interval = setInterval(calc, 30000);
        return () => clearInterval(interval);
    }, [commande?.dateOuverture]);

    return (
        <motion.button whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
            className={`aspect-square rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center p-6 relative gap-1 shadow-sm ${
                estOccupee 
                    ? 'bg-white border-rose-200 shadow-xl shadow-rose-500/5' 
                    : veutAddition 
                        ? 'bg-amber-50 border-amber-300 shadow-xl shadow-amber-500/10' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg'
            }`}
        >
            <div className={`text-4xl font-black tracking-tighter transition-colors ${
                estOccupee ? 'text-rose-600' : veutAddition ? 'text-amber-600' : 'text-slate-900'
            }`}>
                {table.nom.split(' ')[1] || table.nom}
            </div>
            
            {estOccupee && commande ? (
                <div className="flex flex-col items-center gap-1">
                    <p className="text-xs font-black text-slate-900 tracking-tight">{commande.total.toLocaleString()} F</p>
                    <div className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100 rounded-full">
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase">{duree}</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 mt-1 text-slate-300">
                    <Users size={12} />
                    <span className="text-[10px] font-black uppercase">{table.capacite}</span>
                </div>
            )}

            <div className={`absolute top-6 right-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                estOccupee ? 'bg-rose-500' : veutAddition ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`} />
            
            {estOccupee && (
                <div className="absolute top-6 left-6 text-slate-200">
                   <Wine size={14} />
                </div>
            )}
        </motion.button>
    );
};

// ----------- Carte Stock -----------
const StockMinCard = ({ produit }: { produit: Produit }) => {
    const isCritical = produit.stockTotal <= (produit.stockAlerte || 0);
    return (
        <div className={`p-5 rounded-2xl border transition-all ${isCritical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-2xl">{produit.emoji || 'ðŸ·'}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isCritical ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {produit.stockTotal} un.
                </span>
            </div>
            <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{produit.nom}</p>
        </div>
    );
};

export default PlanDeSalles;
