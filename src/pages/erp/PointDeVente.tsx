import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Utensils, Send, CheckCircle2, XCircle, Search, Plus, Minus, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Table, Produit, LigneCommande } from '../types/erp';

// Données de démo
const TABLES_DEMO: Table[] = [
  { id: '1', nom: 'Table 1', capacite: 4, statut: 'libre', etablissement_id: 'e1' },
  { id: '2', nom: 'Table 2', capacite: 2, statut: 'occupee', etablissement_id: 'e1' },
  { id: '3', nom: 'Table VIP', capacite: 8, statut: 'en_attente_paiement', etablissement_id: 'e1' },
  { id: '4', nom: 'Table 4', capacite: 4, statut: 'libre', etablissement_id: 'e1' },
  { id: '5', nom: 'Comptoir A', capacite: 1, statut: 'occupee', etablissement_id: 'e1' },
];

const PRODUITS_DEMO: Produit[] = [
  { id: 'p1', nom: 'Bière Blonde 33cl', categorie: 'boisson', prix: 1500, stock_actuel: 145, stock_alerte: 20, etablissement_id: 'e1' },
  { id: 'p2', nom: 'Bière Brune 50cl', categorie: 'boisson', prix: 2000, stock_actuel: 80, stock_alerte: 10, etablissement_id: 'e1' },
  { id: 'p3', nom: 'Poulet Mayo', categorie: 'nourriture', prix: 5500, stock_actuel: 10, stock_alerte: 2, etablissement_id: 'e1' },
  { id: 'p4', nom: 'Brochettes Bœuf (x3)', categorie: 'nourriture', prix: 3000, stock_actuel: 25, stock_alerte: 5, etablissement_id: 'e1' },
  { id: 'p5', nom: 'Soda Cola', categorie: 'boisson', prix: 1000, stock_actuel: 40, stock_alerte: 15, etablissement_id: 'e1' },
];

