import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft, Star,
  ShieldCheck, Crown, User, Search, Receipt,
  ClipboardList, CreditCard, ChevronDown, History, Trash2
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
  
  const commandeActive = commandes.find(c => c.id === commandeId);
  const categories = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
  
  const produitsFiltres = produits.filter(p => 
    (p.sousCategorie || p.categorie) === categorieActive &&
    (p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()))
  );

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  // Groupement par tournées pour l'affichage de droite
  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    
    commandeActive.lignes.forEach(ligne => {
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
  const panierActuel = commandeActive?.lignes.filter(l => !l.heureEnvoi) || [];

  // Vue 1 : Sélection de Table
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-100 overflow-x-hidden">
        <header className="px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h1 className="text-xl font-display font-black tracking-tight uppercase">ESPACE SERVEUR</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{nomEmploye} • {tables.length} TABLES</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
              <LogOut size={14} /> Quitter
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
              <QuickStat label="Occupées" valeur={tables.filter(t => t.statut === 'occupee').length} color="slate" icone={<Users size={16} />} />
              <QuickStat label="Libres" valeur={tables.filter(t => t.statut === 'libre').length} color="emerald" icone={<CheckCircle2 size={16} />} />
              <QuickStat label="A Encaisser" valeur={tables.filter(t => t.statut === 'en_attente_paiement').length} color="rose" icone={<Receipt size={16} />} />
              <QuickStat label="Clients" valeur={commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + c.nombreCouverts, 0)} color="indigo" icone={<Users size={16} />} />
          </div>

          <AnimatePresence>
            {zones.map((zone) => {
              const tablesZone = tables.filter(t => t.zone === zone);
              if (!tablesZone.length) return null;
              return (
                <div key={zone} className="mb-14">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{zone === 'salle' ? 'ZONE SALLE' : zone === 'terrasse' ? 'ZONE TERRASSE' : 'SALON VIP'}</h2>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {tablesZone.map(table => {
                      const commande = commandes.find(c => c.id === table.commandeActiveId);
                      const isOccupee = table.statut === 'occupee';
                      
                      return (
                        <motion.button
                          key={table.id}
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
                          className={`relative aspect-square rounded-[2rem] p-6 text-center border-2 transition-all flex flex-col items-center justify-between ${
                            table.statut === 'libre' 
                              ? 'bg-white border-slate-50 hover:border-slate-200' 
                              : isOccupee
                              ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/10'
                              : 'bg-rose-50 border-rose-100'
                          }`}
                        >
                          <div className={`text-[10px] font-black uppercase tracking-widest ${isOccupee ? 'text-slate-500' : 'text-slate-300'}`}>
                              {table.statut.replace('_', ' ')}
                          </div>

                          <div className="flex flex-col items-center">
                             <h3 className={`text-2xl font-display font-black mb-1 ${isOccupee ? 'text-white' : 'text-slate-900'}`}>{table.nom}</h3>
                             {isOccupee && commande && (
                                <div className="text-emerald-400 font-bold text-lg leading-none">
                                    {commande.total.toLocaleString()} F
                                </div>
                             )}
                          </div>

                          <div className="flex items-center gap-1.5 opacity-40">
                              <Users size={12} className={isOccupee ? 'text-white' : 'text-slate-900'} />
                              <span className={`text-[10px] font-black ${isOccupee ? 'text-white' : 'text-slate-900'}`}>{table.capacite} PERS.</span>
                          </div>

                          {isOccupee && commande && (
                            <div className="absolute top-4 right-4 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
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
        <button onClick={() => setEtape('tables')} className="absolute top-10 left-10 p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Revenir au plan
        </button>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center mx-auto mb-10 shadow-xl">
              <Users size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-display font-black mb-2 uppercase tracking-tight">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-12">Nombre de convives</p>

          <div className="bg-white border border-slate-200 rounded-[3rem] p-12 mb-12 shadow-sm flex items-center justify-between">
                <button onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))} className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Minus size={24} /></button>
                <div className="flex flex-col">
                    <span className="text-9xl font-display font-black text-slate-900 leading-none">{nombreCouverts}</span>
                </div>
                <button onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))} className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"><Plus size={24} /></button>
          </div>

          <button 
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const id = await ouvrirTable(tableSelectionnee.id, etablissementId || 'srv', nomEmploye, nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success('Table prête ! 🍽️');
              } catch (err) {
                toast.error("Échec de connexion.");
              }
            }}
            className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-900/20 flex items-center justify-center gap-4 transition-transform active:scale-[0.98]"
          >
            Commencer la Prise <ChevronRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  // Vue 3 : Prise de Commande avec SECTION DE DROITE RECLAMÉE
  return (
    <div className="h-screen bg-white flex flex-col text-slate-900 overflow-hidden">
      {/* Header Compact */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={() => setEtape('tables')} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900">
                  <ArrowLeft size={18} />
              </button>
              <div>
                  <h2 className="font-display font-black text-xl uppercase tracking-tight leading-none">{tableSelectionnee?.nom}</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {commandeActive?.nombreCouverts} PERS • #{commandeId?.slice(-4)}
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Addition en cours</p>
                  <p className="font-display font-black text-slate-900 text-xl leading-none">{commandeActive?.total.toLocaleString()} F</p>
              </div>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SECTION GAUCHE : VITRINE DES PRODUITS */}
        <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/30">
            {/* Barre de Categories */}
            <div className="p-4 border-b border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
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

            {/* Grille Produits */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-scrollbar">
                {produitsFiltres.map((produit) => (
                    <motion.button
                        key={produit.id}
                        whileTap={{ scale: 0.96 }}
                        disabled={produit.stockTotal <= 0}
                        onClick={() => commandeId && ajouterLigne(commandeId, produit)}
                        className={`group relative bg-white border rounded-[2rem] p-5 text-left transition-all hover:border-slate-900 ${
                            produit.stockTotal <= 0 ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-100'
                        }`}
                    >
                        {/* STOCK VISIBLE ET DYNAMIQUE */}
                        <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            produit.stockTotal <= 0 ? 'bg-rose-500 text-white' :
                            produit.stockTotal <= 5 ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' :
                            'bg-slate-50 text-slate-500'
                        }`}>
                            {produit.stockTotal <= 0 ? 'RUPTURE' : `${produit.stockTotal} DISPO.`}
                        </div>

                        <div className="flex flex-col h-full justify-between">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                {produit.emoji || '🍷'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-[13px] leading-tight mb-2 uppercase tracking-tight line-clamp-2">{produit.nom}</h4>
                                <span className="text-lg font-display font-black text-slate-900 tracking-tighter">{produit.prix.toLocaleString()} F</span>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>

        {/* SECTION DROITE : ACCUMULATION ET SOMMAIRE RÉCLAMÉE */}
        <aside className="w-[450px] bg-white flex flex-col shadow-2xl z-10">
            {/* Panier Actuel (En cours d'inscription) */}
            <div className="p-8 border-b border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" /> NOUVEL AJOUT
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{panierActuel.length} ARTICLES</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {panierActuel.map(l => (
                            <motion.div 
                                key={l.id} layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                                className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                            >
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                                    <button onClick={() => modifierQuantite(commandeId!, l.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400"><Minus size={12} /></button>
                                    <span className="w-6 text-center font-bold text-slate-900 text-sm">{l.quantite}</span>
                                    <button onClick={() => modifierQuantite(commandeId!, l.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-900"><Plus size={12} /></button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 uppercase truncate">{l.produitNom}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">{l.sousTotal.toLocaleString()} F</p>
                                </div>
                                <button onClick={() => supprimerLigne(commandeId!, l.id)} className="p-2 text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 size={14} /></button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {panierActuel.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">En attente d'articles...</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        if (commandeId) {
                            envoyerCuisine(commandeId);
                            toast.success('Envoyé au comptoir ! 🥂');
                        }
                    }}
                    disabled={panierActuel.length === 0}
                    className="w-full mt-6 h-18 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-slate-900/20 disabled:opacity-20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all"
                >
                    <Send size={18} /> Valider la Tournée
                </button>
            </div>

            {/* Addition Cumulée (Ce qui est déjà servi/au comptoir) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 no-scrollbar">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Historique des Tournées</h3>
                <div className="space-y-10">
                    {tournees.map((tournee, idx) => (
                        <div key={idx} className="relative pl-8">
                            <div className="absolute left-[13px] top-2 bottom-0 w-px bg-slate-200" />
                            <div className="absolute left-0 top-0 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center z-10 text-slate-400">
                                <History size={14} />
                            </div>
                            <div className="flex justify-between items-baseline mb-4">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOURNÉE {tournees.length - idx} • {new Date(tournee.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h4>
                                <span className="font-display font-black text-slate-900 text-sm">{tournee.total.toLocaleString()} F</span>
                            </div>
                            <div className="space-y-3">
                                {tournee.items.map(l => (
                                    <div key={l.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-900 text-[10px]">x{l.quantite}</span>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{l.produitNom}</span>
                                        </div>
                                        <span className="font-black text-slate-900 text-[11px]">{l.sousTotal.toLocaleString()} F</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {tournees.length === 0 && (
                        <div className="text-center py-20">
                             <Receipt size={32} className="mx-auto text-slate-200 mb-4" />
                             <p className="text-slate-300 font-bold uppercase text-[9px] tracking-widest">Aucune tournée validée</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Total Final en bas de sidebar */}
            <div className="p-8 bg-slate-900 text-white rounded-t-[2.5rem] shadow-2xl">
                 <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL À PAYER</span>
                     <span className="text-3xl font-display font-black">{commandeActive?.total.toLocaleString()} F</span>
                 </div>
                 <p className="text-[9px] text-slate-500 font-bold uppercase">Les stocks diminuent en temps réel à chaque tournée validée.</p>
            </div>
        </aside>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const QuickStat = ({ label, valeur, color, icone }: any) => {
    const colors: any = {
        slate: 'bg-slate-50 border-slate-100 text-slate-900',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        rose: 'bg-rose-50 border-rose-100 text-rose-600',
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600'
    };
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
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
