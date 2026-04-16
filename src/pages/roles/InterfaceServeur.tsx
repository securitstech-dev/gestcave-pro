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
      const cats = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
      if (cats.length > 0) setCategorieActive(cats[0] as string);
    }
  }, [produits, categorieActive]);

  const commandeActive = useMemo(() => 
    commandes.find(c => c.id === commandeId),
    [commandes, commandeId]
  );

  const categories = useMemo(() => 
    [...new Set(produits.map(p => p.sousCategorie || p.categorie))],
    [produits]
  );
  
  const produitsFiltres = useMemo(() => 
    produits.filter(p => 
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
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 pb-20">
        {/* Top bar Premium Apple-style */}
        <header className="px-10 py-8 bg-white/80 backdrop-blur-3xl sticky top-0 z-[60] border-b border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-[1.8rem] bg-slate-950 flex items-center justify-center text-white shadow-2xl shadow-slate-950/20 transform rotate-2">
              <LayoutGrid size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-950 leading-tight">GESTCAVE SERVEUR</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{nomEmploye} • TERMINAL DE SERVICE</p>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={quitterPoste}
            className="group flex items-center gap-4 px-8 py-4 rounded-[1.5rem] bg-white border-2 border-slate-100 text-slate-700 font-black text-[12px] uppercase tracking-widest hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-500 shadow-xl shadow-slate-200/50"
          >
            <LogOut size={18} className="group-hover:-translate-x-2 transition-transform" />
            Déconnexion
          </motion.button>
        </header>

        <main className="max-w-[1700px] mx-auto p-10 lg:p-16">
          {/* Stats Glassmorphism cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-24">
            <StatPill label="Tables Occupées" valeur={tables.filter(t => t.statut === 'occupee').length} color="blue" icon={<Users size={24} />} />
            <StatPill label="Tables Libres" valeur={tables.filter(t => t.statut === 'libre').length} color="emerald" icon={<CheckCircle2 size={24} />} />
            <StatPill label="Attente Encaissement" valeur={tables.filter(t => t.statut === 'en_attente_paiement').length} color="amber" icon={<Receipt size={24} />} />
            <StatPill label="Couverts Actifs" valeur={commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + (c.nombreCouverts || 1), 0)} color="indigo" icon={<Star size={24} />} />
          </div>

          {zones.map((zone) => {
            const tablesZone = tables.filter(t => t.zone === zone);
            if (!tablesZone.length) return null;
            return (
              <section key={zone} className="mb-28">
                <div className="flex items-center gap-10 mb-14">
                  <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] whitespace-nowrap">{zone === 'salle' ? 'ZONE SALLE INTERIEURE' : zone === 'terrasse' ? 'TERRASSE & JARDIN' : 'SALONS PRIVÉS VIP'}</h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12">
                  {tablesZone.map(table => {
                    const commande = commandes.find(c => c.id === table.commandeActiveId);
                    const isOccupee = table.statut === 'occupee';
                    const isWaitingPay = table.statut === 'en_attente_paiement';
                    
                    return (
                      <div key={table.id} className="relative group/table">
                        <motion.button
                          whileHover={{ y: -12, scale: 1.03 }}
                          whileTap={{ scale: 0.94 }}
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
                          className={`w-full aspect-[4/5] rounded-[3.5rem] p-9 transition-all duration-700 flex flex-col items-center justify-between border-[3px] overflow-hidden shadow-2xl relative ${
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

                          <div className={`text-[11px] font-black uppercase tracking-[0.4em] relative z-10 transition-colors duration-500 ${
                            isOccupee ? 'text-slate-500' : isWaitingPay ? 'text-amber-600' : 'text-slate-300'
                          }`}>
                            {table.statut.replace('_', ' ')}
                          </div>

                          <div className="text-center relative z-10">
                             <h3 className={`text-4xl lg:text-5xl font-black mb-2 tracking-tighter transition-colors duration-700 ${isOccupee ? 'text-white' : 'text-slate-950'}`}>
                               {table.nom}
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

                          <div className={`flex items-center gap-3 px-6 py-3 rounded-3xl relative z-10 transition-all duration-700 ${isOccupee ? 'bg-white/10 backdrop-blur-2xl border border-white/5' : 'bg-slate-100/50'}`}>
                              <Users size={16} className={isOccupee ? 'text-slate-400' : 'text-slate-400'} />
                              <span className={`text-[12px] font-black tracking-tight ${isOccupee ? 'text-slate-200' : 'text-slate-600'}`}>
                                {table.capacite} PLACES
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
                            className={`absolute top-8 right-8 p-3 rounded-2xl transition-all z-20 ${isOccupee ? 'text-white/20 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-200'}`}
                          >
                            <MoreVertical size={24} />
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-12 overflow-hidden font-sans tracking-tight">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#e2e8f0,transparent)] opacity-60" />
        
        <motion.button 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setEtape('tables')} 
          className="absolute top-16 left-16 p-8 rounded-[2.5rem] bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-950 shadow-2xl shadow-slate-200/40 transition-all flex items-center gap-5 text-[14px] font-black uppercase tracking-[0.2em] group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-3 transition-transform duration-500" /> 
          Changer de table
        </motion.button>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="max-w-2xl w-full text-center relative z-10 px-8"
        >
          <div className="w-36 h-36 rounded-[4rem] bg-slate-950 flex items-center justify-center mx-auto mb-16 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] transform -rotate-12 border-[6px] border-white relative">
              <Users size={60} className="text-white" />
              <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-indigo-500 shadow-xl flex items-center justify-center border-4 border-white animate-bounce">
                <Plus size={24} className="text-white" />
              </div>
          </div>
          
          <h2 className="text-8xl lg:text-9xl font-black mb-6 text-slate-950 tracking-tighter uppercase leading-[0.8]">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-400 font-extrabold uppercase tracking-[0.6em] text-[15px] mb-20">Combien seront-ils à table ?</p>

          <div className="bg-white border-4 border-slate-50 rounded-[6rem] p-16 mb-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] flex items-center justify-between">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))} 
                  className="w-32 h-32 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all shadow-sm"
                >
                  <Minus size={48} />
                </motion.button>
                
                <div className="flex flex-col items-center min-w-[200px]">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={nombreCouverts}
                        initial={{ scale: 0.5, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.5, opacity: 0, y: -40 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-[13rem] font-black text-slate-950 leading-none tracking-tighter"
                      >
                        {nombreCouverts}
                      </motion.span>
                    </AnimatePresence>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))} 
                  className="w-32 h-32 rounded-full bg-slate-950 flex items-center justify-center text-white hover:bg-indigo-600 shadow-2xl shadow-slate-950/30 transition-all border-4 border-white/10"
                >
                  <Plus size={48} />
                </motion.button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const toastId = toast.loading("Ouverture en cours...");
                const id = await ouvrirTable(tableSelectionnee.id, etablissementId || 'srv', nomEmploye, nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success('Session ouverte ! 🥂', { id: toastId });
              } catch (err) {
                toast.error("Échec lors de l'ouverture.");
              }
            }}
            className="w-full h-32 rounded-[3.5rem] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black uppercase tracking-[0.5em] text-[16px] shadow-[0_35px_70px_-15px_rgba(79,70,229,0.4)] flex items-center justify-center gap-8 group transition-all duration-500"
          >
            Commencer le Service <ChevronRight size={32} className="group-hover:translate-x-4 transition-transform duration-700" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- RENDU : PRISE DE COMMANDE (Etape 3) ---
  return (
    <div className="h-screen bg-white flex flex-col text-slate-950 overflow-hidden font-sans tracking-tight selection:bg-indigo-100">
      {/* Header Premium de Service */}
      <header className="h-32 bg-white border-b border-slate-100 px-16 flex items-center justify-between flex-shrink-0 z-[60] shadow-sm relative">
          <div className="flex items-center gap-12">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEtape('tables')} 
                className="w-20 h-20 rounded-[2rem] bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-950 hover:border-slate-950 transition-all shadow-md group"
              >
                  <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
              </motion.button>
              <div className="h-16 w-[1.5px] bg-slate-100 hidden md:block" />
              <div>
                  <h2 className="font-black text-5xl uppercase tracking-tighter leading-none text-slate-950">{tableSelectionnee?.nom}</h2>
                  <div className="flex items-center gap-5 mt-3">
                    <span className="px-4 py-1.5 rounded-xl bg-slate-950 text-[11px] font-black text-white uppercase tracking-widest">{commandeActive?.nombreCouverts} CONVIVES</span>
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-slate-300" />
                       <span className="text-[12px] text-slate-400 font-extrabold uppercase tracking-widest">{commandeActive ? new Date(commandeActive.dateOuverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                    </div>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-8">
              <button 
                onClick={() => handleFermerTable(commandeId!)}
                className="hidden xl:flex items-center gap-4 px-10 py-6 rounded-[2rem] bg-rose-50 border-2 border-rose-100 text-rose-600 font-black text-[12px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-500 shadow-sm"
              >
                <Power size={22} /> Annuler Table
              </button>
              
              <div className="bg-slate-50 px-12 py-6 rounded-[2.5rem] border-2 border-slate-100 text-right shadow-inner flex flex-col justify-center min-w-[240px]">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1.5">Addition Courante</p>
                  <p className="font-black text-slate-950 text-4xl leading-none tracking-tighter">{(commandeActive?.total || 0).toLocaleString()} <span className="text-[14px] opacity-20 ml-1">F CFA</span></p>
              </div>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* GRILLE PRODUITS (ZONE GAUCHE) */}
        <div className="flex-1 flex flex-col border-r-2 border-slate-50 bg-[#fbfbfb]">
            {/* Barre de Recherche Premium */}
            <div className="p-10 space-y-8 bg-white border-b border-slate-100">
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategorieActive(cat as string)}
                            className={`px-12 py-6 rounded-[1.8rem] text-[12px] font-black uppercase tracking-[0.25em] whitespace-nowrap transition-all duration-700 border-[3px] shadow-sm ${
                                categorieActive === cat 
                                ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-950/30 scale-105' 
                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-950'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative group/search">
                    <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 transition-colors duration-500 group-focus-within/search:text-slate-950 group-focus-within/search:scale-110" size={30} />
                    <input 
                      type="text"
                      placeholder="Trouver un article dans le catalogue..."
                      value={rechercheProduit}
                      onChange={(e) => setRechercheProduit(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] py-8 pl-24 pr-12 text-lg font-bold text-slate-950 placeholder:text-slate-300 placeholder:font-black focus:bg-white focus:ring-[15px] focus:ring-slate-950/5 focus:border-slate-950 outline-none transition-all duration-500"
                    />
                </div>
            </div>

            {/* Grille des Articles Premium Card View */}
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 no-scrollbar pb-40">
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
                            whileHover={{ y: -10, scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            disabled={produit.stockTotal <= 0}
                            onClick={() => ajouterLigne(commandeId!, produit)}
                            className={`group relative bg-white border-[3px] rounded-[4rem] p-10 text-left transition-all duration-700 shadow-2xl relative ${
                                qteDansPanier > 0 ? 'border-indigo-600 shadow-indigo-600/10' : 'border-white hover:border-slate-950 shadow-slate-200/50'
                            } ${produit.stockTotal <= 0 ? 'opacity-40 grayscale grayscale-[0.8] cursor-not-allowed' : ''}`}
                        >
                            {/* Stock Info Badge */}
                            <div className={`absolute top-8 right-8 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all duration-700 ${
                                produit.stockTotal <= 0 ? 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-600/20' :
                                produit.stockTotal <= 5 ? 'bg-white text-rose-600 border-rose-100 animate-pulse' :
                                'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950'
                            }`}>
                                {produit.stockTotal <= 0 ? 'RUPTURE' : `${produit.stockTotal} ${produit.unite || 'UNIT.'}`}
                            </div>

                            {/* Cart Counter Overlay */}
                            <AnimatePresence>
                              {qteDansPanier > 0 && (
                                <motion.div 
                                  initial={{ scale: 0, rotate: -45 }} 
                                  animate={{ scale: 1, rotate: 0 }} 
                                  className="absolute -top-6 -left-6 w-16 h-16 rounded-[1.8rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/40 z-10 border-[8px] border-white"
                                >
                                  {qteDansPanier}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex flex-col h-full justify-between pt-6">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-6xl mb-12 shadow-inner group-hover:scale-110 transition-transform duration-700 group-hover:rotate-12 group-hover:bg-white group-hover:shadow-2xl">
                                    {produit.emoji || '🍹'}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-950 text-[18px] leading-[1.2] mb-4 uppercase tracking-tighter line-clamp-2 min-h-[44px]">{produit.nom}</h4>
                                    <div className="flex items-end justify-between mt-auto">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 opacity-60">Tarif établissement</span>
                                        <span className="text-[1.8rem] font-black text-slate-950 tracking-tighter leading-none">{(produit.prix || 0).toLocaleString()} <span className="text-[14px] opacity-20">F</span></span>
                                      </div>
                                      <div className="w-16 h-16 rounded-[1.6rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100 group-hover:border-slate-950 group-hover:-translate-y-2">
                                        <Plus size={28} />
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
        <aside className="w-[600px] bg-white flex flex-col shadow-[-50px_0_120px_rgba(0,0,0,0.06)] z-50">
            {/* Zone de Validation (Shopping Cart UI) */}
            <div className="p-14 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.5em] flex items-center gap-6">
                        <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping shadow-[0_0_10px_#4f46e5]" />
                        TOURNEE ACTUELLE
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="bg-slate-950 text-white text-[11px] font-black px-6 py-2.5 rounded-[1.2rem] uppercase tracking-[0.1em] shadow-lg shadow-slate-900/30">{panierActuel.length} ARTICLES</span>
                      {panierActuel.length > 0 && (
                        <motion.button 
                          whileTap={{ rotate: 180 }}
                          onClick={() => { if(window.confirm("Voulez-vous vider le panier actuel ?")) panierActuel.forEach(l => supprimerLigne(commandeId!, l.id)) }} 
                          className="p-4 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all duration-500"
                        >
                          <RefreshCcw size={18} />
                        </motion.button>
                      )}
                    </div>
                </div>

                <div className="space-y-6 max-h-[420px] overflow-y-auto pr-4 no-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {panierActuel.map(l => (
                            <motion.div 
                                key={l.id} layout initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -150, opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-8 p-8 bg-white rounded-[3.5rem] border-4 border-slate-50 shadow-sm hover:shadow-xl hover:border-slate-100 transition-all duration-500"
                            >
                                <div className="flex items-center gap-6 bg-slate-950 rounded-[2rem] p-3 border border-slate-800 shadow-2xl min-w-[160px] justify-between">
                                    <button onClick={() => modifierQuantite(commandeId!, l.id, -1)} className="w-12 h-12 flex items-center justify-center text-white/30 hover:text-white transition-all bg-white/5 rounded-2xl"><Minus size={22} /></button>
                                    <span className="w-10 text-center font-black text-white text-3xl tracking-tighter">{l.quantite}</span>
                                    <button onClick={() => modifierQuantite(commandeId!, l.id, 1)} className="w-12 h-12 flex items-center justify-center text-white/30 hover:text-white transition-all bg-white/5 rounded-2xl"><Plus size={22} /></button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-[17px] font-black text-slate-950 uppercase truncate mb-1.5 tracking-tighter leading-none">{l.produitNom}</h5>
                                    <p className="text-[11px] text-slate-400 font-black tracking-widest uppercase">{(l.prixUnitaire || 0).toLocaleString()} F <span className="opacity-40">/ Unité</span></p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="font-black text-slate-950 text-[1.4rem] tracking-tighter leading-none">{(l.sousTotal || 0).toLocaleString()} <span className="text-[10px] opacity-20">F</span></p>
                                    <button onClick={() => supprimerLigne(commandeId!, l.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 underline underline-offset-4 decoration-2 transition-colors">Supprimer</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {panierActuel.length === 0 && (
                        <div className="py-32 text-center bg-[#fafafa] rounded-[5rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                            <Utensils size={64} className="text-slate-200 mb-10 transform scale-125" />
                            <p className="text-slate-300 font-extrabold uppercase text-[15px] tracking-[0.5em] mb-3">Panier en attente</p>
                            <p className="text-slate-300/60 font-black uppercase text-[11px] tracking-[0.3em]">Cliquez sur les articles pour les ajouter</p>
                        </div>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.03, y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        if (commandeId) {
                            try {
                              envoyerCuisine(commandeId);
                              toast.success('Tournée prête et enregistrée !');
                            } catch (e) {
                              toast.error("Échec de validation");
                            }
                        }
                    }}
                    disabled={panierActuel.length === 0}
                    className="w-full mt-16 h-32 bg-slate-950 text-white rounded-[4rem] font-black uppercase tracking-[0.7em] text-[15px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] disabled:opacity-5 flex items-center justify-center gap-10 group transition-all duration-700"
                >
                    <Send size={30} className="group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-1000" /> 
                    LANCER LE SERVICE
                </motion.button>
            </div>

            {/* Historique des consommations (Tournées servies) */}
            <div className="flex-1 overflow-y-auto p-14 bg-[#f9f9f9] no-scrollbar shadow-inner">
                <div className="flex items-center gap-8 mb-14">
                  <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">CONSOMMATIONS SERVIES</h3>
                  <div className="h-[2px] flex-1 bg-slate-200/50 rounded-full" />
                </div>
                
                <div className="space-y-20 pb-40">
                    {tournees.map((tournee, idx) => (
                        <div key={idx} className="relative pl-20">
                            {/* Dot line effect */}
                            <div className="absolute left-[26px] top-6 bottom-0 w-1.5 bg-slate-200 rounded-full opacity-50" />
                            <div className="absolute left-0 top-0 w-14 h-14 rounded-[1.6rem] bg-white border-[3px] border-slate-100 flex items-center justify-center z-10 text-slate-950 shadow-md">
                                <History size={24} />
                            </div>
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                  <h4 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.2em] mb-1.5">TOURNEE N° {tournees.length - idx}</h4>
                                  <div className="flex items-center gap-3">
                                      <Clock size={12} className="text-slate-300" />
                                      <p className="text-[12px] font-black text-slate-400">{new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                </div>
                                <span className="font-black text-slate-950 text-[2.2rem] tracking-tighter leading-none italic">{(tournee.total || 0).toLocaleString()} <span className="text-[12px] opacity-20">F</span></span>
                            </div>
                            <div className="space-y-5">
                                {tournee.items.map(l => (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={l.id} className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm transition-transform hover:scale-[1.02] duration-500">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-[1.4rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg shadow-inner">
                                              {l.quantite}
                                            </div>
                                            <span className="text-[15px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[220px]">{l.produitNom}</span>
                                        </div>
                                        <span className="font-black text-slate-950 text-base tracking-tighter">{(l.sousTotal || 0).toLocaleString()} F</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {tournees.length === 0 && (
                        <div className="text-center py-24 opacity-30">
                             <Receipt size={70} className="mx-auto text-slate-200 mb-10 transform scale-150 rotate-6" />
                             <p className="text-slate-400 font-black uppercase text-[12px] tracking-[0.6em]">Addition vierge</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Layout Footer pour mobile/tablette (Bouton Fermer Table visible ici aussi) */}
            <div className="p-10 bg-white border-t-2 border-slate-50 lg:hidden">
                 <button 
                    onClick={() => handleFermerTable(commandeId!)}
                    className="w-full flex items-center justify-center gap-4 p-8 rounded-[2.5rem] bg-rose-50 border-2 border-rose-100 text-rose-600 font-extrabold text-[12px] uppercase tracking-widest"
                  >
                    <Power size={22} /> Annuler/Libérer la table
                  </button>
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
          whileHover={{ y: -8, scale: 1.02 }}
          className="bg-white border-2 border-slate-50 rounded-[3rem] p-10 flex items-center gap-8 shadow-xl shadow-slate-200/50 transition-all duration-700 group cursor-default"
        >
            <div className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 border-2 shadow-xl ${colorMap[color] || 'bg-slate-50'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2">{label}</p>
                <div className="flex items-baseline">
                  <span className="text-[3.5rem] font-black text-slate-950 tracking-tighter leading-none">{valeur}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default InterfaceServeur;
