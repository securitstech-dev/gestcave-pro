import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, ShoppingBag, Package, X, Receipt, 
  CheckCircle2, CreditCard, Layout, MapPin, Wine, Info, ArrowUpRight, Activity
} from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import type { Produit } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';

const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const totalLignes = commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + c.total, 0);
  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const tauxOccupation = Math.round((tablesOccupees / (tables.length || 1)) * 100);

  return (
    <div className="space-y-12">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Plan des Salles</h2>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Surveillance de l'établissement en direct.
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Disponibilités critiques</p>
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

      {/* DETAIL DE LA TABLE SELECTIONNEE */}
      <AnimatePresence>
          {tableSelectionnee && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setTableSelectionnee(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                  
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
                  >
                      <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                          <div>
                              <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-1">Détails Table</p>
                              <h3 className="text-3xl font-bold tracking-tight">{tableSelectionnee.table.nom}</h3>
                          </div>
                          <button onClick={() => setTableSelectionnee(null)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={20} /></button>
                      </div>

                      <div className="p-8">
                          {tableSelectionnee.commande ? (
                              <>
                                  <div className="flex items-center gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                      <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-600 font-bold">
                                          {tableSelectionnee.commande.nombreCouverts}
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Couverts</p>
                                          <p className="text-sm font-bold text-slate-900 mt-1">Servi par {tableSelectionnee.commande.serveurNom}</p>
                                      </div>
                                  </div>

                                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar-admin mb-8">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Consommations</p>
                                      {tableSelectionnee.commande.lignes.map((ligne, idx) => (
                                          <div key={idx} className="flex justify-between items-center py-2">
                                              <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">x{ligne.quantite} {ligne.produitNom}</span>
                                              <span className="font-bold text-slate-900">{ligne.sousTotal.toLocaleString()} F</span>
                                          </div>
                                      ))}
                                  </div>

                                  <div className="flex justify-between items-end mb-8 pt-6 border-t-2 border-dashed border-slate-100">
                                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Total Note</p>
                                      <p className="text-5xl font-bold text-slate-900 tracking-tighter">{tableSelectionnee.commande.total.toLocaleString()} <span className="text-sm">F</span></p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => navigate('/tableau-de-bord/caisse')} className="py-4 rounded-xl border-2 border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Voir Ticket</button>
                                      <button onClick={() => navigate('/tableau-de-bord/caisse')} className="py-4 rounded-xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all">Encaisser</button>
                                  </div>
                              </>
                          ) : (
                              <div className="py-10 text-center">
                                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <CheckCircle2 size={32} />
                                  </div>
                                  <h4 className="font-bold text-slate-900 uppercase">Table Libre</h4>
                                  <p className="text-xs text-slate-400 font-medium mt-2">Prête pour le service.</p>
                                  <button onClick={() => navigate('/tableau-de-bord/caisse')} className="mt-8 py-4 px-10 rounded-xl bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all">Ouvrir Ticket</button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

const TableCard = ({ table, commande, onClick }: { table: TablePlan, commande?: Commande, onClick: () => void }) => {
    const estOccupee = table.statut === 'occupee';
    const veutAddition = table.statut === 'en_attente_paiement';
    
    // Calcul de la durée
    const [duree, setDuree] = useState<string>('0m');
    useEffect(() => {
        if (!commande?.dateOuverture) return;
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - new Date(commande.dateOuverture).getTime()) / 60000);
            setDuree(diff >= 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`);
        }, 30000);
        const diff = Math.floor((Date.now() - new Date(commande.dateOuverture).getTime()) / 60000);
        setDuree(diff >= 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`);
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

const StockMinCard = ({ produit }: { produit: Produit }) => {
    const isCritical = produit.stockTotal <= produit.stockAlerte;
    return (
        <div className={`p-5 rounded-2xl border transition-all ${isCritical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-2xl">{produit.emoji || '🍷'}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isCritical ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {produit.stockTotal} un.
                </span>
            </div>
            <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{produit.nom}</p>
        </div>
    );
};

export default PlanDeSalles;
