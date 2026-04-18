import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAExTtwK7rTpYdhh3iHdPVHmx5NN9i73Oc",
  authDomain: "gestcave-pro.firebaseapp.com",
  projectId: "gestcave-pro",
  storageBucket: "gestcave-pro.firebasestorage.app",
  messagingSenderId: "834487603386",
  appId: "1:834487603386:web:8f5b1291798f65353f3283",
  measurementId: "G-8MVQZ2KJ8F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function debugCommands() {
    try {
        await signInWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
        
        const etablissementNom = "BAR-RESTAURANT ÉTOILE DU CONGO";
        const qEtab = query(collection(db, 'etablissements'), where('nom', '==', etablissementNom));
        const snapEtab = await getDocs(qEtab);
        
        if (snapEtab.empty) {
            console.log("Etablissement non trouvé");
            return;
        }
        
        const etablissementId = snapEtab.docs[0].id;
        console.log(`Etablissement ID: ${etablissementId}`);

        // Chercher les commandes actives
        const qCmd = query(collection(db, 'commandes'), where('etablissement_id', '==', etablissementId));
        const snapCmd = await getDocs(qCmd);
        
        console.log(`Nombre total de commandes trouvées pour cet ID: ${snapCmd.docs.length}`);
        
        const activeCmds = snapCmd.docs.filter(d => d.data().statut !== 'payee');
        console.log(`Nombre de commandes non-payées (actives): ${activeCmds.length}`);
        
        activeCmds.forEach(d => {
            const data = d.data();
            console.log(`- Commande ${d.id}: Statut=${data.statut}, Table=${data.tableNom}, Lignes=${data.lignes?.length}`);
            data.lignes?.forEach(l => {
                console.log(`  * Ligne: ${l.produitNom}, Statut=${l.statut}, Destination=${l.destination}`);
            });
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugCommands();
