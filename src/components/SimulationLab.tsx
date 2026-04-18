import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Database, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationLab = () => {
  const { profil } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seedRealisticData = async () => {
    if (!profil?.etablissement_id) return toast.error("Erreur : ID établissement introuvable");
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const etablissement_id = profil.etablissement_id;

      // 1. PRODUITS & STOCKS
      const produits = [
        // BIÈRES (Casier de 12 ou 24)
        { nom: "Heineken 33cl", categorie: "Boisson", prix: 1500, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, emoji: "🍺", destination_production: "bar" },
        { nom: "Castel 65cl", categorie: "Boisson", prix: 1200, stockTotal: 240, stockAlerte: 48, unitesParCasier: 12, emoji: "🍺", destination_production: "bar" },
        { nom: "Guinness Smooth", categorie: "Boisson", prix: 1800, stockTotal: 96, stockAlerte: 24, unitesParCasier: 24, emoji: "🍺", destination_production: "bar" },
        { nom: "Beaufort Light", categorie: "Boisson", prix: 1300, stockTotal: 144, stockAlerte: 36, unitesParCasier: 12, emoji: "🍺", destination_production: "bar" },
        
        // SOFTS
        { nom: "Coca-Cola 33cl", categorie: "Boisson", prix: 1000, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, emoji: "🥤", destination_production: "bar" },
        { nom: "Fanta Orange", categorie: "Boisson", prix: 1000, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, emoji: "🥤", destination_production: "bar" },
        { nom: "Eau Minérale 1.5L", categorie: "Boisson", prix: 800, stockTotal: 60, stockAlerte: 12, unitesParCasier: 6, emoji: "💧", destination_production: "bar" },
        { nom: "Sprite", categorie: "Boisson", prix: 1000, stockTotal: 72, stockAlerte: 12, unitesParCasier: 24, emoji: "🥤", destination_production: "bar" },

        // SPIRITUEUX (Ventes bouteilles & VIP)
        { nom: "Jack Daniels 70cl", categorie: "Boisson", prix: 45000, stockTotal: 12, stockAlerte: 3, unitesParCasier: 1, emoji: "🥃", destination_production: "bar" },
        { nom: "Chivas Regal 12 ans", categorie: "Boisson", prix: 55000, stockTotal: 6, stockAlerte: 2, unitesParCasier: 1, emoji: "🥃", destination_production: "bar" },
        { nom: "Hennessy VS", categorie: "Boisson", prix: 65000, stockTotal: 4, stockAlerte: 1, unitesParCasier: 1, emoji: "🥃", destination_production: "bar" },
        { nom: "Moët & Chandon Brut", categorie: "Boisson", prix: 95000, stockTotal: 6, stockAlerte: 2, unitesParCasier: 1, emoji: "🍾", destination_production: "bar" },

        // CUISINE - PLATS (Stock infini ou géré par ingrédients, ici on met un stock large)
        { nom: "Poulet Grillé Entier", categorie: "Plat", prix: 12000, stockTotal: 50, stockAlerte: 5, unitesParCasier: 1, emoji: "🍗", destination_production: "grill" },
        { nom: "Poisson Braisé (Capitaine)", categorie: "Plat", prix: 15000, stockTotal: 30, stockAlerte: 5, unitesParCasier: 1, emoji: "🐟", destination_production: "grill" },
        { nom: "Brochettes de Boeuf (x3)", categorie: "Plat", prix: 4500, stockTotal: 100, stockAlerte: 20, unitesParCasier: 1, emoji: "🍢", destination_production: "grill" },
        { nom: "Pizza Royale", categorie: "Plat", prix: 8500, stockTotal: 50, stockAlerte: 10, unitesParCasier: 1, emoji: "🍕", destination_production: "pizzeria" },
        { nom: "Burger GestCave", categorie: "Plat", prix: 5500, stockTotal: 40, stockAlerte: 10, unitesParCasier: 1, emoji: "🍔", destination_production: "cuisine" },

        // ACCOMPAGNEMENTS
        { nom: "Portion de Frites", categorie: "A-Côté", prix: 2000, stockTotal: 100, stockAlerte: 10, unitesParCasier: 1, emoji: "🍟", destination_production: "cuisine" },
        { nom: "Alloco (Banane)", categorie: "A-Côté", prix: 2500, stockTotal: 80, stockAlerte: 10, unitesParCasier: 1, emoji: "🍌", destination_production: "cuisine" },
        { nom: "Chikwangue", categorie: "A-Côté", prix: 1500, stockTotal: 50, stockAlerte: 5, unitesParCasier: 1, emoji: "🥖", destination_production: "cuisine" }
      ];

      for (const p of produits) {
        const pRef = doc(collection(db, 'produits'));
        batch.set(pRef, { ...p, etablissement_id, dateCreation: new Date().toISOString() });
      }

      // 2. TABLES RÉALISTES
      const tables = [
        { nom: "T01", zone: "salle", capacite: 4, statut: "disponible" },
        { nom: "T02", zone: "salle", capacite: 4, statut: "disponible" },
        { nom: "T03", zone: "salle", capacite: 2, statut: "disponible" },
        { nom: "T04", zone: "salle", capacite: 6, statut: "disponible" },
        { nom: "V01", zone: "vip", capacite: 4, statut: "disponible" },
        { nom: "V02", zone: "vip", capacite: 8, statut: "disponible" },
        { nom: "Terrasse 1", zone: "terrasse", capacite: 4, statut: "disponible" },
        { nom: "Terrasse 2", zone: "terrasse", capacite: 4, statut: "disponible" },
        { nom: "Comptoir 1", zone: "comptoir", capacite: 1, statut: "disponible" },
        { nom: "Comptoir 2", zone: "comptoir", capacite: 1, statut: "disponible" }
      ];

      for (const t of tables) {
        const tRef = doc(collection(db, 'tables'));
        batch.set(tRef, { ...t, etablissement_id });
      }

      await batch.commit();
      setDone(true);
      toast.success("Établissement peuplé avec succès !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du peuplement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lab de Simulation</h2>
            <p className="text-slate-400 text-sm font-medium">Préparez votre environnement de test réaliste</p>
          </div>
        </div>

        {!done ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4 text-amber-700">
              <AlertTriangle className="shrink-0" size={20} />
              <p className="text-xs leading-relaxed font-medium">
                Cette action va injecter environ 20 produits variés et 10 tables réelles dans votre base de données. 
                Idéal pour tester les rapports financiers sur 4 semaines.
              </p>
            </div>

            <button
              onClick={seedRealisticData}
              disabled={loading}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={20} fill="currentColor" />
                  PEUPLER MON ÉTABLISSEMENT
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Configuration Terminée !</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">
              Votre stock et vos tables sont prêts. Vous pouvez maintenant passer à la simulation des ventes.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard/stocks'}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Vérifier l'Inventaire
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationLab;
