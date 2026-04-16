import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Coffee, Wine, Utensils, ShoppingBag, Package, Eye, ArrowUpRight, X, Receipt, PlusCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import type { Produit } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const navigate = useNavigate();
  const [tableSelectionnee, setTableSelectionnee] = useState<{table: TablePlan, commande?: Commande} | null>(null);

  const zones = ['salle', 'terrasse', 'vip'] as const;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter uppercase italic">Plan des Salles</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Occupation Live
          </p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Libre
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-rose-500" /> Occupé
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Addition
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {zones.map(zone => {
          const tablesZone = tables.filter(t => t.zone === zone);
          if (tablesZone.length === 0) return null;

          return (
            <div key={zone} className="relative">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500 whitespace-nowrap">
                  {zone}
                </h3>
                <div className="h-px w-full bg-gradient-to-r from-indigo-500/30 to-transparent" />
              </div>

              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
              >
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
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Vitrine des Stocks High-End */}
      <section className="mt-16 bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] -z-10" />
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase">Vitrine de Stock</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Disponibilités critiques en temps réel</p>
                </div>
            </div>
            <button onClick={() => navigate('/tableau-de-bord/stocks')} className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
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

      {/* MODALE DE SITUATION DE TABLE */}
      <AnimatePresence>
          {tableSelectionnee && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setTableSelectionnee(null)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl"
                  >
                      {/* Header Modale */}
                      <div className="bg-slate-950 p-8 md:p-10 text-white flex justify-between items-center">
                          <div>
                              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Situation Actuelle
                              </p>
                              <h3 className="text-3xl md:text-4xl font-display font-black italic">{tableSelectionnee.table.nom}</h3>
                          </div>
                          <button 
                            onClick={() => setTableSelectionnee(null)}
                            className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                          >
                            <X size={20} />
                          </button>
                      </div>

                      <div className="p-8 md:p-10 text-slate-950">
                          {tableSelectionnee.commande ? (
                              <>
                                  <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                          <Users size={20} />
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientèle</p>
                                          <p className="text-sm font-bold">{tableSelectionnee.commande.nombreCouverts} Convives · Ouvert depuis {Math.floor((Date.now() - new Date(tableSelectionnee.commande.dateOuverture).getTime()) / 60000)} min</p>
                                      </div>
                                  </div>

                                  <div className="space-y-6 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar-light">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-2">Résumé des tournées consommées</p>
                                      {tableSelectionnee.commande.lignes.map((ligne, idx) => (
                                          <div key={idx} className="flex justify-between items-center">
                                              <div className="flex items-center gap-4">
                                                  <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black">{ligne.quantite}</span>
                                                  <div>
                                                      <p className="text-xs font-black uppercase tracking-tight">{ligne.produitNom}</p>
                                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ligne.statut === 'pret' ? 'Prêt' : 'Déjà servi'}</p>
                                                  </div>
                                              </div>
                                              <p className="text-sm font-black">{ligne.sousTotal.toLocaleString()} F</p>
                                          </div>
                                      ))}
                                  </div>

                                  <div className="pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-end mb-8">
                                      <div>
                                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total Cumulé</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net à payer à l'instant T</p>
                                      </div>
                                      <div className="text-right">
                                          <span className="text-4xl md:text-5xl font-display font-black text-slate-950 tracking-tighter">
                                              {tableSelectionnee.commande.total.toLocaleString()}
                                          </span>
                                          <span className="text-lg font-black text-slate-400 ml-2 text-indigo-500">F</span>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <button 
                                        onClick={() => navigate('/tableau-de-bord/caisse')}
                                        className="py-5 rounded-2xl bg-white border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                      >
                                          <Receipt size={16} /> VOIR TICKET
                                      </button>
                                      <button 
                                        onClick={() => navigate('/tableau-de-bord/caisse')}
                                        className="py-5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                                      >
                                          <CreditCard size={16} /> ENCAISSER
                                      </button>
                                  </div>
                              </>
                          ) : (
                              <div className="py-12 text-center">
                                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                                  <h4 className="text-xl font-display font-black uppercase">Table Libre</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-10">Prête pour une nouvelle tournée !</p>
                                  <button 
                                    onClick={() => navigate('/tableau-de-bord/caisse')}
                                    className="mt-8 py-5 px-8 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-600/20"
                                  >
                                      OUVRIR UNE SESSION
                                  </button>
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

// --- Sous-Composants ---

interface TableCardProps {
    table: TablePlan;
    commande?: Commande;
    onClick: () => void;
}

const TableCard = ({ table, commande, onClick }: TableCardProps) => {
    const estOccupee = table.statut === 'occupee';
    const veutAddition = table.statut === 'en_attente_paiement';
    
    const getMinutes = (iso: string) => {
        if (!iso) return 0;
        return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative aspect-square rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 group ${
                estOccupee 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : veutAddition
                ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]'
                : 'bg-slate-900 border-white/5 hover:border-emerald-500/30'
            }`}
        >
            <div className="font-display font-black text-3xl md:text-5xl text-white group-hover:scale-110 transition-transform">
                {table.nom.replace(/Table\s+/i, '')}
            </div>
            
            {estOccupee && commande && (
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter">
                        <Clock size={10} /> {getMinutes(commande.dateOuverture)} min
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className="bg-rose-500/20 text-rose-500 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">
                            {commande.lignes.reduce((acc, l) => acc + l.quantite, 0)} items
                         </span>
                    </div>
                    <div className="text-rose-400 font-black text-xs md:text-lg tracking-tighter">
                        {commande.total.toLocaleString()} F
                    </div>
                </div>
            )}

            {!estOccupee && !veutAddition && (
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest">
                <Users size={12} /> {table.capacite}
                </div>
            )}

            {veutAddition && (
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <ShoppingBag size={24} className="text-amber-500 shadow-amber-500/50" />
                </motion.div>
            )}

            {/* Status light glow */}
            <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${
                estOccupee ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : veutAddition ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'
            }`} />
        </motion.button>
    );
};

const StockMinCard = ({ produit }: { produit: Produit }) => {
    const isCritical = produit.stockTotal <= produit.stockAlerte;
    const progress = Math.min((produit.stockTotal / (produit.stockAlerte * 3)) * 100, 100);

    return (
        <div className="bg-white/[0.02] border border-white/5 p-5 md:p-6 rounded-[2rem] group hover:bg-white/[0.04] transition-all relative overflow-hidden">
            {isCritical && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse" />}
            <div className="flex justify-between items-start mb-4">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{produit.emoji || '🍷'}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${isCritical ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                    {isCritical ? 'Alerte' : 'OK'}
                </span>
            </div>
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter mb-2">{produit.nom}</p>
            <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        />
                    </div>
                </div>
                <p className={`text-sm font-display font-black leading-none ${isCritical ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {produit.stockTotal}
                </p>
            </div>
        </div>
    );
};

export default PlanDeSalles;
