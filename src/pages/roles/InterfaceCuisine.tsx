import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Bell, ChefHat, CheckCircle2, Wine } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import type { Commande } from '../../store/posStore';

// ============================================================
// INTERFACE CUISINE — Optimisée grand écran ou tablette murale
// ============================================================
const InterfaceCuisine = () => {
  const { commandes, marquerLignePrete, marquerCommandeServie } = usePOSStore();
  const [derniereNotif, setDerniereNotif] = useState<number>(0);
  const [filtreActif, setFiltreActif] = useState<'tous' | 'cuisine' | 'bar'>('tous');

  // Commandes actives (envoyées ou en préparation)
  const commandesActives = commandes.filter(c => 
    c.statut === 'envoyee' || c.statut === 'en_preparation'
  ).sort((a, b) => new Date(a.dateOuverture).getTime() - new Date(b.dateOuverture).getTime());

  const minutesEcoulees = (iso: string) => 
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  const urgence = (mins: number) => mins >= 20 ? 'critique' : mins >= 10 ? 'attention' : 'normal';

  // Notification sonore simulée lors d'une nouvelle commande
  useEffect(() => {
    if (commandesActives.length > derniereNotif && derniereNotif !== 0) {
      toast('🔔 Nouvelle commande arrivée !', { 
        style: { background: '#7c3aed', color: 'white', fontWeight: 'bold' }
      });
    }
    setDerniereNotif(commandesActives.length);
  }, [commandesActives.length]);

  const toutPretDansCommande = (commande: Commande) =>
    commande.lignes.filter(l => l.statut !== 'servi').every(l => l.statut === 'pret');

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* En-tête cuisine */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl">
            <ChefHat size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Cuisine & Bar</h1>
            <p className="text-slate-400">Bons de commande en cours — Mis à jour en direct</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">{commandesActives.length} bon(s) actif(s)</span>
          </div>
          <div className="text-slate-400 text-sm bg-slate-800 px-4 py-3 rounded-xl">
            <Clock size={14} className="inline mr-1" />
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Tabs de filtrage */}
      <div className="flex gap-4 mb-8">
          {[
            { id: 'tous', label: 'Tout voir', icon: <Bell size={16} /> },
            { id: 'cuisine', label: 'Cuisine (Plats)', icon: <ChefHat size={16} /> },
            { id: 'bar', label: 'Bar (Boissons)', icon: <Wine size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltreActif(tab.id as any)}
              className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${
                filtreActif === tab.id 
                  ? 'bg-primary text-white shadow-glow-sm' 
                  : 'bg-slate-900 text-slate-500 hover:text-white border border-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
      </div>


      {commandesActives.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-600">
          <ChefHat size={80} className="mb-6 opacity-20" />
          <p className="text-2xl font-bold">Tout est calme...</p>
          <p className="text-slate-500 mt-2">En attente de nouvelles commandes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {commandesActives.map(commande => {
              const mins = minutesEcoulees(commande.dateOuverture);
              const niv = urgence(mins);
              return (
                <motion.div
                  key={commande.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className={`rounded-2xl overflow-hidden border-2 flex flex-col ${
                    niv === 'critique' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                    niv === 'attention' ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                    'border-slate-700 bg-slate-900'
                  } bg-slate-900`}
                >
                  {/* En-tête de la fiche */}
                  <div className={`p-4 flex justify-between items-start border-b border-white/5 ${
                    niv === 'critique' ? 'bg-red-500/20' :
                    niv === 'attention' ? 'bg-yellow-500/10' : 'bg-slate-800/50'
                  }`}>
                    <div>
                      <h3 className="font-display font-bold text-2xl">{commande.tableNom}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Serveur : {commande.serveurNom} • {commande.nombreCouverts} couvert(s)
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl text-sm ${
                      niv === 'critique' ? 'bg-red-500 text-white' :
                      niv === 'attention' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-200'
                    }`}>
                      <Clock size={14} />
                      {mins > 60 ? `${Math.floor(mins / 60)}h${mins % 60}` : `${mins} min`}
                    </div>
                  </div>

                  {/* Articles à préparer (filtrés) */}
                  <div className="p-4 flex-1 space-y-3">
                    {commande.lignes
                      .filter(l => {
                        // On assume que le produit a une catégorie 'Boisson' ou 'Plat'/'Ingrédient'
                        // Idéalement on utilise la catégorie du produit associé
                        if (filtreActif === 'tous') return true;
                        if (filtreActif === 'bar') return l.produitNom.toLowerCase().includes('bière') || l.produitNom.toLowerCase().includes('jus') || l.produitNom.toLowerCase().includes('eau') || l.produitNom.toLowerCase().includes('vin');
                        return !l.produitNom.toLowerCase().includes('bière') && !l.produitNom.toLowerCase().includes('jus') && !l.produitNom.toLowerCase().includes('eau');
                      })
                      .map(ligne => (
                      <div
                        key={ligne.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          ligne.statut === 'pret' || ligne.statut === 'servi' 
                            ? 'opacity-40 bg-slate-800/30' 
                            : 'bg-slate-800'
                        }`}
                      >

                        <div className="shrink-0 bg-slate-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
                          {ligne.quantite}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-base leading-tight ${
                            ligne.statut === 'pret' || ligne.statut === 'servi' ? 'line-through' : ''
                          }`}>
                            {ligne.produitNom}
                          </p>
                          {ligne.note && (
                            <p className="text-xs text-yellow-400 mt-0.5">⚠ {ligne.note}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (ligne.statut === 'en_preparation') {
                              marquerLignePrete(commande.id, ligne.id);
                              toast.success(`${ligne.produitNom} : Prêt !`, { icon: '✅' });
                            }
                          }}
                          disabled={ligne.statut !== 'en_preparation'}
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            ligne.statut === 'pret' || ligne.statut === 'servi'
                              ? 'bg-green-500/20 text-green-400 cursor-default'
                              : 'bg-orange-500 hover:bg-orange-400 text-white cursor-pointer active:scale-90'
                          }`}
                        >
                          {ligne.statut === 'pret' || ligne.statut === 'servi' 
                            ? <CheckCircle2 size={20} />
                            : <Check size={20} />
                          }
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bouton "Tout est prêt" */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => {
                        marquerCommandeServie(commande.id);
                        toast.success(`${commande.tableNom} : Service terminé !`, { icon: '🎉' });
                      }}
                      disabled={!toutPretDansCommande(commande)}
                      className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2"
                    >
                      <Bell size={20} /> Tout est prêt — Service !
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default InterfaceCuisine;
