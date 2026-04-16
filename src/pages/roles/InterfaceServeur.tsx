import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Produit, TablePlan } from '../../store/posStore';

const InterfaceServeur = () => {
  const { tables, produits, commandes, ouvrirTable, ajouterLigne, modifierQuantite, supprimerLigne, envoyerCuisine } = usePOSStore();
  const { nomEmploye, etablissementId } = usePosteSession();
  const navigate = useNavigate();
  
  const [etape, setEtape] = useState<'tables' | 'couverts' | 'commande'>('tables');
  const [tableSelectionnee, setTableSelectionnee] = useState<TablePlan | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [nombreCouverts, setNombreCouverts] = useState(1);
  const [categorieActive, setCategorieActive] = useState<string>(
    [...new Set(produits.map(p => p.sousCategorie || p.categorie))][0] as string || 'Boissons'
  );
  
  const commandeActive = commandes.find(c => c.id === commandeId);
  const categories = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
  const produitsFiltres = produits.filter(p => (p.sousCategorie || p.categorie) === categorieActive);

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  // Vue 1 : Sélection de Table (Dashboard Staff)
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
        <header className="p-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-indigo-500/5 shadow-lg">
                <Utensils size={24} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-display font-black tracking-tight">GESTCAVE <span className="text-indigo-500">PRO</span></h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Service Actif · {nomEmploye}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl bg-white/5 border border-white/5"
            >
              <LogOut size={14} /> Fermer Session
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 pb-32">
          {/* Metrics Staff */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <MiniStat label="Tables Actives" valeur={tables.filter(t => t.statut === 'occupee').length} icone={<Zap size={14} className="text-amber-400" />} />
              <MiniStat label="Libres" valeur={tables.filter(t => t.statut === 'libre').length} icone={<CheckCircle2 size={14} className="text-emerald-400" />} />
              <MiniStat label="En Attente" valeur={commandes.filter(c => c.statut === 'en_cours').length} icone={<Clock size={14} className="text-indigo-400" />} />
          </div>

          <AnimatePresence>
            {zones.map((zone, idx) => {
              const tablesZone = tables.filter(t => t.zone === zone);
              if (!tablesZone.length) return null;
              return (
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={zone} 
                    className="mb-12"
                >
                  <div className="flex items-center gap-3 mb-6 px-1">
                      <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                      <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                        {zone === 'salle' ? 'SÉJOUR PRINCIPAL' : zone === 'terrasse' ? 'TERRASSE EXTÉRIEURE' : 'SALON PRIVÉ VIP'}
                      </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tablesZone.map(table => {
                      const commande = commandes.find(c => c.id === table.commandeActiveId);
                      const isOccupee = table.statut === 'occupee';
                      const isPaiement = table.statut === 'en_attente_paiement';
                      
                      return (
                        <motion.button
                          key={table.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setTableSelectionnee(table);
                            if (table.statut === 'libre') {
                              setEtape('couverts');
                            } else if (table.commandeActiveId) {
                              setCommandeId(table.commandeActiveId);
                              setEtape('commande');
                            }
                          }}
                          className={`relative aspect-square rounded-[2rem] p-6 text-left border-2 transition-all duration-300 group overflow-hidden ${
                            table.statut === 'libre' 
                              ? 'bg-slate-900/50 border-white/5 hover:border-emerald-500/50' 
                              : isOccupee
                              ? 'bg-indigo-500/10 border-indigo-500/30'
                              : 'bg-amber-500/10 border-amber-500/30'
                          }`}
                        >
                          {/* Background Glow */}
                          <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-3xl opacity-20 ${
                              table.statut === 'libre' ? 'bg-emerald-500' : isOccupee ? 'bg-indigo-500' : 'bg-amber-500'
                          }`} />

                          <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                     table.statut === 'libre' ? 'bg-white/5 text-slate-500' : isOccupee ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                    <LayoutGrid size={16} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={10} className="text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-500">{table.capacite}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-display font-black text-white">{table.nom}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${
                                         table.statut === 'libre' ? 'bg-emerald-500' : isOccupee ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'
                                     }`} />
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${
                                         table.statut === 'libre' ? 'text-emerald-500' : isOccupee ? 'text-indigo-400' : 'text-amber-500'
                                     }`}>
                                         {table.statut}
                                     </span>
                                </div>
                            </div>
                          </div>

                          {commande && (
                            <div className="absolute top-6 right-6">
                                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                    <Clock size={10} /> {minutesEcoulees(commande.dateOuverture)}'
                                </div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Vue 2 : Nombre de Couverts (Expérience Sensorielle)
  if (etape === 'couverts') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setEtape('tables')} 
            className="absolute top-10 left-10 p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase"
        >
          <ArrowLeft size={16} /> Annuler
        </motion.button>

        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full"
        >
          <div className="w-24 h-24 rounded-3xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 shadow-indigo-500/10 shadow-2xl">
              <Users size={48} className="text-indigo-400" />
          </div>
          <h2 className="text-4xl font-display font-black mb-2 tracking-tight">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">Préparation du couvert</p>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
            <div className="flex items-center justify-between gap-8">
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))}
                  className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl font-bold text-slate-500 hover:text-white transition-colors"
                >
                  <Minus size={32} />
                </motion.button>

                <div className="flex flex-col items-center">
                    <span className="text-8xl font-display font-black text-white">{nombreCouverts}</span>
                    <span className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mt-2">Convives</span>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))}
                  className="w-20 h-20 rounded-2xl bg-indigo-600 shadow-indigo-500/30 shadow-xl flex items-center justify-center text-3xl font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  <Plus size={32} />
                </motion.button>
            </div>
          </div>

          <button 
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const id = await ouvrirTable(tableSelectionnee.id, etablissementId || 'srv', nomEmploye, nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success('Table ouverte avec succès ! 🚀');
              } catch (err) {
                toast.error("Échec de l'ouverture");
              }
            }}
            className="w-full py-6 rounded-3xl bg-white text-slate-950 text-xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
          >
            CONFIRMER & COMMANDER <ChevronRight size={24} />
          </button>
        </motion.div>
      </div>
    );
  }

  // Vue 3 : Prise de Commande (Expérience Épicurienne)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      {/* Header Premium */}
      <header className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 p-4 safe-top">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setEtape('tables')} 
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="font-display font-black text-xl flex items-center gap-2 capitalize">
                    {tableSelectionnee?.nom}
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </h2>
                <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black tracking-widest uppercase">
                    <Users size={10} /> {commandeActive?.nombreCouverts} PERSONNES · #{commandeId?.slice(-4)}
                </div>
              </div>
          </div>
          
          <div className="flex flex-col items-end">
              <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">TOTAL TABLE</div>
              <div className="text-3xl font-display font-black text-white">{commandeActive?.total.toLocaleString()} <span className="text-xs text-slate-500 font-bold ml-1">F</span></div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="max-w-7xl mx-auto flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategorieActive(cat as string)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap snap-start transition-all duration-300 border ${
                categorieActive === cat 
                  ? 'bg-white text-slate-950 border-white shadow-xl scale-105' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full relative">
        {/* Grille Produits */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-48">
          <AnimatePresence mode="popLayout">
            {produitsFiltres.map((produit, idx) => (
              <motion.button
                key={produit.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (commandeId) ajouterLigne(commandeId, produit);
                }}
                className="group relative bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 text-left hover:bg-slate-800 transition-all overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                        {produit.emoji}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white leading-tight mb-2 group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-tight">{produit.nom}</h4>
                        <div className="flex justify-between items-end">
                            <span className="text-xl font-display font-black text-white">{produit.prix.toLocaleString()} <span className="text-[10px] text-slate-500 ml-1">F</span></span>
                            {produit.stockTotal <= produit.stockAlerte && (
                                <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 animate-pulse uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                                    <AlertTriangle size={10} /> STOCK BAS
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badge Ajout Rapide */}
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                             <Plus size={16} />
                         </div>
                    </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Ticket Global Tactile (Floating Panel) */}
        <AnimatePresence>
          {commandeActive && commandeActive.lignes.length > 0 && (
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] p-4 lg:p-8 md:flex md:justify-center"
            >
              <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col max-h-[60vh]">
                {/* Drag bar for vibe */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3" />
                
                <div className="px-8 pb-4 flex justify-between items-center bg-slate-900 border-b border-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <ShoppingBag size={18} className="text-indigo-500" />
                    Bon de Commande
                  </h3>
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {commandeActive.lignes.length} Article(s)
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                  {commandeActive.lignes.map(ligne => (
                    <motion.div 
                        layout
                        key={ligne.id} 
                        className={`flex items-center gap-4 p-4 rounded-3xl transition-all border ${
                            ligne.statut === 'en_attente' ? 'bg-white/5 border-white/5' : 'bg-slate-950/40 border-indigo-500/20 opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-3 bg-slate-950 border border-white/5 rounded-2xl p-1.5 shadow-inner">
                        <button 
                            onClick={() => modifierQuantite(commandeId!, ligne.id, -1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-display font-black text-xl text-white">{ligne.quantite}</span>
                        <button 
                            onClick={() => modifierQuantite(commandeId!, ligne.id, 1)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                ligne.statut === 'en_attente' ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-600'
                            }`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{ligne.produitNom}</p>
                        <p className="text-[10px] text-slate-500 font-bold font-mono">{(ligne.prixUnitaire).toLocaleString()} F / UNITE</p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                          <span className="font-display font-black text-indigo-400">{ligne.sousTotal.toLocaleString()} F</span>
                          {ligne.statut === 'en_attente' ? (
                            <button onClick={() => supprimerLigne(commandeId!, ligne.id)} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                              <X size={12} />
                            </button>
                          ) : (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border ${
                                ligne.statut === 'en_preparation' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                                ligne.statut === 'pret' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {ligne.statut}
                            </span>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 bg-slate-900 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (commandeId) {
                        envoyerCuisine(commandeId);
                        toast.success('Envoyé ! Cuisine & Bar sont informés 🍳⚡', { 
                            style: { background: '#1e293b', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' } 
                        });
                      }
                    }}
                    disabled={!commandeActive.lignes.some(l => l.statut === 'en_attente')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-4 text-xs tracking-[0.3em] shadow-xl shadow-indigo-600/20 transition-all uppercase"
                  >
                    <Send size={20} className="text-indigo-200" /> VALIDER LA COMMANDE
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .safe-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
};

const MiniStat = ({ label, valeur, icone }: any) => (
    <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
            {icone}
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-display font-black text-white">{valeur}</p>
        </div>
    </div>
);

export default InterfaceServeur;
