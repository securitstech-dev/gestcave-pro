import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAExTtwK7rTpYdhh3iHdPVHmx5NN9i73Oc",
  authDomain: "gestcave-pro.firebaseapp.com",
  projectId: "gestcave-pro",
  storageBucket: "gestcave-pro.firebasestorage.app",
  messagingSenderId: "834487603386",
  appId: "1:834487603386:web:8f5b1291798f65353f3283",
  measurementId: "G-8MVQZ2KJ8F"
};

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedScenario() {
    console.log("Initialisation du scénario 'Étoile du Congo'...");
    
    try {
      try {
        await signInWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
        console.log("Connecté avec le compte testseeder.");
      } catch (e) {
        await createUserWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
        console.log("Compte testseeder créé et connecté.");
      }

      const etablissementNom = "BAR-RESTAURANT ÉTOILE DU CONGO";
      
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
      
      const personnel = [
        { nom: "ADMIN", pin: "0000", role: "admin", prenom: "Manager" },
        { nom: "SERV01", pin: "1234", role: "serveur", prenom: "Jean-Baptiste" },
        { nom: "SERV02", pin: "2345", role: "serveur", prenom: "Nadège" },
        { nom: "CUISTO1", pin: "3456", role: "cuisine", prenom: "Céleste" },
        { nom: "CAISS01", pin: "4567", role: "caissier", prenom: "Rodrigue" },
      ];

      for (const p of personnel) {
        const qP = query(collection(db, 'employes'), where('etablissement_id', '==', etablissementId), where('pin', '==', p.pin));
        const snapP = await getDocs(qP);
        if (snapP.empty) {
          const pRef = doc(collection(db, 'employes'));
          batch.set(pRef, { ...p, etablissement_id: etablissementId });
        }
      }

      for (let i = 1; i <= 8; i++) {
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

      const produits = [
        { nom: "Primus 65cl", categorie: "Boisson", prix: 1000, stockTotal: 240, stockAlerte: 72, destination_production: "bar", unite: "unité" },
        { nom: "Ngok 1,5L", categorie: "Boisson", prix: 500, stockTotal: 120, stockAlerte: 24, destination_production: "bar", unite: "unité" },
        { nom: "Coca-Cola 33cl", categorie: "Boisson", prix: 600, stockTotal: 72, stockAlerte: 24, destination_production: "bar", unite: "unité" },
        { nom: "Whisky JB 70cl", categorie: "Boisson", prix: 10000, stockTotal: 12, stockAlerte: 2, destination_production: "bar", unite: "unité" },
        { nom: "Vin rouge 75cl", categorie: "Boisson", prix: 7000, stockTotal: 8, stockAlerte: 2, destination_production: "bar", unite: "unité" },
      ];

      const mappingProduits = {};

      for (const prod of produits) {
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

      const ingredients = [
        { nom: "Poulet frais", stockTotal: 15000, unite: "g", is_ingredient: true, prix: 2.5 },
        { nom: "Poisson capitaine", stockTotal: 8000, unite: "g", is_ingredient: true, prix: 3.5 },
        { nom: "Riz local", stockTotal: 25000, unite: "g", is_ingredient: true, prix: 0.45 },
        { nom: "Tomates fraîches", stockTotal: 5000, unite: "g", is_ingredient: true, prix: 0.8 },
        { nom: "Huile de palme", stockTotal: 3000, unite: "ml", is_ingredient: true, prix: 1.2 },
        { nom: "Oignons", stockTotal: 4000, unite: "g", is_ingredient: true, prix: 0.6 },
        { nom: "Piment", stockTotal: 500, unite: "g", is_ingredient: true, prix: 1.5 },
        { nom: "Sel", stockTotal: 2000, unite: "g", is_ingredient: true, prix: 0.2 },
      ];

      const mappingIng = {};

      for (const ing of ingredients) {
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

      await batch.commit();

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
        const qPl = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId), where('nom', '==', plat.nom));
        const snapPl = await getDocs(qPl);
        if (snapPl.empty) {
          const plRef = doc(collection(db, 'produits'));
          batch2.set(plRef, { ...plat, etablissement_id: etablissementId, stockTotal: 999 });
        }
      }
      await batch2.commit();

      console.log("Scénario initialisé ! ID: " + etablissementId);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
}

seedScenario();
