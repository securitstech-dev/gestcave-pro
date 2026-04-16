import { motion } from 'framer-motion';
import { Users, Clock, Coffee, Wine, Utensils, ShoppingBag, Package, Eye, ArrowUpRight } from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import type { Produit } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const navigate = useNavigate();

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

      <div className="grid grid-cols-1 gap-12">
        {zones.map(zone => {
          const tablesZone = tables.filter(t => t.zone === zone);
          if (tablesZone.length === 0) return null;

          return (
            <div key={zone} className="relative">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
                  {zone}
                </h3>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                   {tablesZone.length} TABLES
                </div>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
              >
                {tablesZone.map(table => {
                   const commande = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
                   return (
                     <TableCard 
                        key={table.id} 
                        table={table} 
                        commande={commande} 
                        onClick={() => navigate('/tableau-de-bord/caisse')}
                      />
                   );
                })}
              </motion.div>
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
            {usePOSStore.getState().produits.filter(p => ['Boisson', 'Cave'].includes(p.categorie)).slice(0, 10).map(produit => (
                <StockMinCard key={produit.id} produit={produit} />
            ))}
        </div>
      </section>
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
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative aspect-square rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 group ${
                estOccupee 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : veutAddition
                ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-slate-900 border-white/5 hover:border-emerald-500/30'
            }`}
        >
            <div className="font-display font-black text-3xl text-white group-hover:scale-110 transition-transform">
                {table.nom.replace(/Table\s+/i, '')}
            </div>
            
            {estOccupee && commande && (
                <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-1">
                    <Clock size={10} /> {getMinutes(commande.dateOuverture)} min
                </div>
                <div className="text-rose-400 font-black text-xs">
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
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <ShoppingBag size={20} className="text-amber-500" />
                </motion.div>
            )}

            {/* Status dot */}
            <div className={`absolute top-4 right-4 w-3.5 h-3.5 rounded-full border-[3px] border-slate-950 ${
                estOccupee ? 'bg-rose-500' : veutAddition ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`} />
        </motion.button>
    );
};

const StockMinCard = ({ produit }: { produit: Produit }) => (
    <div className="glass-panel p-4 flex items-center gap-4 border-white/5 group hover:border-white/10 transition-colors">
        <div className="text-2xl w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl group-hover:rotate-12 transition-transform">
            {produit.emoji}
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">{produit.nom}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${produit.stockTotal <= produit.stockAlerte ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <p className={`text-[9px] font-black ${produit.stockTotal <= produit.stockAlerte ? 'text-rose-400' : 'text-slate-500'}`}>
                    {produit.stockTotal} UNITES
                </p>
            </div>
        </div>
    </div>
);


export default PlanDeSalles;
