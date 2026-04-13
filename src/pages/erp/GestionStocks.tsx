import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Plus, ArrowDownToLine, Search } from 'lucide-react';
import type { Produit } from '../../types/erp';

const PRODUITS_DEMO: Produit[] = [
  { id: 'p1', nom: 'Bière Blonde 33cl', categorie: 'boisson', prix: 1500, stock_actuel: 145, stock_alerte: 20, etablissement_id: 'e1' },
  { id: 'p2', nom: 'Bière Brune 50cl', categorie: 'boisson', prix: 2000, stock_actuel: 8, stock_alerte: 10, etablissement_id: 'e1' }, // En alerte
  { id: 'p3', nom: 'Poulet entier', categorie: 'nourriture', prix: 5500, stock_actuel: 10, stock_alerte: 5, etablissement_id: 'e1' },
  { id: 'p4', nom: 'Charbon (Sac)', categorie: 'autre', prix: 3000, stock_actuel: 2, stock_alerte: 5, etablissement_id: 'e1' }, // En alerte
];

const GestionStocks = () => {
  const [recherche, setRecherche] = useState('');

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Gestion des Stocks</h2>
          <p className="text-slate-400 mt-1">Inventaire, entrées de stock et alertes</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary py-2 flex items-center gap-2">
            <ArrowDownToLine size={18} /> Approvisionnement
          </button>
          <button className="btn-primary py-2 flex items-center gap-2">
            <Plus size={18} /> Nouveau produit
          </button>
        </div>
      </header>

      {/* Résumé des alertes */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-l-red-500 bg-red-500/5">
          <h4 className="font-bold mb-2 flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            Rupture imminente
          </h4>
          <p className="text-3xl font-display font-bold">2</p>
          <p className="text-sm text-slate-400 mt-1">Produits en dessous du seuil</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-primary bg-primary/5">
          <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
            <Package size={20} />
            Produits actifs
          </h4>
          <p className="text-3xl font-display font-bold">{PRODUITS_DEMO.length}</p>
        </div>
      </div>

      {/* Catalogue */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher dans l'inventaire..." 
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="glass-input pl-10 w-full h-10" 
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Produit</th>
              <th className="px-6 py-4 font-semibold">Catégorie</th>
              <th className="px-6 py-4 font-semibold">Prix de vente</th>
              <th className="px-6 py-4 font-semibold">Stock Actuel</th>
              <th className="px-6 py-4 font-semibold">Seuil Alerte</th>
              <th className="px-6 py-4 font-semibold text-right">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {PRODUITS_DEMO.map(produit => {
              const enAlerte = produit.stock_actuel <= produit.stock_alerte;
              return (
                <tr key={produit.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{produit.nom}</td>
                  <td className="px-6 py-4 capitalize">{produit.categorie}</td>
                  <td className="px-6 py-4 text-primary font-bold">{produit.prix} F</td>
                  <td className="px-6 py-4 font-bold text-lg">{produit.stock_actuel}</td>
                  <td className="px-6 py-4 text-slate-400">{produit.stock_alerte}</td>
                  <td className="px-6 py-4 text-right">
                    {enAlerte ? (
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-xs font-bold whitespace-nowrap">
                        Commander !
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-bold">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionStocks;
