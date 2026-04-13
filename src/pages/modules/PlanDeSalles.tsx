import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Coffee, Wine, Utensils, ShoppingBag, Package, Eye } from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';

const PlanDeSalles = () => {
  const { tables, commandes, initialiserTempsReel } = usePOSStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialiserTempsReel();
  }, []);

  const getMinutesEcoulees = (iso: string) => {
    if (!iso) return 0;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  };

  const zones = ['salle', 'terrasse', 'vip'] as const;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Plan des Salles</h2>
          <p className="text-slate-400 mt-1">Surveillez l'occupation de vos tables en temps réel.</p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Libre
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Occupé
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500" /> Addition
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {zones.map(zone => {
          const tablesZone = tables.filter(t => t.zone === zone);
          if (tablesZone.length === 0) return null;

          return (
            <div key={zone} className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    {zone === 'salle' ? <Coffee size={120} /> : zone === 'terrasse' ? <Utensils size={120} /> : <Wine size={120} />}
                </div>

              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-primary/30" />
                {zone}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {tablesZone.map(table => {
                   const commande = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   const estOccupee = table.statut === 'occupee';
                   const veutAddition = table.statut === 'en_attente_paiement';

                   return (
                     <motion.button
                       key={table.id}
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => navigate('/tableau-de-bord/caisse')} // Redirige vers la caisse pour gérer la table
                       className={`relative aspect-square rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 ${
                         estOccupee 
                           ? 'bg-red-500/10 border-red-500/30' 
                           : veutAddition
                           ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                           : 'bg-slate-900 border-white/5 hover:border-green-500/30'
                       }`}
                     >
                       <div className="font-display font-black text-2xl text-white">
                         {table.nom.replace(/Table\s+/i, '')}
                       </div>
                       
                       {estOccupee && commande && (
                         <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mb-1">
                                <Clock size={10} /> {getMinutesEcoulees(commande.dateOuverture)} min
                            </div>
                            <div className="text-red-400 font-black text-xs">
                                {commande.total.toLocaleString()} F
                            </div>
                         </div>
                       )}

                       {!estOccupee && !veutAddition && (
                         <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Users size={10} /> {table.capacite} places
                         </div>
                       )}

                       {veutAddition && (
                         <div className="animate-bounce">
                            <ShoppingBag size={20} className="text-yellow-500" />
                         </div>
                       )}

                       {/* Indicateur de statut */}
                       <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-slate-950 ${
                         estOccupee ? 'bg-red-500' : veutAddition ? 'bg-yellow-500' : 'bg-green-500'
                       }`} />
                     </motion.button>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vitrine des Stocks */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                <Eye size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Vitrine des Disponibilités</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {usePOSStore.getState().produits.filter(p => p.categorie === 'Boisson').slice(0, 10).map(produit => (
                <div key={produit.id} className="glass-panel p-4 flex items-center gap-3 border-white/5">
                    <span className="text-2xl">{produit.emoji}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{produit.nom}</p>
                        <p className={`text-[10px] font-black ${produit.stockTotal <= produit.stockAlerte ? 'text-red-500' : 'text-slate-500'}`}>
                            {produit.stockTotal} EN STOCK
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};


export default PlanDeSalles;
