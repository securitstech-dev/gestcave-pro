import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft, Star,
  ShieldCheck, Crown, User, Search, Receipt,
  ClipboardList, CreditCard, ChevronDown, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Produit, TablePlan, Commande, LigneCommande } from '../../store/posStore';

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

  // Nouvel état pour voir l'historique/addition d'une table occupée
  const [voirHistorique, setVoirHistorique] = useState(false);
  
  const commandeActive = commandes.find(c => c.id === commandeId);
  const categories = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
  
  const produitsFiltres = produits.filter(p => 
    (p.sousCategorie || p.categorie) === categorieActive &&
    (p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()))
  );

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  // Groupement par tournées (basé sur heureEnvoi)
  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    
    commandeActive.lignes.forEach(ligne => {
      // Les articles non envoyés sont mis à part
      if (!ligne.heureEnvoi) {
        if (!groups['en_attente']) groups['en_attente'] = [];
        groups['en_attente'].push(ligne);
      } else {
        if (!groups[ligne.heureEnvoi]) groups[ligne.heureEnvoi] = [];
        groups[ligne.heureEnvoi].push(ligne);
      }
    });

    return Object.entries(groups).map(([time, items]) => ({
      time: time === 'en_attente' ? null : time,
      items,
      total: items.reduce((sum, item) => sum + item.sousTotal, 0)
    })).sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [commandeActive]);

  // Vue 1 : Sélection de Table
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
        <header className="px-6 py-5 border-b border-slate-200 bg-white/90 backdrop-blur-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Crown size={20} className="text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-display font-black tracking-tight text-slate-900 uppercase">
                    GESTCAVE <span className="text-slate-500">PRO</span>
                 </h1>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Serveur: {nomEmploye}</p>
               </div>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <LogOut size={14} /> Terminer Service
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 pb-32">
          {/* Quick Stats Panel Modifié pour Style Administratif */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <QuickStat label="Occupées" valeur={tables.filter(t => t.statut === 'occupee').length} color="indigo" icone={<Users size={16} />} />
              <QuickStat label="Libres" valeur={tables.filter(t => t.statut === 'libre').length} color="emerald" icone={<CheckCircle2 size={16} />} />
              <QuickStat label="En Attente" valeur={tables.filter(t => t.statut === 'en_attente_paiement').length} color="rose" icone={<Clock size={16} />} />
              <QuickStat label="Total Encours" valeur={commandes.filter(c => c.statut !== 'payee').length} color="slate" icone={<ShoppingBag size={16} />} />
          </div>

          <AnimatePresence>
            {zones.map((zone, idx) => {
              const tablesZone = tables.filter(t => t.zone === zone);
              if (!tablesZone.length) return null;
              return (
                <motion.section 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={zone} 
                    className="mb-14"
                >
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                    <span className="w-8 h-px bg-slate-200" />
                    {zone === 'salle' ? 'SALLE PRINCIPALE' : zone === 'terrasse' ? 'TERRASSE' : 'ESPACE VIP'}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {tablesZone.map(table => {
                      const commande = commandes.find(c => c.id === table.commandeActiveId);
                      const isOccupee = table.statut === 'occupee';
                      
                      return (
                        <motion.button
                          key={table.id}
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
                          className={`relative aspect-square rounded-3xl p-6 text-center border-2 transition-all duration-300 shadow-sm flex flex-col items-center justify-between ${
                            table.statut === 'libre' 
                              ? 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50' 
                              : isOccupee
                              ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/20'
                              : 'bg-rose-50 border-rose-100'
                          }`}
                        >
                          <div className={`text-[10px] font-black uppercase tracking-widest ${isOccupee ? 'text-slate-400' : 'text-slate-500'}`}>
                              {table.statut.replace('_', ' ')}
                          </div>

                          <div className="flex flex-col items-center">
                             <h3 className={`text-2xl font-display font-black mb-1 ${isOccupee ? 'text-white' : 'text-slate-900'}`}>{table.nom}</h3>
                             {isOccupee && commande && (
                                <div className="text-emerald-400 font-bold text-lg leading-none -mt-1">
                                    {commande.total.toLocaleString()} F
                                </div>
                             )}
                          </div>

                          <div className="flex items-center gap-1.5">
                              <Users size={12} className={isOccupee ? 'text-slate-400' : 'text-slate-300'} />
                              <span className={`text-[11px] font-black ${isOccupee ? 'text-slate-400' : 'text-slate-400'}`}>{table.capacite} PERS.</span>
                          </div>

                          {isOccupee && commande && (
                            <div className="absolute top-2 right-4">
                                <span className="text-[9px] font-black text-slate-500 flex items-center gap-1">
                                    <Clock size={10} /> {minutesEcoulees(commande.dateOuverture)}M
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
        <motion.button 
            onClick={() => setEtape('tables')} 
            className="absolute top-10 left-10 py-3 px-6 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Retour
        </motion.button>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Users size={32} className="text-white" />
          </div>
          
          <h2 className="text-4xl font-display font-black mb-2 tracking-tight uppercase">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-12">Combien de personnes ?</p>

          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 mb-12 shadow-sm flex items-center justify-between">
                <button onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))} className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400"><Minus size={24} /></button>
                <div className="flex flex-col">
                    <span className="text-8xl font-display font-black text-slate-900 leading-none">{nombreCouverts}</span>
                </div>
                <button onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))} className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Plus size={24} /></button>
          </div>

          <button 
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const id = await ouvrirTable(tableSelectionnee.id, etablissementId || 'srv', nomEmploye, nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success('Table ouverte !');
              } catch (err) {
                toast.error("Erreur d'ouverture");
              }
            }}
            className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all"
          >
            Lancer la commande <ChevronRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  // Vue 3 : Prise de Commande
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 overflow-hidden">
      {/* Header Premium Redessiné */}
      <header className="sticky top-0 z-[60] bg-white/90 backdrop-blur-3xl border-b border-slate-200 p-4 lg:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => setEtape('tables')} className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="font-display font-black text-2xl uppercase tracking-tighter">{tableSelectionnee?.nom}</h2>
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                        <Users size={10} /> {commandeActive?.nombreCouverts} PERS.
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <Clock size={10} /> {commandeActive ? minutesEcoulees(commandeActive.dateOuverture) : 0} MIN
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Bouton Historique/Addition pour voir la situation au fur et à mesure */}
                <button 
                    onClick={() => setVoirHistorique(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20"
                >
                    <Receipt size={14} /> Addition
                </button>

                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total Table</p>
                    <p className="text-3xl font-display font-black text-slate-900">{commandeActive?.total.toLocaleString()} <span className="text-sm font-bold text-slate-400">F</span></p>
                </div>
            </div>
        </div>

        {/* Categories Bar */}
        <div className="max-w-7xl mx-auto mt-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setCategorieActive(cat as string)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                        categorieActive === cat 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full px-6 pt-6">
        {/* Grille Produits - Stock plus visible */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-48 no-scrollbar">
          {produitsFiltres.map((produit) => {
            const lowStock = produit.stockTotal <= 5;
            const inOrder = commandeActive?.lignes.find(l => l.produitId === produit.id && l.statut === 'en_attente')?.quantite || 0;
            
            return (
              <motion.button
                key={produit.id}
                whileTap={{ scale: 0.95 }}
                disabled={produit.stockTotal <= 0}
                onClick={() => {
                  if (commandeId) {
                      ajouterLigne(commandeId, produit);
                      toast.success(`+1 ${produit.nom}`, { position: 'bottom-center' });
                  }
                }}
                className={`group relative bg-white border rounded-[2.5rem] p-6 text-left transition-all shadow-sm ${
                    produit.stockTotal <= 0 ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-slate-900 hover:shadow-md'
                } ${inOrder > 0 ? 'border-slate-900 ring-4 ring-slate-900/5' : 'border-slate-100'}`}
              >
                {/* SITUATION EN STOCK RECLAMÉ */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    produit.stockTotal <= 0 ? 'bg-rose-500 text-white' :
                    lowStock ? 'bg-rose-100 text-rose-600 animate-pulse' :
                    'bg-slate-50 text-slate-400 border border-slate-100'
                }`}>
                    {produit.stockTotal <= 0 ? 'EPUISE' : `${produit.stockTotal} EN STOCK`}
                </div>

                <div className="flex flex-col h-full justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                        {produit.emoji || '🍷'}
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-slate-900 text-[14px] leading-tight mb-2 uppercase tracking-tight line-clamp-2">{produit.nom}</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-display font-black text-slate-900 tracking-tighter">{produit.prix.toLocaleString()} F</span>
                            {inOrder > 0 && (
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                                    {inOrder}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Le Panier Flottant avec Bouton Envoyer */}
        <AnimatePresence>
          {commandeActive && commandeActive.lignes.length > 0 && (
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              className="fixed bottom-0 left-0 right-0 z-[100] p-6 pointer-events-none"
            >
              <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-[3rem] shadow-2xl p-6 md:p-10 pointer-events-auto flex flex-col md:flex-row gap-6 md:items-center justify-between border-t border-white/10">
                <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar">
                    {commandeActive.lignes.filter(l => l.statut === 'en_attente').map(ligne => (
                        <div key={ligne.id} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px]">
                             <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-xs">x{ligne.quantite}</div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-white uppercase truncate">{ligne.produitNom}</p>
                                <p className="text-[9px] text-slate-500 font-bold">{ligne.sousTotal.toLocaleString()} F</p>
                             </div>
                             <button onClick={() => modifierQuantite(commandeId!, ligne.id, -1)} className="ml-auto p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-500"><Minus size={14} /></button>
                        </div>
                    ))}
                    {commandeActive.lignes.filter(l => l.statut === 'en_attente').length === 0 && (
                        <div className="flex items-center gap-3 text-slate-500 italic text-sm">
                            <Info size={16} /> Cliquez sur les articles pour les ajouter à la commande...
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        if (commandeId) {
                            envoyerCuisine(commandeId);
                            toast.success('Envoyé ! ⚡');
                        }
                    }}
                    disabled={!commandeActive.lignes.some(l => l.statut === 'en_attente')}
                    className="h-16 px-10 bg-white disabled:opacity-30 text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 text-[11px] tracking-widest uppercase active:scale-95 transition-all"
                >
                    <Send size={18} /> Lancer Tournée
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL HISTORIQUE / ADDITION / RESUME RECLAMÉ */}
      <AnimatePresence>
        {voirHistorique && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-4 md:p-6"
          >
            <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-display font-black uppercase tracking-tight">Détail de la Table {tableSelectionnee?.nom}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">SITUATION AU FUR ET À MESURE</p>
                    </div>
                    <button onClick={() => setVoirHistorique(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Résumé des tournées */}
                    <div className="space-y-10">
                        {tournees.map((tournee, idx) => (
                            <div key={idx} className="relative pl-10">
                                <div className="absolute left-[18px] top-2 bottom-0 w-px bg-slate-100" />
                                <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center z-10 ${tournee.time ? 'bg-white border-slate-100 text-slate-400' : 'bg-slate-900 border-slate-900 text-white'}`}>
                                   {tournee.time ? <History size={16} /> : <Zap size={16} />}
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {tournee.time ? `Tournée #${tournees.length - idx} • ${new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Sélection en cours...'}
                                        </h4>
                                        <span className="font-display font-black text-slate-900">{tournee.total.toLocaleString()} F</span>
                                    </div>
                                    <div className="space-y-3">
                                        {tournee.items.map(l => (
                                            <div key={l.id} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">x{l.quantite}</span>
                                                    <span className="text-sm font-bold text-slate-700 uppercase">{l.produitNom}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-400">{l.sousTotal.toLocaleString()} F</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total à régler</span>
                        <span className="text-4xl font-display font-black text-slate-900">{commandeActive?.total.toLocaleString()} F</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white"><CreditCard size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Mode de paiement prévisionnel</p>
                                <p className="text-sm font-bold text-slate-700">Comptant / Cash (Par défaut)</p>
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase text-center md:text-right">
                            Le choix final (Crédit/Cash) <br/> se fait à l'encaissement (Caisse).
                        </div>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const QuickStat = ({ label, valeur, color, icone }: any) => {
    const colors: any = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        rose: 'bg-rose-50 border-rose-100 text-rose-600',
        slate: 'bg-slate-100 border-slate-200 text-slate-900'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color] || colors.slate}`}>
                {icone}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-2xl font-display font-black text-slate-900 leading-none">{valeur}</p>
            </div>
        </div>
    );
};

export default InterfaceServeur;
