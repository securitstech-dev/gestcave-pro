import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, UtensilsCrossed } from 'lucide-react';

const CuisineBar = () => {
  const [commandes, setCommandes] = useState([
    { id: '1', table: 'Table 2', serveur: 'Jean M.', temps: 5, articles: [
      { nom: 'Poulet Mayo', quantite: 1, statut: 'en_attente' },
      { nom: 'Bière Brune 50cl', quantite: 2, statut: 'pret' }
    ]},
    { id: '2', table: 'VIP A', serveur: 'Alice', temps: 12, articles: [
      { nom: 'Brochettes Bœuf', quantite: 3, statut: 'en_preparation' },
      { nom: 'Vin Rouge', quantite: 1, statut: 'en_attente' }
    ]}
  ]);

  const marquerPret = (cmdId: string, idx: number) => {
    setCommandes(prev => prev.map(c => {
      if (c.id === cmdId) {
        const newArticles = [...c.articles];
        newArticles[idx].statut = 'pret';
        return { ...c, articles: newArticles };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-display font-bold">Écran Cuisine & Bar</h2>
        <p className="text-slate-400 mt-1">Gérez les bons de préparation envoyés par les serveurs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commandes.map(cmd => (
          <motion.div key={cmd.id} className="glass-card overflow-hidden flex flex-col border-yellow-500/20 border-2 shadow-glow-sm">
            <div className="p-4 bg-yellow-500/10 flex justify-between items-center border-b border-yellow-500/20">
              <div>
                <h3 className="font-bold text-xl">{cmd.table}</h3>
                <p className="text-xs text-yellow-500/70">Serveur: {cmd.serveur}</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/20 px-3 py-1.5 rounded-lg">
                <Clock size={16} /> {cmd.temps} min
              </div>
            </div>
            <div className="p-4 flex-1">
              <ul className="space-y-3">
                {cmd.articles.map((art, idx) => (
                  <li key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xl bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg">{art.quantite}</span>
                      <span className={`font-medium text-lg ${art.statut === 'pret' ? 'line-through text-slate-500' : 'text-white'}`}>{art.nom}</span>
                    </div>
                    {art.statut !== 'pret' && (
                      <button 
                        onClick={() => marquerPret(cmd.id, idx)}
                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-xl"
                      >
                        <Check size={20} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-white/5">
               <button className="w-full btn-primary py-3 flex justify-center gap-2">
                 <UtensilsCrossed size={20} /> Terminer le bon complet
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CuisineBar;
