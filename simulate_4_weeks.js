import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAExTtwK7rTpYdhh3iHdPVHmx5NN9i73Oc",
  authDomain: "gestcave-pro.firebaseapp.com",
  projectId: "gestcave-pro",
  storageBucket: "gestcave-pro.firebasestorage.app",
  messagingSenderId: "834487603386",
  appId: "1:834487603386:web:8f5b1291798f65353f3283",
  measurementId: "G-8MVQZ2KJ8F"
};

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function simulate4Weeks() {
    console.log("Connexion au compte simulateur...");
    try {
        await signInWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
        console.log("Connecté.");
    } catch (e) {
        console.error("Erreur de connexion:", e.message);
        return;
    }

    const etablissementNom = "BAR-RESTAURANT ÉTOILE DU CONGO";
    const qEtab = query(collection(db, 'etablissements'), where('nom', '==', etablissementNom));
    const snapEtab = await getDocs(qEtab);
    
    if (snapEtab.empty) {
        console.error("Établissement non trouvé. Veuillez d'abord exécuter seed.js");
        return;
    }
    
    const etablissementId = snapEtab.docs[0].id;
    console.log(`Simulation pour ${etablissementNom} (${etablissementId})...`);

    // Récupérer les produits pour générer des ventes réalistes
    const qProd = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId));
    const snapProd = await getDocs(qProd);
    const produits = snapProd.docs.map(d => ({ id: d.id, ...d.data() }));

    const batch = writeBatch(db);
    const mtn = new Date();
    
    // Simuler sur les 30 derniers jours
    for (let day = 0; day < 30; day++) {
        const dateAffaire = new Date();
        dateAffaire.setDate(mtn.getDate() - day);
        const dateStr = dateAffaire.toISOString().split('T')[0];
        
        console.log(`Génération du jour : ${dateStr}`);

        // Nombre de ventes par jour (entre 10 et 30 tickets)
        const nbVentes = Math.floor(Math.random() * 20) + 10;
        let totalJournalier = 0;

        for (let v = 0; v < nbVentes; v++) {
            const nbItems = Math.floor(Math.random() * 5) + 1;
            const itemsVendus = [];
            let totalTicket = 0;

            for (let i = 0; i < nbItems; i++) {
                const prod = produits[Math.floor(Math.random() * produits.length)];
                if (prod.is_ingredient) continue; // On ne vend pas des ingrédients seuls
                
                const qte = Math.floor(Math.random() * 3) + 1;
                const sousTotal = qte * prod.prix;
                totalTicket += sousTotal;
                itemsVendus.push({
                    produitId: prod.id,
                    produitNom: prod.nom,
                    quantite: qte,
                    prixUnitaire: prod.prix,
                    sousTotal: sousTotal,
                    statut: 'servi'
                });
            }

            if (itemsVendus.length === 0) continue;

            const cmdRef = doc(collection(db, 'commandes'));
            const dateVente = new Date(dateAffaire);
            dateVente.setHours(12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

            batch.set(cmdRef, {
                etablissement_id: etablissementId,
                dateOuverture: dateVente.toISOString(),
                statut: 'payee',
                lignes: itemsVendus,
                total: totalTicket,
                totalFinal: totalTicket,
                montantPaye: totalTicket,
                methodePaiement: Math.random() > 0.2 ? 'comptant' : 'mobile',
                serveurNom: "Simulateur",
                type: 'sur_place'
            });

            const transRef = doc(collection(db, 'transactions_pos'));
            batch.set(transRef, {
                commandeId: cmdRef.id,
                total: totalTicket,
                montantRecu: totalTicket,
                modePaiement: Math.random() > 0.2 ? 'comptant' : 'mobile',
                date: dateVente.toISOString(),
                etablissement_id: etablissementId,
                serveurNom: "Simulateur"
            });

            totalJournalier += totalTicket;
        }

        // Simuler quelques charges (électricité, loyer, salaires à la fin du mois)
        if (day % 7 === 0) {
            const chargeRef = doc(collection(db, 'transactions_pos'));
            batch.set(chargeRef, {
                type: 'depense',
                description: "Approvisionnement hebdomadaire",
                total: totalJournalier * 0.4, // 40% de marge brute estimée en achats
                date: dateAffaire.toISOString(),
                etablissement_id: etablissementId
            });
        }
    }

    await batch.commit();
    console.log("Simulation de 4 semaines terminée !");
    process.exit(0);
}

simulate4Weeks();