const PointDeVente = () => {
  const [tableActive, setTableActive] = useState<Table | null>(null);
  const [commandeEnCours, setCommandeEnCours] = useState<LigneCommande[]>([]);
  const [categorieFiltre, setCategorieFiltre] = useState<'tous' | 'boisson' | 'nourriture'>('tous');
  const [recherche, setRecherche] = useState('');

  const totalCommande = commandeEnCours.reduce((acc, ligne) => acc + ligne.sous_total, 0);

  const gererClicTable = (table: Table) => {
    setTableActive(table);
    // Simuler le chargement d'une session existante
    if (table.statut === 'occupee') {
      setCommandeEnCours([
        { id: 'l1', produit_id: 'p1', produit_nom: 'Bière Blonde 33cl', quantite: 2, prix_unitaire: 1500, sous_total: 3000, statut_preparation: 'servi' }
      ]);
    } else {
      setCommandeEnCours([]);
    }
  };

  const ajouterProduit = (produit: Produit) => {
    if (!tableActive) {
      toast.error('Sélectionnez une table d\'abord');
      return;
    }
    
    setCommandeEnCours(prev => {
      const existant = prev.find(l => l.produit_id === produit.id && (l.statut_preparation === 'en_attente' || !l.id.startsWith('demo')));
      if (existant) {
        return prev.map(l => l.produit_id === produit.id && typeof l.id === 'string' 
          ? { ...l, quantite: l.quantite + 1, sous_total: (l.quantite + 1) * l.prix_unitaire } 
          : l
        );
      }
      return [...prev, {
        id: Math.random().toString(),
        produit_id: produit.id,
        produit_nom: produit.nom,
        quantite: 1,
        prix_unitaire: produit.prix,
        sous_total: produit.prix,
        statut_preparation: 'en_attente'
      }];
    });
  };

  const modifierQuantite = (idLigne: string, delta: number) => {
    setCommandeEnCours(prev => prev.map(l => {
      if (l.id === idLigne) {
        const nq = Math.max(1, l.quantite + delta);
        return { ...l, quantite: nq, sous_total: nq * l.prix_unitaire };
      }
      return l;
    }));
  };

  const supprimerLigne = (idLigne: string) => {
    setCommandeEnCours(prev => prev.filter(l => l.id !== idLigne));
  };

  const envoyerCuisine = () => {
    if (commandeEnCours.length === 0) return;
    toast.success('Commande envoyée en préparation !');
    
    // Mettre à jour les statuts en attente vers servi/en_preparation
    setCommandeEnCours(prev => prev.map(l => 
      l.statut_preparation === 'en_attente' ? { ...l, statut_preparation: 'en_preparation' } : l
    ));
    
    if (tableActive && tableActive.statut === 'libre') {
      tableActive.statut = 'occupee'; // Simulation locale
    }
  };

  const encaisser = () => {
    if (totalCommande === 0) return;
    toast.success(`Encaissement de ${totalCommande.toLocaleString()} F validé.`);
    if (tableActive) tableActive.statut = 'libre'; // Libère la table localement
    setTableActive(null);
    setCommandeEnCours([]);
  };

  const produitsFiltres = PRODUITS_DEMO.filter(p => 
    (categorieFiltre === 'tous' || p.categorie === categorieFiltre) &&
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Colonne Gauche : Plan de salle */}
      <div className="w-1/4 glass-card flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h2 className="font-bold text-lg flex items-center gap-2">Plan de Salle</h2>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {TABLES_DEMO.map(table => (
              <button
                key={table.id}
                onClick={() => gererClicTable(table)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  tableActive?.id === table.id ? 'border-white shadow-glow-sm' : 'border-transparent'
                } ${
                  table.statut === 'libre' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                  table.statut === 'occupee' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                  'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                }`}
              >
                <div className="text-2xl mb-1">{table.nom.includes('VIP') ? '👑' : '🍽️'}</div>
                <div className="font-bold text-sm truncate">{table.nom}</div>
                <div className="text-xs opacity-80 mt-1 capitalize">{table.statut.replace(/_/g, ' ')}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne Centrale : Catalogue Produits */}
      <div className="w-2/4 glass-card flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Chercher un produit (Bière, Brochette...)" 
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="glass-input pl-10 w-full h-10 text-sm" 
            />
          </div>
          <div className="flex bg-white/5 rounded-lg p-1">
            <button onClick={() => setCategorieFiltre('tous')} className={`px-3 py-1 text-sm rounded ${categorieFiltre === 'tous' ? 'bg-primary text-white' : 'text-slate-400'}`}>Tous</button>
            <button onClick={() => setCategorieFiltre('boisson')} className={`px-3 py-1 flex items-center gap-1 text-sm rounded ${categorieFiltre === 'boisson' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}><Coffee size={14} /> Boissons</button>
            <button onClick={() => setCategorieFiltre('nourriture')} className={`px-3 py-1 flex items-center gap-1 text-sm rounded ${categorieFiltre === 'nourriture' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}><Utensils size={14} /> Plats</button>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-3 gap-4 auto-rows-max">
          {produitsFiltres.map(p => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={p.id}
              onClick={() => ajouterProduit(p)}
              disabled={!tableActive}
              className={`p-4 rounded-xl border border-white/5 flex flex-col justify-between text-left h-24 ${
                !tableActive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-primary/50'
              } transition-colors bg-white/5`}
            >
              <span className="font-medium text-sm leading-tight line-clamp-2">{p.nom}</span>
              <div className="flex justify-between items-end mt-2">
                <span className="font-bold text-primary">{p.prix} F</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.stock_actuel <= p.stock_alerte ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                  Stock: {p.stock_actuel}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Colonne Droite : Ticket en cours */}
      <div className="w-1/4 glass-card flex flex-col h-full overflow-hidden bg-slate-900/50">
        <div className="p-4 border-b border-white/5 bg-primary/20 backdrop-blur-sm">
          <h2 className="font-bold text-lg text-white mb-1">
            {tableActive ? `Ticket : ${tableActive.nom}` : 'Sélectionnez une table'}
          </h2>
          {tableActive && <p className="text-xs text-primary-200">Session ouverte par: Vous</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {commandeEnCours.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
              <Utensils size={48} className="mb-4" />
              <p>Aucun article</p>
            </div>
          ) : (
            commandeEnCours.map((ligne) => (
              <div key={ligne.id} className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm">
                <div className="flex justify-between font-medium mb-2">
                  <span>{ligne.produit_nom}</span>
                  <span>{ligne.sous_total.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    <button onClick={() => modifierQuantite(ligne.id, -1)} className="p-1 hover:bg-slate-700 rounded"><Minus size={14} /></button>
                    <span className="w-6 text-center font-bold">{ligne.quantite}</span>
                    <button onClick={() => modifierQuantite(ligne.id, 1)} className="p-1 hover:bg-slate-700 rounded"><Plus size={14} /></button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {ligne.statut_preparation === 'en_attente' && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">À confirmer</span>
                    )}
                    {ligne.statut_preparation === 'en_preparation' && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">En cuisine</span>
                    )}
                    {ligne.statut_preparation === 'servi' && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Servi</span>
                    )}
                    <button onClick={() => supprimerLigne(ligne.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="flex justify-between mb-4 items-end">
            <span className="text-slate-400">Total à payer</span>
            <span className="text-3xl font-display font-bold text-accent">{totalCommande.toLocaleString()} F</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              onClick={envoyerCuisine}
              disabled={!tableActive || commandeEnCours.length === 0}
              className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Send size={16} /> Envoyer
            </button>
            <button 
              onClick={encaisser}
              disabled={!tableActive || totalCommande === 0}
              className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
              <Banknote size={16} /> Encaisser
            </button>
          </div>
          <button 
             disabled={!tableActive || totalCommande === 0}
             className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-50 mt-2"
          >
            <CreditCard size={14} /> Mettre sur compte client (Crédit)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointDeVente;
