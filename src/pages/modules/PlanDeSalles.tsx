import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, ShoppingBag, Package, X, Receipt, 
  CheckCircle2, CreditCard, Layout, MapPin, Wine, Info, ArrowUpRight, Activity,
  Smartphone, Banknote, AlertTriangle, Loader2, DoorOpen, MoreVertical, Search, Settings
} from 'lucide-react';
import { usePOSStore, imprimerTicket } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

// ----------- Types locaux -----------
type EtapeModal = 'detail' | 'paiement' | 'liberation';

const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const navigate = useNavigate();
  const [tableSelectionnee, setTableSelectionnee] = useState<{table: TablePlan, commande?: Commande} | null>(null);
  const [etapeModal, setEtapeModal] = useState<EtapeModal>('detail');
  const zones = ['salle', 'terrasse', 'vip', 'comptoir'] as const;

  const totalActif = commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + (c.total || 0), 0);
  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const tauxOccupation = Math.round((tablesOccupees / (tables.length || 1)) * 100);

  const renderTable = (table: TablePlan) => {
    const commande = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
    const isOccupee = table.statut === 'occupee';
    const isEnAttente = table.statut === 'en_attente_paiement';

    return (
      <motion.button
        key={table.id}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setTableSelectionnee({ table, commande })}
        className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-between border-2 transition-all duration-500 shadow-lg ${
          isOccupee 
            ? 'bg-slate-950 border-slate-900 shadow-slate-900/20 text-white' 
            : isEnAttente
            ? 'bg-amber-50 border-amber-200 shadow-amber-500/10'
            : 'bg-white border-slate-50 shadow-slate-200/50'
        }`}
      >
        <div className={`text-[7px] font-black uppercase tracking-[0.2em] ${isOccupee ? 'text-slate-500' : 'text-slate-300'}`}>
          {table.statut.replace('_', ' ')}
        </div>

        <div className="text-center">
          <h3 className={`text-xl font-black tracking-tighter ${isOccupee ? 'text-white' : 'text-slate-900'}`}>
            {table.nom.split(' ')[1] || table.nom}
          </h3>
          {isOccupee && commande && (
            <p className="text-emerald-400 font-black text-sm tracking-tight">{(commande.total || 0).toLocaleString()} F</p>
          )}
        </div>

        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${isOccupee ? 'bg-white/10' : 'bg-slate-50'}`}>
          <Users size={10} className="text-slate-400" />
          <span className={`text-[8px] font-black ${isOccupee ? 'text-slate-300' : 'text-slate-500'}`}>{table.capacite}</span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Executive Header Stats */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Chiffre d'Affaire Live" value={`${totalActif.toLocaleString()} F`} icon={<Activity size={14} />} color="blue" />
          <StatPill label="Taux d'Occupation" value={`${tauxOccupation}%`} icon={<Users size={14} />} color="emerald" />
          <StatPill label="Tables Occupées" value={`${tablesOccupees} / ${tables.length}`} icon={<Layout size={14} />} color="indigo" />
          <StatPill label="Commandes en cours" value={commandes.filter(c => c.statut !== 'payee').length} icon={<Clock size={14} />} color="amber" />
        </div>
        <button 
          onClick={() => navigate('/tableau-de-bord/tables')}
          className="lg:w-[150px] bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <Settings size={16} className="text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Configurer</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {zones.map(zone => (
          <section key={zone} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{zone}</h2>
               <div className="h-[1px] flex-1 bg-slate-50" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {tables.filter(t => t.zone === zone).map(renderTable)}
            </div>
          </section>
        ))}
      </div>

      {/* Modal Table Detail */}
      <AnimatePresence>
        {tableSelectionnee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${tableSelectionnee.table.statut === 'libre' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tableSelectionnee.table.statut.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">{tableSelectionnee.table.zone}</span>
                   </div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{tableSelectionnee.table.nom}</h2>
                </div>
                <button onClick={() => setTableSelectionnee(null)} className="p-3 rounded-2xl bg-white shadow-lg text-slate-400 hover:text-slate-950 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {tableSelectionnee.commande ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serveur en charge</p>
                          <p className="text-xl font-black text-slate-950 uppercase">{tableSelectionnee.commande.serveurNom}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temps écoulé</p>
                          <p className="text-xl font-black text-slate-950 uppercase flex items-center gap-2">
                             <Clock size={18} className="text-indigo-500" />
                             {Math.floor((Date.now() - new Date(tableSelectionnee.commande.dateOuverture).getTime()) / 60000)} MIN
                          </p>
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Articles en cours</h3>
                       <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                          {tableSelectionnee.commande.lignes.map((ligne, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                               <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                                     🍹
                                  </div>
                                  <span className="font-black text-slate-900 uppercase text-[11px]">{ligne.produitNom}</span>
                               </div>
                               <span className="font-black text-slate-950 tracking-tight">{(ligne.prixUnitaire * ligne.quantite).toLocaleString()} F</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Consommé</span>
                          <span className="text-3xl font-black text-slate-950 tracking-tighter">{(tableSelectionnee.commande.total || 0).toLocaleString()} F</span>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6">
                      <DoorOpen size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Table Libre</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Aucune commande active sur cette table.</p>
                  </div>
                )}
              </div>

              {tableSelectionnee.commande && (
                <div className="p-8 pt-0 grid grid-cols-2 gap-4">
                   <button className="h-16 rounded-[2rem] bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                      <Receipt size={20} /> Note Provisoire
                   </button>
                   <button onClick={() => navigate('/tableau-de-bord/caisse')} className="h-16 rounded-[2rem] bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-950/40 hover:scale-105 transition-all flex items-center justify-center gap-3">
                      <CreditCard size={20} /> Régler l'addition
                   </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatPill = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
      color === 'blue' ? 'bg-blue-600 text-white shadow-blue-500/20' :
      color === 'emerald' ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
      color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-500/20' :
      'bg-amber-600 text-white shadow-amber-500/20'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-black text-slate-950 tracking-tighter uppercase leading-none">{value}</p>
    </div>
  </div>
);

export default PlanDeSalles;
