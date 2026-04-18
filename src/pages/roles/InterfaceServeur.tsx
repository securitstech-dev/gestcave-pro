import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft, Star,
  ShieldCheck, Crown, User, Search, Receipt,
  ClipboardList, CreditCard, ChevronDown, History, Trash2,
  MoreVertical, Power, RefreshCcw, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Produit, TablePlan, Commande, LigneCommande } from '../../store/posStore';

const InterfaceServeur = () => {
  const { 
    tables, produits, commandes, 
    ouvrirTable, ajouterLigne, modifierQuantite, 
    supprimerLigne, envoyerCuisine, annulerCommande 
  } = usePOSStore();
  
  const { nomEmploye, etablissementId, quitterPoste } = usePosteSession();
  const navigate = useNavigate();
  
  const [etape, setEtape] = useState<'tables' | 'couverts' | 'commande'>('tables');
  const [tableSelectionnee, setTableSelectionnee] = useState<TablePlan | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [nombreCouverts, setNombreCouverts] = useState(1);
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [categorieActive, setCategorieActive] = useState<string>('');
  const [showTableActions, setShowTableActions] = useState<string | null>(null);
  
  // Initialisation de la catégorie active
  useEffect(() => {
    if (produits.length > 0 && !categorieActive) {
      const cats = [...new Set(produits.filter(p => !p.is_ingredient).map(p => p.sousCategorie || p.categorie))];
      if (cats.length > 0) setCategorieActive(cats[0] as string);
    }
  }, [produits, categorieActive]);

  const commandeActive = useMemo(() => 
    commandes.find(c => c.id === commandeId),
    [commandes, commandeId]
  );

  const categories = useMemo(() => 
    [...new Set(produits.filter(p => !p.is_ingredient).map(p => p.sousCategorie || p.categorie))],
    [produits]
  );
  
  const produitsFiltres = useMemo(() => 
    produits.filter(p => 
      !p.is_ingredient &&
      (p.sousCategorie || p.categorie) === categorieActive &&
      (p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()))
    ),
    [produits, categorieActive, rechercheProduit]
  );

  // Groupement par tournées pour l'affichage de droite
  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    
    (commandeActive.lignes || []).forEach(ligne => {
      if (ligne.heureEnvoi) {
        if (!groups[ligne.heureEnvoi]) groups[ligne.heureEnvoi] = [];
        groups[ligne.heureEnvoi].push(ligne);
      }
    });

    return Object.entries(groups).map(([time, items]) => ({
      time,
      items,
      total: items.reduce((sum, item) => sum + item.sousTotal, 0)
    })).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [commandeActive]);

  // Articles en attente (panier actuel)
  const panierActuel = useMemo(() => 
    commandeActive?.lignes.filter(l => !l.heureEnvoi) || [],
    [commandeActive]
  );

  // --- ACTIONS ---
  const handleFermerTable = async (cId: string) => {
    if (window.confirm("IMPORTANT: Cette action va annuler toutes les consommations non payées et libérer la table. Confirmer ?")) {
      try {
        const toastId = toast.loading("Nettoyage de la table...");
        await annulerCommande(cId);
        toast.success("Table libérée avec succès !", { id: toastId });
        
        // Reset local states
        setCommandeId(null);
        setTableSelectionnee(null);
        setEtape('tables');
        setShowTableActions(null);
      } catch (err) {
        console.error(err);
        toast.error("Erreur technique lors de la libération.");
      }
    }
  };

  // --- RENDU : SELECTION TABLES ---
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip', 'comptoir'] as const;
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 pb-20">
        {/* Top bar Premium Apple-style */}
        <header className="px-4 py-1.5 bg-white/80 backdrop-blur-3xl sticky top-0 z-[60] border-b border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-1.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-white shadow-lg transform rotate-2">
              <LayoutGrid size={14} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-slate-950 leading-tight">SERVICE</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{nomEmploye}</p>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={quitterPoste}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-slate-100 text-slate-700 font-black text-[8px] uppercase tracking-widest hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-500 shadow-md shadow-slate-200/50"
          >
            <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" />
            Sortie
          </motion.button>
        </header>

        <main className="max-w-full mx-auto p-3 lg:p-4">
          {/* Stats Glassmorphism cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <StatPill label="Occupées" valeur={tables.filter(t => t.statut === 'occupee').length} color="blue" icon={<Users size={12} />} />
            <StatPill label="Libres" valeur={tables.filter(t => t.statut === 'libre').length} color="emerald" icon={<CheckCircle2 size={12} />} />
            <StatPill label="Paiement" valeur={tables.filter(t => t.statut === 'en_attente_paiement').length} color="amber" icon={<Receipt size={12} />} />
            <StatPill label="Couverts" valeur={commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + (c.nombreCouverts || 1), 0)} color="indigo" icon={<Star size={12} />} />
          </div>

          {zones.map((zone) => {
            const tablesZone = tables.filter(t => t.zone === zone);
            if (!tablesZone.length) return null;
            return (
              <section key={zone} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">{zone}</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full" />
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                  {tablesZone.map(table => {
                    const commande = commandes.find(c => c.id === table.commandeActiveId);
                    const isOccupee = table.statut === 'occupee';
                    const isWaitingPay = table.statut === 'en_attente_paiement';
                    
                    return (
                      <div key={table.id} className="relative group/table">
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (showTableActions) return setShowTableActions(null);
                            setTableSelectionnee(table);
                            if (table.statut === 'libre') {
                              setEtape('couverts');
                            } else if (table.commandeActiveId) {
                              setCommandeId(table.commandeActiveId);
                              setEtape('commande');
                            }
                          }}
                          className={`w-full aspect-square rounded-xl p-1.5 transition-all duration-700 flex flex-col items-center justify-between border-2 overflow-hidden shadow-lg relative ${
                            table.statut === 'libre' 
                              ? 'bg-white border-slate-50 hover:border-emerald-200 hover:shadow-emerald-500/10 shadow-slate-200/30' 
                              : isOccupee
                              ? 'bg-slate-950 border-slate-950 shadow-slate-950/40 text-white'
                              : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-amber-500/10'
                          }`}
                        >
                          {/* Inner effects for occupied tables */}
                          {isOccupee && (
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-40 pointer-events-none" />
                          )}

                          <div className={`text-[8px] font-black uppercase tracking-[0.4em] relative z-10 transition-colors duration-500 ${
                            isOccupee ? 'text-slate-500' : isWaitingPay ? 'text-amber-600' : 'text-slate-300'
                          }`}>
                            {table.statut.replace('_', ' ')}
                          </div>

                          <div className="text-center relative z-10">
                             <h3 className={`text-xl font-black mb-0.5 tracking-tighter transition-colors duration-700 ${isOccupee ? 'text-white' : 'text-slate-950'}`}>
                               {table.nom.split(' ')[1] || table.nom}
                             </h3>
                             <AnimatePresence>
                               {isOccupee && commande && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="text-emerald-400 font-extrabold text-lg tracking-tight mt-2 flex items-center justify-center gap-2"
                                  >
                                      {(commande.total || 0).toLocaleString()} <span className="text-xs opacity-60">F</span>
                                  </motion.div>
                               )}
                             </AnimatePresence>
                          </div>

                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg relative z-10 transition-all duration-700 ${isOccupee ? 'bg-white/10 backdrop-blur-2xl border border-white/5' : 'bg-slate-100/50'}`}>
                              <Users size={10} className={isOccupee ? 'text-slate-400' : 'text-slate-400'} />
                              <span className={`text-[8px] font-black tracking-tight ${isOccupee ? 'text-slate-200' : 'text-slate-600'}`}>
                                {table.capacite} PL.
                              </span>
                          </div>

                          {isOccupee && (
                            <div className="absolute top-10 right-10">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981]" />
                            </div>
                          )}
                        </motion.button>

                        {/* More Menu Trigger (Vertical 3 dots) */}
                        {(isOccupee || isWaitingPay) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTableActions(showTableActions === table.id ? null : table.id);
                            }}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-20 ${isOccupee ? 'text-white/20 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-200'}`}
                          >
                            <MoreVertical size={18} />
                          </button>
                        )}

                        {/* Floating Actions Popover */}
                        <AnimatePresence>
                          {showTableActions === table.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.85, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85, y: 15 }}
                              className="absolute top-24 right-0 w-72 bg-white rounded-[2.5rem] shadow-[0_50px_80px_-20px_rgba(0,0,0,0.4)] border border-slate-100 z-[70] p-4 flex flex-col gap-2"
                            >
                                <button 
                                  onClick={() => {
                                      setTableSelectionnee(table);
                                      setCommandeId(table.commandeActiveId || '');
                                      setEtape('commande');
                                      setShowTableActions(null);
                                  }}
                                  className="w-full flex items-center gap-5 p-5 hover:bg-slate-50 rounded-[1.8rem] transition-all group text-left"
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <Utensils size={20} />
                                  </div>
                                  <span className="text-[13px] font-black text-slate-950 uppercase tracking-widest leading-none">Ajouter Articles</span>
                                </button>
                                
                                <div className="h-px bg-slate-100 mx-4 my-1" />
                                
                                <button 
                                  onClick={() => handleFermerTable(table.commandeActiveId || '')}
                                  className="w-full flex items-center gap-5 p-5 hover:bg-rose-50 rounded-[1.8rem] transition-all group text-left"
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                                    <Power size={20} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-rose-600 uppercase tracking-widest leading-none">Libérer Table</span>
                                    <span className="text-[9px] font-bold text-rose-300 uppercase tracking-widest mt-1">Annuler service</span>
                                  </div>
                                </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    );
  }

  // --- RENDU : NOMBRE DE COUVERTS (Etape 2) ---
  if (etape === 'couverts') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden font-sans tracking-tight">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#e2e8f0,transparent)] opacity-60" />
        
        <motion.button 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setEtape('tables')} 
          className="absolute top-8 left-8 p-4 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-950 shadow-xl shadow-slate-200/40 transition-all flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform duration-500" /> 
          Changer de table
        </motion.button>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="max-w-2xl w-full text-center relative z-10 px-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto mb-8 shadow-2xl transform -rotate-12 border-4 border-white relative">
              <Users size={32} className="text-white" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-indigo-500 shadow-xl flex items-center justify-center border-2 border-white animate-bounce">
                <Plus size={16} className="text-white" />
              </div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-black mb-2 text-slate-950 tracking-tighter uppercase leading-[0.8]">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-400 font-extrabold uppercase tracking-[0.4em] text-[12px] mb-12">Nombre de convives ?</p>

          <div className="bg-white border-2 border-slate-50 rounded-3xl p-4 mb-8 shadow-lg flex items-center justify-between">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))} 
                  className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all shadow-sm"
                >
                  <Minus size={24} />
                </motion.button>
                
                <div className="flex flex-col items-center min-w-[120px]">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={nombreCouverts}
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.5, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-5xl font-black text-slate-950 leading-none tracking-tighter"
                      >
                        {nombreCouverts}
                      </motion.span>
                    </AnimatePresence>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))} 
                  className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-white hover:bg-indigo-600 shadow-xl shadow-slate-950/20 transition-all border-4 border-white/10"
                >
                  <Plus size={24} />
                </motion.button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const toastId = toast.loading("Ouverture...");
                const id = await ouvrirTable(tableSelectionnee.id, etablissementId || 'srv', nomEmploye, nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success('Session ouverte ! 🥂', { id: toastId });
              } catch (err) {
                toast.error("Échec lors de l'ouverture.");
              }
            }}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black uppercase tracking-[0.3em] text-[13px] shadow-xl flex items-center justify-center gap-4 group transition-all duration-500"
          >
            Commencer le Service <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform duration-700" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- RENDU : PRISE DE COMMANDE (Etape 3) ---
  return (
    <div className="h-screen bg-white flex flex-col text-slate-950 overflow-hidden font-sans tracking-tight selection:bg-indigo-100">
      {/* Header Premium de Service */}
      <header className="h-8 bg-white border-b border-slate-100 px-3 flex items-center justify-between flex-shrink-0 z-[60] shadow-sm relative">
          <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEtape('tables')} 
                className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-950 hover:border-slate-950 transition-all shadow-md group"
              >
                  <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
              <div className="h-8 w-[1.5px] bg-slate-100 hidden md:block" />
              <div>
                  <h2 className="font-black text-md uppercase tracking-tighter leading-none text-slate-950">{tableSelectionnee?.nom}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[7px] font-black text-white uppercase tracking-widest">{commandeActive?.nombreCouverts} C.</span>
                    <div className="flex items-center gap-1">
                       <Clock size={8} className="text-slate-300" />
                       <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">{commandeActive ? new Date(commandeActive.dateOuverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                    </div>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <button 
                onClick={() => handleFermerTable(commandeId!)}
                className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border-2 border-rose-100 text-rose-600 font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-500 shadow-sm"
              >
                <Power size={14} /> Annuler Table
              </button>
              
              <div className="bg-slate-50 px-3 py-1 rounded-lg border-2 border-slate-100 text-right shadow-inner flex flex-col justify-center min-w-[100px]">
                  <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Total</p>
                  <p className="font-black text-slate-950 text-md leading-none tracking-tighter">{(commandeActive?.total || 0).toLocaleString()} <span className="text-[8px] opacity-20 ml-0.5">F</span></p>
              </div>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* GRILLE PRODUITS (ZONE GAUCHE) */}
        <div className="flex-1 flex flex-col border-r-2 border-slate-50 bg-[#fbfbfb]">
            {/* Barre de Recherche Premium */}
            <div className="p-3 space-y-3 bg-white border-b border-slate-100">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategorieActive(cat as string)}
                            className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-700 border-2 shadow-sm ${
                                categorieActive === cat 
                                ? 'bg-slate-950 text-white border-slate-950 shadow-lg' 
                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-950'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors duration-500 group-focus-within/search:text-slate-950 group-focus-within/search:scale-110" size={16} />
                    <input 
                      type="text"
                      placeholder="Trouver un article..."
                      value={rechercheProduit}
                      onChange={(e) => setRechercheProduit(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 pl-12 pr-4 text-xs font-bold text-slate-950 placeholder:text-slate-300 placeholder:font-black focus:bg-white focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 outline-none transition-all duration-500"
                    />
                </div>
            </div>

            {/* Grille des Articles Premium Card View */}
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 no-scrollbar pb-20">
                {produitsFiltres.length === 0 && (
                   <div className="col-span-full py-40 text-center">
                       <div className="w-32 h-32 rounded-[3.5rem] bg-slate-100 flex items-center justify-center mx-auto mb-10 overflow-hidden">
                          <Search size={48} className="text-slate-300 animate-pulse" />
                       </div>
                       <p className="font-black text-slate-400 uppercase tracking-[0.5em] text-[13px] mb-2 leading-loose">Aucun résultat pour cette recherche</p>
                       <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Réessayez avec un autre nom</p>
                   </div>
                )}
                
                {produitsFiltres.map((produit) => {
                    const qteDansPanier = panierActuel.find(l => l.produitId === produit.id)?.quantite || 0;
                    return (
                        <motion.button
                            key={produit.id}
                            whileHover={{ y: -1, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={produit.stockTotal <= 0}
                            onClick={() => ajouterLigne(commandeId!, produit)}
                            className={`group relative bg-white border-2 rounded-xl p-1.5 text-left transition-all duration-700 shadow-md relative ${
                                qteDansPanier > 0 ? 'border-indigo-600 shadow-indigo-600/5' : 'border-white hover:border-slate-950 shadow-slate-200/30'
                            } ${produit.stockTotal <= 0 ? 'opacity-40 grayscale grayscale-[0.8] cursor-not-allowed' : ''}`}
                        >
                            {/* Stock Info Badge */}
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all duration-700 ${
                                produit.stockTotal <= 0 ? 'bg-rose-600 text-white border-rose-600 shadow-lg' :
                                produit.stockTotal <= 5 ? 'bg-white text-rose-600 border-rose-100 animate-pulse' :
                                'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950'
                            }`}>
                                {produit.stockTotal <= 0 ? 'RUPTURE' : `${produit.stockTotal} ${produit.unite || 'U'}`}
                            </div>

                            {/* Cart Counter Overlay */}
                            <AnimatePresence>
                              {qteDansPanier > 0 && (
                                <motion.div 
                                  initial={{ scale: 0, rotate: -45 }} 
                                  animate={{ scale: 1, rotate: 0 }} 
                                  className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xl z-10 border-4 border-white"
                                >
                                  {qteDansPanier}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex flex-col h-full justify-between pt-1">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-lg mb-1 shadow-inner group-hover:scale-110 transition-transform duration-700 group-hover:rotate-6 group-hover:bg-white group-hover:shadow-lg">
                                    {produit.emoji || '🍹'}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-950 text-[10px] leading-tight mb-0.5 uppercase tracking-tighter line-clamp-2 min-h-[24px]">{produit.nom}</h4>
                                    <div className="flex items-end justify-between mt-auto">
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-950 tracking-tighter leading-none">{(produit.prix || 0).toLocaleString()} F</span>
                                      </div>
                                      <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                        <Plus size={12} />
                                      </div>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
        </div>
        </div>

        {/* SIDEBAR DE COMMANDE - COL DROITE */}
        <aside className={`${commandeActive ? 'hidden md:flex' : 'flex'} w-full md:w-[190px] bg-white border-l border-slate-200 flex-col shadow-xl z-20`}>
            {/* Panier Actuel (Non envoyé) */}
            <div className="p-3 border-b border-slate-100 bg-[#fdfdfd]">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-950 text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={12} className="text-indigo-600" /> Panier
                    </h3>
                    <div className="px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[6px] uppercase tracking-widest border border-indigo-100">
                        {panierActuel.length}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                <AnimatePresence mode="popLayout">
                    {panierActuel.map(l => (
                        <motion.div 
                            key={l.id} 
                            layout 
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            exit={{ x: -20, opacity: 0 }}
                            className="group flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5 hover:bg-white hover:shadow-md transition-all duration-300"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                                 🍹
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-black text-slate-950 text-[10px] uppercase truncate tracking-tighter leading-none">{l.produitNom}</h5>
                                <p className="text-[9px] font-bold text-slate-400">{(l.sousTotal || 0).toLocaleString()} F</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg p-1">
                                <button onClick={() => modifierQuantite(commandeId!, l.id, -1)} className="w-5 h-5 rounded-md flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-600"><Minus size={10} /></button>
                                <span className="w-4 text-center font-black text-[10px] text-slate-950">{l.quantite}</span>
                                <button onClick={() => modifierQuantite(commandeId!, l.id, 1)} className="w-5 h-5 rounded-md flex items-center justify-center text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"><Plus size={10} /></button>
                            </div>
                            <button onClick={() => supprimerLigne(commandeId!, l.id)} className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors"><X size={14} /></button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {panierActuel.length === 0 && (
                    <div className="py-10 text-center flex flex-col items-center opacity-20">
                        <Utensils size={32} className="mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Panier vide</p>
                    </div>
                )}
            </div>

            {/* Historique des consommations */}
            <div className="h-[200px] overflow-y-auto p-3 bg-[#f9f9f9] border-t-2 border-slate-100 no-scrollbar">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">SERVI</h3>
                  <div className="h-[1px] flex-1 bg-slate-200" />
                </div>
                
                <div className="space-y-4">
                    {tournees.map((tournee, idx) => (
                        <div key={idx} className="relative pl-6">
                            <div className="absolute left-1 top-2 bottom-0 w-[1px] bg-slate-200" />
                            <div className="absolute left-0 top-0 w-2 h-2 rounded-full bg-slate-300" />
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Tournée {tournees.length - idx}</span>
                                <span className="text-[10px] font-black text-slate-950">{(tournee.total || 0).toLocaleString()} F</span>
                            </div>
                            <div className="space-y-1">
                                {tournee.items.map(l => (
                                    <div key={l.id} className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                                        <span>{l.quantite}x {l.produitNom}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {tournees.length === 0 && (
                        <div className="text-center py-10 opacity-30">
                             <Receipt size={32} className="mx-auto text-slate-200 mb-4" />
                             <p className="text-slate-400 font-black uppercase text-[8px] tracking-[0.3em]">Addition vierge</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Sidebar Actions */}
            <div className="p-3 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Addition</p>
                    <p className="text-lg font-black text-white tracking-tighter">{(commandeActive?.total || 0).toLocaleString()} <span className="text-[8px] opacity-40 ml-1">F</span></p>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={panierActuel.length === 0}
                    onClick={() => {
                        if (commandeId) {
                            try {
                                envoyerCuisine(commandeId);
                                toast.success('Commande envoyée !');
                            } catch (e) {
                                toast.error("Erreur d'envoi");
                            }
                        }
                    }}
                    className="w-full h-10 rounded-xl bg-white text-slate-950 font-black uppercase tracking-widest text-[9px] shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 active:scale-95 disabled:opacity-20"
                >
                    Envoyer Commande <Send size={12} />
                </motion.button>
            </div>
        </aside>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// --- COMPOSANTS INTERNES RÉUTILISABLES ---

const StatPill = ({ label, valeur, color, icon }: any) => {
    const colorMap: any = {
        blue: "bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-indigo-500/10",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/50 shadow-emerald-500/10",
        amber: "bg-amber-50 text-amber-600 border-amber-200/50 shadow-amber-500/10",
        indigo: "bg-violet-50 text-violet-600 border-violet-200/50 shadow-violet-500/10",
        rose: "bg-rose-50 text-rose-600 border-rose-200/50 shadow-rose-500/10"
    };

    return (
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-white border-2 border-slate-50 rounded-xl p-2 flex items-center gap-2 shadow-md shadow-slate-200/50 transition-all duration-700 group cursor-default"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-6 border-2 shadow-sm ${colorMap[color] || 'bg-slate-50'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] mb-0.5">{label}</p>
                <div className="flex items-baseline">
                  <span className="text-lg font-black text-slate-950 tracking-tighter leading-none">{valeur}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default InterfaceServeur;
