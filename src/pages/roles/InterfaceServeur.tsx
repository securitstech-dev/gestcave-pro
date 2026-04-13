import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, 
  ShoppingBag, Smartphone, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import type { Produit, TablePlan } from '../../store/posStore';

// ============================================================
// INTERFACE SERVEUR — Optimisée pour tablette/mobile 
// ============================================================
const InterfaceServeur = () => {
  const { tables, produits, commandes, ouvrirTable, ajouterLigne, modifierQuantite, supprimerLigne, envoyerCuisine } = usePOSStore();
  
  const [etape, setEtape] = useState<'tables' | 'couverts' | 'commande'>('tables');
  const [tableSelectionnee, setTableSelectionnee] = useState<TablePlan | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [nombreCouverts, setNombreCouverts] = useState(1);
  const [categorieActive, setCategorieActive] = useState<string>('Bières');
  
  const commandeActive = commandes.find(c => c.id === commandeId);
  
  const categories = [...new Set(produits.map(p => p.sousCategorie || p.categorie))];
  const produitsFiltres = produits.filter(p => (p.sousCategorie || p.categorie) === categorieActive);

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  // Étape 1 : Choisir une table
  if (etape === 'tables') {
    const zones = ['salle', 'terrasse', 'vip'] as const;
    return (
      <div className="min-h-screen bg-slate-950 p-4 pb-24">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Smartphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Interface Serveur</h1>
              <p className="text-slate-400 text-sm">Jean M. • Bonsoir 👋</p>
            </div>
          </div>
        </header>

        {zones.map(zone => {
          const tablesZone = tables.filter(t => t.zone === zone);
          if (!tablesZone.length) return null;
          return (
            <div key={zone} className="mb-8">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                {zone === 'salle' ? '🏠' : zone === 'terrasse' ? '🌿' : '👑'} {zone}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {tablesZone.map(table => {
                  const commande = commandes.find(c => c.id === table.commandeActiveId);
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
                      className={`relative p-4 rounded-2xl text-left border-2 transition-colors ${
                        table.statut === 'libre' 
                          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                          : table.statut === 'occupee'
                          ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                          : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
                      }`}
                    >
                      <div className={`text-xs font-bold mb-2 uppercase ${
                        table.statut === 'libre' ? 'text-green-400' : table.statut === 'occupee' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {table.statut === 'libre' ? '● LIBRE' : table.statut === 'occupee' ? '● OCCUPÉE' : '● PAIEMENT'}
                      </div>
                      <div className="font-bold text-white">{table.nom}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        <Users size={10} className="inline mr-1" />{table.capacite} pers.
                      </div>
                      {commande && (
                        <div className="text-xs text-slate-400 mt-1">
                          <Clock size={10} className="inline mr-1" />{minutesEcoulees(commande.dateOuverture)} min
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Étape 2 : Nombre de couverts
  if (etape === 'couverts') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col">
        <button onClick={() => setEtape('tables')} className="text-slate-400 flex items-center gap-2 mb-8">
          ← Retour
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-display font-bold mb-2">{tableSelectionnee?.nom}</h2>
          <p className="text-slate-400 mb-12">Combien de convives ?</p>

          <div className="flex items-center gap-8 mb-16">
            <button 
              onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))}
              className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold hover:bg-slate-700 transition-colors"
            >
              <Minus size={24} />
            </button>
            <span className="text-7xl font-display font-bold w-24 text-center">{nombreCouverts}</span>
            <button 
              onClick={() => setNombreCouverts(Math.min(tableSelectionnee?.capacite || 12, nombreCouverts + 1))}
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold hover:bg-primary/80 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          <button 
            onClick={async () => {
              if (!tableSelectionnee) return;
              try {
                const id = await ouvrirTable(tableSelectionnee.id, 'srv1', 'Jean M.', nombreCouverts);
                setCommandeId(id);
                setEtape('commande');
                toast.success(`Table ${tableSelectionnee.nom} ouverte !`);
              } catch (err) {
                toast.error("Erreur d'ouverture");
              }
            }}
            className="btn-primary w-full max-w-sm py-5 text-xl font-bold"
          >
            Ouvrir la Table <ChevronRight size={24} className="inline" />
          </button>
        </div>
      </div>
    );
  }

  // Étape 3 : Prise de commande
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* En-tête fixe */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur p-4 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <button onClick={() => setEtape('tables')} className="text-slate-400 text-sm">← Tables</button>
            <h2 className="font-display font-bold text-xl">{tableSelectionnee?.nom}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{commandeActive?.nombreCouverts} convive(s)</p>
            <p className="font-bold text-2xl text-accent">{commandeActive?.total.toLocaleString()} F</p>
          </div>
        </div>

        {/* Catégories de produits */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 snap-x">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategorieActive(cat as string)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap snap-start flex-shrink-0 transition-colors ${
                categorieActive === cat ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Grille produits */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 auto-rows-max">
          {produitsFiltres.map(produit => (
            <motion.button
              key={produit.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                if (commandeId) ajouterLigne(commandeId, produit);
              }}
              className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-left hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <div className="text-3xl mb-2">{produit.emoji}</div>
              <p className="font-medium text-sm leading-tight line-clamp-2 mb-3">{produit.nom}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{produit.prix.toLocaleString()} F</span>
                {produit.stockTotal <= produit.stockAlerte && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">LAST</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Ticket en cours  (bas d'écran) */}
        <AnimatePresence>
          {commandeActive && commandeActive.lignes.length > 0 && (
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-slate-900 border-t border-white/10 p-4 max-h-[50vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShoppingBag size={20} className="text-primary" />
                  Ma Commande
                </h3>
                <span className="text-xs text-slate-400">
                  {commandeActive.lignes.filter(l => l.statut === 'en_attente').length} article(s) à envoyer
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                {commandeActive.lignes.map(ligne => (
                  <div key={ligne.id} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
                      <button onClick={() => modifierQuantite(commandeId!, ligne.id, -1)}>
                        <Minus size={14} className="text-slate-300" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{ligne.quantite}</span>
                      <button onClick={() => modifierQuantite(commandeId!, ligne.id, 1)}>
                        <Plus size={14} className="text-slate-300" />
                      </button>
                    </div>
                    <span className="flex-1 text-sm font-medium">{ligne.produitNom}</span>
                    <span className="text-primary font-bold text-sm">{ligne.sousTotal.toLocaleString()} F</span>
                    {ligne.statut === 'en_attente' && (
                      <button onClick={() => supprimerLigne(commandeId!, ligne.id)}>
                        <X size={16} className="text-slate-500 hover:text-red-400" />
                      </button>
                    )}
                    {ligne.statut !== 'en_attente' && (
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        ligne.statut === 'en_preparation' ? 'bg-orange-500/20 text-orange-400' :
                        ligne.statut === 'pret' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {ligne.statut === 'en_preparation' ? '🍳 Cuisine' : ligne.statut === 'pret' ? '✅ Prêt' : 'Servi'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (commandeId) {
                    envoyerCuisine(commandeId);
                    toast.success('Commande envoyée en cuisine ! 🍳', { icon: '🚀' });
                  }
                }}
                disabled={!commandeActive.lignes.some(l => l.statut === 'en_attente')}
                className="mt-3 w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg transition-colors"
              >
                <Send size={22} /> Envoyer en Cuisine
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterfaceServeur;
