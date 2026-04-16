import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft, Star,
  ShieldCheck, Crown, User, Search
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
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [categorieActive, setCategorieActive] = useState<string>(
    [...new Set(produits.map(p => p.sousCategorie || p.categorie))][0] as string || 'Boissons'
  );
  
  const commandeActive = commandes.find(c => c.id === commandeId);
  const categories = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
  const produitsFiltres = produits.filter(p => 
    (p.sousCategorie || p.categorie) === categorieActive &&
    (p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()))
  );

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  // Vue 1 : Sélection de Table
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
        {/* Animated Background Orbs */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <header className="px-6 py-5 border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                    <Crown size={24} className="text-indigo-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-black tracking-tighter text-white">
                    GESTCAVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">PRO</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live Service</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest underline decoration-indigo-500/30 underline-offset-4">{nomEmploye}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                <LogOut size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Terminer Service</span>
                </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 pb-32">
          {/* Quick Stats Panel */}
          <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
              <QuickStat label="Occupées" valeur={tables.filter(t => t.statut === 'occupee').length} color="indigo" icone={<Users size={16} />} />
              <QuickStat label="Disponibles" valeur={tables.filter(t => t.statut === 'libre').length} color="emerald" icone={<CheckCircle2 size={16} />} />
              <QuickStat label="En Attente" valeur={tables.filter(t => t.statut === 'en_attente_paiement').length} color="amber" icone={<Clock size={16} />} />
              <QuickStat label="Total Commandes" valeur={commandes.filter(c => c.statut === 'ouverte').length} color="purple" icone={<ShoppingBag size={16} />} />
          </div>

          <AnimatePresence>
            {zones.map((zone, idx) => {
              const tablesZone = tables.filter(t => t.zone === zone);
              if (!tablesZone.length) return null;
              return (
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15, type: 'spring' }}
                    key={zone} 
                    className="mb-14"
                >
                  <div className="flex items-center gap-4 mb-8">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
                      <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] px-4 py-1.5 bg-slate-900/50 border border-white/5 rounded-full backdrop-blur-md">
                        {zone === 'salle' ? 'SEJOUR PRINCIPAL' : zone === 'terrasse' ? 'TERRASSE EXTERIEURE' : 'SALON PRIVE VIP'}
                      </h2>
                      <div className="h-0.5 flex-1 bg-gradient-to-l from-indigo-500/30 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {tablesZone.map(table => {
                      const commande = commandes.find(c => c.id === table.commandeActiveId);
                      const isOccupee = table.statut === 'occupee';
                      const isPaiement = table.statut === 'en_attente_paiement';
                      
                      return (
                        <motion.button
                          key={table.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setTableSelectionnee(table);
                            if (table.statut === 'libre') {
                              setEtape('couverts');
                            } else if (table.commandeActiveId) {
                              setCommandeId(table.commandeActiveId);
                              setEtape('commande');
                            }
                          }}
                          className={`relative aspect-[5/6] rounded-[2.5rem] p-7 text-left border-2 transition-all duration-500 overflow-hidden shadow-2xl ${
                            table.statut === 'libre' 
                              ? 'bg-white/[0.02] border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]' 
                              : isOccupee
                              ? 'bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10'
                              : 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/10'
                          }`}
                        >
                          {/* Inner Glow Surface */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${
                               table.statut === 'libre' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`} />

                          <div className="relative z-10 h-full flex flex-col items-center justify-between py-2">
                             <div className="w-full flex justify-between items-start">
                                <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                     table.statut === 'libre' ? 'bg-emerald-500/20 text-emerald-400' : isOccupee ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    {table.statut.replace('_', ' ')}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <Users size={12} />
                                    <span className="text-[10px] font-black">{table.capacite}</span>
                                </div>
                             </div>

                             <div className="flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                                     table.statut === 'libre' ? 'bg-white/5 text-slate-600' : isOccupee ? 'bg-indigo-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                                }`}>
                                    <LayoutGrid size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-display font-black text-white">{table.nom}</h3>
                             </div>

                             <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                                {isOccupee && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 2 }} className="w-1/2 h-full bg-indigo-500/50" />}
                             </div>
                          </div>

                          {commande && (
                            <div className="absolute top-7 right-7">
                                <span className="text-[9px] font-black text-indigo-400 flex items-center gap-1.5">
                                    <Clock size={10} strokeWidth={3} /> {minutesEcoulees(commande.dateOuverture)}M
                                </span>
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

  // Vue 2 : Nombre de Couverts
  if (etape === 'couverts') {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-white text-center selection:bg-indigo-500/30">
        <div className="fixed inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full" />
        </div>

        <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setEtape('tables')} 
            className="absolute top-10 left-10 py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Revenir au plan
        </motion.button>

        <motion.div 
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="max-w-xl w-full"
        >
          <div className="relative mb-12 inline-block">
            <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-28 h-28 rounded-[2.5rem] bg-slate-900 border border-indigo-500/30 flex items-center justify-center shadow-indigo-500/10 shadow-3xl">
                <Users size={56} className="text-indigo-400" />
            </div>
          </div>
          
          <h2 className="text-5xl font-display font-black mb-3 tracking-tighter text-white uppercase">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-16">Composition de la tablée</p>

          <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-12 mb-16 shadow-2xl backdrop-blur-xl group transition-all hover:bg-slate-900/60 hover:border-white/10">
            <div className="flex items-center justify-around gap-12">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))}
                  className="w-24 h-24 rounded-3xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all duration-300 shadow-inner"
                >
                  <Minus size={40} strokeWidth={2.5} />
                </motion.button>

                <div className="flex flex-col items-center px-8 relative">
                    <div className="absolute -top-12 -right-4 w-12 h-12 bg-indigo-500/10 blur-xl rounded-full" />
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={nombreCouverts}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-[160px] font-display font-black text-white leading-none tracking-tighter"
                        >
                            {nombreCouverts}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-xs font-black text-indigo-400 tracking-[0.6em] uppercase mt-2">Convives</span>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))}
                  className="w-24 h-24 rounded-3xl bg-indigo-600 shadow-indigo-500/30 shadow-2xl flex items-center justify-center text-white hover:bg-indigo-500 transition-all duration-300"
                >
                  <Plus size={40} strokeWidth={2.5} />
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
                toast.success('Session ouverte : Bon appétit ! 🍽️✨');
              } catch (err) {
                toast.error("Échec d'ouverture de session");
              }
            }}
            className="group w-full max-w-md mx-auto py-7 rounded-[2rem] bg-white text-slate-950 text-xl font-black uppercase tracking-[0.2em] shadow-3xl hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-5 ring-offset-4 ring-offset-slate-950 hover:ring-2 ring-white"
          >
            Lancer la commande <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Vue 3 : Prise de Commande
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Header Ultra-Premium */}
      <header className="sticky top-0 z-[60] bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 p-5 lg:px-12 safe-top">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEtape('tables')} 
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </motion.button>
              <div>
                <h2 className="font-display font-black text-3xl flex items-center gap-3 tracking-tighter uppercase">
                    {tableSelectionnee?.nom}
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-indigo-500 shadow-sm animate-pulse" />
                </h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black tracking-widest uppercase">
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-indigo-400" /> {commandeActive?.nombreCouverts} CLIENTS</span>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span>REF: #{commandeId?.slice(-4)}</span>
                </div>
              </div>
          </div>
          
          <div className="flex flex-col items-end">
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-1">TOTAL TABLE</span>
              <motion.div 
                key={commandeActive?.total}
                initial={{ scale: 1.1, color: '#818cf8' }}
                animate={{ scale: 1, color: '#fff' }}
                className="text-4xl font-display font-black text-white flex items-baseline gap-2"
              >
                 {commandeActive?.total.toLocaleString()} 
                 <span className="text-sm text-slate-500 font-bold">F</span>
              </motion.div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center gap-4 relative">
            <div className="flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x no-scrollbar">
                {categories.map(cat => (
                    <button
                    key={cat}
                    onClick={() => setCategorieActive(cat as string)}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap snap-start transition-all duration-500 border-2 ${
                        categorieActive === cat 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20 shadow-xl' 
                        : 'bg-white/[0.03] text-slate-500 border-transparent hover:border-white/10 hover:bg-white/[0.05]'
                    }`}
                    >
                    {cat}
                    </button>
                ))}
            </div>
            <div className="relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                    type="text"
                    placeholder="CHERCER UN ARTICLE..."
                    value={rechercheProduit}
                    onChange={(e) => setRechercheProduit(e.target.value)}
                    className="w-64 pl-12 pr-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-indigo-500/50 focus:bg-white/[0.05] outline-none text-[10px] font-black tracking-widest uppercase transition-all"
                />
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full px-6 pt-6">
        {/* Grille Produits */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-52 pr-2 custom-scrollbar no-scrollbar">
          <AnimatePresence mode="popLayout">
            {produitsFiltres.map((produit, idx) => (
              <motion.button
                key={produit.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  if (commandeId) {
                      ajouterLigne(commandeId, produit);
                      toast.success(`+1 ${produit.nom}`, { position: 'bottom-center', icon: '📝', duration: 1000 });
                  }
                }}
                className="group relative h-64 bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7 text-left hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all duration-500 shadow-2xl overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-bl-[4rem]" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity" />
                        <div className="relative w-16 h-16 rounded-[1.8rem] bg-slate-800/80 border border-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-2xl">
                            {produit.emoji}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white text-base leading-tight mb-3 group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-2">{produit.nom}</h4>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-display font-black text-white tracking-tighter">{produit.prix.toLocaleString()}<span className="text-[10px] text-slate-500 ml-1 font-bold">F</span></span>
                            
                            {produit.stockTotal <= produit.stockAlerte && (
                                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
                                    <AlertTriangle size={14} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Add Label */}
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                         <div className="bg-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1 shadow-lg shadow-indigo-600/40">
                             <Plus size={10} strokeWidth={4} /> AJOUTER
                         </div>
                    </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Le Panier Flottant "Magnétique" (Panel Commande) */}
        <AnimatePresence>
          {commandeActive && commandeActive.lignes.length > 0 && (
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-[100] p-6 lg:p-10 pointer-events-none"
            >
              <div className="w-full max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] shadow-3xl shadow-indigo-600/20 flex flex-col md:flex-row pointer-events-auto overflow-hidden max-h-[70vh] md:max-h-[500px]">
                
                {/* Left Side: Tickets List */}
                <div className="flex-1 flex flex-col border-r border-white/5 min-w-0">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
                            <ShoppingBag size={20} className="text-indigo-500" />
                            Contenu du Service
                        </h3>
                        <div className="bg-white/5 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                            {commandeActive.lignes.length} RÉFÉRENCES
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar no-scrollbar">
                        {commandeActive.lignes.map(ligne => (
                            <motion.div 
                                layout
                                key={ligne.id} 
                                className={`group flex items-center gap-5 p-5 rounded-[2rem] transition-all border ${
                                    ligne.statut === 'en_attente' ? 'bg-white/[0.03] border-white/5' : 'bg-slate-950/40 border-indigo-500/20 opacity-80'
                                }`}
                            >
                                <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-2xl p-2 shadow-2xl">
                                    <button 
                                        onClick={() => modifierQuantite(commandeId!, ligne.id, -1)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <span className="w-10 text-center font-display font-black text-2xl text-white">{ligne.quantite}</span>
                                    <button 
                                        onClick={() => modifierQuantite(commandeId!, ligne.id, 1)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                                            ligne.statut === 'en_attente' ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-700'
                                        }`}
                                    >
                                        <Plus size={14} strokeWidth={4} />
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{ligne.produitNom}</p>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5 uppercase">PU: {ligne.prixUnitaire.toLocaleString()} F</p>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <span className="font-display font-black text-xl text-white">{ligne.sousTotal.toLocaleString()} F</span>
                                    {ligne.statut === 'en_attente' ? (
                                        <button onClick={() => supprimerLigne(commandeId!, ligne.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    ) : (
                                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            ligne.statut === 'en_preparation' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            ligne.statut === 'pret' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-transparent'
                                        }`}>
                                            {ligne.statut.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Total & Actions */}
                <div className="w-full md:w-80 bg-slate-950 p-10 flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">RÉSUMÉ COMMANDE</span>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                <span>SOUS-TOTAL</span>
                                <span>{(commandeActive.total).toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                <span>SERVICE (0%)</span>
                                <span>0 F</span>
                            </div>
                            <div className="h-px bg-white/5 my-6" />
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">NET À PAYER</span>
                                <div className="text-4xl font-display font-black text-white">{(commandeActive.total).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                        if (commandeId) {
                            envoyerCuisine(commandeId);
                            toast.success('Envoyé ! 🍳⚡', { 
                                style: { background: '#0f172a', color: '#fff', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' } 
                            });
                        }
                        }}
                        disabled={!commandeActive.lignes.some(l => l.statut === 'en_attente')}
                        className="w-full mt-10 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 text-[11px] tracking-[0.4em] shadow-2xl shadow-indigo-600/40 transition-all uppercase"
                    >
                        <Send size={22} className="group-hover:-translate-y-1 transition-transform" /> ENVOYER
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .safe-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
};

const QuickStat = ({ label, valeur, color, icone }: any) => (
    <div className={`bg-slate-900/40 border border-${color}-500/10 rounded-2xl p-4 flex items-center gap-4 min-w-[160px] snap-start hover:border-${color}-500/30 transition-all`}>
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 shadow-lg`}>
            {icone}
        </div>
        <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-lg font-display font-black text-white">{valeur}</p>
        </div>
    </div>
);

export default InterfaceServeur;
