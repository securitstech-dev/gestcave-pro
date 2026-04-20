import React from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ScenarioSeeder = () => {
  const seedScenario = async () => {
    const toastId = toast.loading("Initialisation du scénario 'Étoile du Congo'...");
    
    try {
      const etablissementNom = "BAR-RESTAURANT ÉTOILE DU CONGO";
      
      // 1. Check if establishment exists
      const qEtab = query(collection(db, 'etablissements'), where('nom', '==', etablissementNom));
      const snapEtab = await getDocs(qEtab);
      let etablissementId = "";
      
      if (snapEtab.empty) {
        const docRef = await addDoc(collection(db, 'etablissements'), {
          nom: etablissementNom,
          ville: "Pointe-Noire",
          pays: "Congo",
          devise: "FCFA",
          type: "bar-restaurant",
          dateCreation: new Date().toISOString(),
          statut: "actif"
        });
        etablissementId = docRef.id;
      } else {
        etablissementId = snapEtab.docs[0].id;
      }

      const batch = writeBatch(db);

      // 2. Clear existing data for this establishment (optional but safer for clean scenario)
      // For now, we just add missing ones or update.
      
      // 3. Personnel
      const personnel = [
        { nom: "ADMIN", pin: "0000", role: "admin", prenom: "Manager" },
        { nom: "SERV01", pin: "1234", role: "serveur", prenom: "Jean-Baptiste" },
        { nom: "SERV02", pin: "2345", role: "serveur", prenom: "Nadège" },
        { nom: "CUISTO1", pin: "3456", role: "cuisine", prenom: "Céleste" },
        { nom: "CAISS01", pin: "4567", role: "caissier", prenom: "Rodrigue" },
      ];

      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

      for (const p of personnel) {
        await delay(500);
        const qP = query(collection(db, 'employes'), where('etablissement_id', '==', etablissementId), where('pin', '==', p.pin));
        const snapP = await getDocs(qP);
        if (snapP.empty) {
          const pRef = doc(collection(db, 'employes'));
          batch.set(pRef, { ...p, etablissement_id: etablissementId });
        }
      }

      // 4. Tables (T01 to T08)
      for (let i = 1; i <= 8; i++) {
        await delay(500);
        const nom = `T0${i}`;
        const qT = query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId), where('nom', '==', nom));
        const snapT = await getDocs(qT);
        if (snapT.empty) {
          const tRef = doc(collection(db, 'tables'));
          batch.set(tRef, {
            nom,
            etablissement_id: etablissementId,
            capacite: 4,
            zone: "salle",
            statut: "libre",
            commandeActiveId: null
          });
        }
      }

      // 5. Produits & Stock Initial
      const produits = [
        // Boissons par casier
        { nom: "Primus 65cl", categorie: "Boisson", prix: 1000, stockTotal: 240, stockAlerte: 72, destination_production: "bar", unite: "unité" },
        { nom: "Ngok 1,5L", categorie: "Boisson", prix: 500, stockTotal: 120, stockAlerte: 24, destination_production: "bar", unite: "unité" },
        { nom: "Coca-Cola 33cl", categorie: "Boisson", prix: 600, stockTotal: 72, stockAlerte: 24, destination_production: "bar", unite: "unité" },
        // Boissons à l'unité
        { nom: "Whisky JB 70cl", categorie: "Boisson", prix: 10000, stockTotal: 12, stockAlerte: 2, destination_production: "bar", unite: "unité" },
        { nom: "Vin rouge 75cl", categorie: "Boisson", prix: 7000, stockTotal: 8, stockAlerte: 2, destination_production: "bar", unite: "unité" },
      ];

      const mappingProduits: Record<string, string> = {};

      for (const prod of produits) {
        await delay(500);
        const qPr = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId), where('nom', '==', prod.nom));
        const snapPr = await getDocs(qPr);
        if (snapPr.empty) {
          const prRef = doc(collection(db, 'produits'));
          batch.set(prRef, { ...prod, etablissement_id: etablissementId });
          mappingProduits[prod.nom] = prRef.id;
        } else {
          mappingProduits[prod.nom] = snapPr.docs[0].id;
        }
      }

      // 6. Ingrédients
      const ingredients = [
        { nom: "Poulet frais", stockTotal: 15000, unite: "g", is_ingredient: true, prix: 2.5 }, // 2500/kg = 2.5/g
        { nom: "Poisson capitaine", stockTotal: 8000, unite: "g", is_ingredient: true, prix: 3.5 },
        { nom: "Riz local", stockTotal: 25000, unite: "g", is_ingredient: true, prix: 0.45 },
        { nom: "Tomates fraîches", stockTotal: 5000, unite: "g", is_ingredient: true, prix: 0.8 },
        { nom: "Huile de palme", stockTotal: 3000, unite: "ml", is_ingredient: true, prix: 1.2 },
        { nom: "Oignons", stockTotal: 4000, unite: "g", is_ingredient: true, prix: 0.6 },
        { nom: "Piment", stockTotal: 500, unite: "g", is_ingredient: true, prix: 1.5 },
        { nom: "Sel", stockTotal: 2000, unite: "g", is_ingredient: true, prix: 0.2 },
      ];

      const mappingIng: Record<string, string> = {};

      for (const ing of ingredients) {
        await delay(500);
        const qI = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId), where('nom', '==', ing.nom));
        const snapI = await getDocs(qI);
        if (snapI.empty) {
          const iRef = doc(collection(db, 'produits'));
          batch.set(iRef, { ...ing, etablissement_id: etablissementId, categorie: "Ingrédient" });
          mappingIng[ing.nom] = iRef.id;
        } else {
          mappingIng[ing.nom] = snapI.docs[0].id;
        }
      }

      await batch.commit(); // Commit intermediate to get IDs if needed for recipes

      // 7. Plats (Recipes)
      const plats = [
        { 
          nom: "Poulet braisé", prix: 2500, categorie: "Cuisine", destination_production: "cuisine",
          recette: [
            { ingredientId: mappingIng["Poulet frais"], quantite: 250, nom: "Poulet frais" }
          ]
        },
        { 
          nom: "Riz sauce tomate", prix: 1800, categorie: "Cuisine", destination_production: "cuisine",
          recette: [
            { ingredientId: mappingIng["Riz local"], quantite: 150, nom: "Riz local" },
            { ingredientId: mappingIng["Tomates fraîches"], quantite: 100, nom: "Tomates fraîches" },
            { ingredientId: mappingIng["Oignons"], quantite: 50, nom: "Oignons" },
          ]
        },
        { 
          nom: "Poisson capitaine grillé", prix: 4500, categorie: "Cuisine", destination_production: "cuisine",
          recette: [
            { ingredientId: mappingIng["Poisson capitaine"], quantite: 350, nom: "Poisson capitaine" },
            { ingredientId: mappingIng["Oignons"], quantite: 50, nom: "Oignons" },
            { ingredientId: mappingIng["Huile de palme"], quantite: 20, nom: "Huile de palme" },
          ]
        }
      ];

      const batch2 = writeBatch(db);
      for (const plat of plats) {
        await delay(500);
        const qPl = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId), where('nom', '==', plat.nom));
        const snapPl = await getDocs(qPl);
        if (snapPl.empty) {
          const plRef = doc(collection(db, 'produits'));
          batch2.set(plRef, { ...plat, etablissement_id: etablissementId, stockTotal: 999 }); // Plats have virtual stock or infinite if ingredients are there
        }
      }
      await batch2.commit();

      // 8. Simulation des ventes de la VEILLE (Hier)
      const hier = new Date();
      hier.setDate(hier.getDate() - 1);
      const hierISO = hier.toISOString().split('T')[0];
      
      const sessionHierRef = doc(collection(db, 'sessions_caisse'));
      const sessionHierId = sessionHierRef.id;
      
      await setDoc(sessionHierRef, {
        etablissement_id: etablissementId,
        caissier_id: "CAISS01",
        caissier_nom: "Rodrigue",
        dateOuverture: `${hierISO}T10:00:00.000Z`,
        dateFermeture: `${hierISO}T23:59:00.000Z`,
        montantInitial: 50000,
        montantFinalAttendu: 235000,
        montantFinalReel: 235000,
        ecart: 0,
        statut: 'fermee'
      });

      // Ajout de 10 transactions de test hier
      const transactionsHier = [
        { total: 15000, modePaiement: 'especes', serveurId: 'SERV01', serveurNom: 'Jean-Baptiste' },
        { total: 8500, modePaiement: 'especes', serveurId: 'SERV02', serveurNom: 'Nadège' },
        { total: 25000, modePaiement: 'especes', serveurId: 'SERV01', serveurNom: 'Jean-Baptiste' },
        { total: 12000, modePaiement: 'orange_money', serveurId: 'SERV02', serveurNom: 'Nadège' },
        { total: 45000, modePaiement: 'especes', serveurId: 'SERV01', serveurNom: 'Jean-Baptiste' },
      ];

      for (const t of transactionsHier) {
        await addDoc(collection(db, 'transactions_pos'), {
          ...t,
          etablissement_id: etablissementId,
          sessionId: sessionHierId,
          date: `${hierISO}T${12 + Math.floor(Math.random()*10)}:00:00.000Z`,
          statut: 'paye'
        });
      }

      // 9. Pointage Personnel (Hier)
      const personnelIds = ["SERV01", "SERV02", "CAISS01", "CUISTO1"];
      for (const pId of personnelIds) {
        await addDoc(collection(db, 'pointage_presence'), {
          etablissement_id: etablissementId,
          employe_id: pId,
          employe_nom: pId === "SERV01" ? "Jean-Baptiste" : pId === "SERV02" ? "Nadège" : pId === "CAISS01" ? "Rodrigue" : "Céleste",
          debut: new Date(`${hierISO}T10:00:00`),
          fin: new Date(`${hierISO}T23:59:00`),
          statut: 'termine',
          date: hierISO
        });
      }

      toast.success("Scénario initialisé avec ventes de la veille ! ID: " + etablissementId, { id: toastId });
      console.log("Etablissement ID:", etablissementId);
      
      // Save ID for convenience
      localStorage.setItem('scenario_etablissement_id', etablissementId);
      
    } catch (error: any) {
      toast.error("Erreur seeding: " + error.message, { id: toastId });
      console.error(error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <button 
        onClick={seedScenario}
        className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
      >
        🚀 Initialiser Scénario Congo
      </button>
    </div>
  );
};

export default ScenarioSeeder;
