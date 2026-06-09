import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
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

async function createTestUserProfile() {
    console.log("Connexion au compte testseeder...");
    try {
        const userCred = await signInWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
        const uid = userCred.user.uid;
        console.log(`UID: ${uid}`);

        const etablissementNom = "BAR-RESTAURANT ÉTOILE DU CONGO";
        const qEtab = query(collection(db, 'etablissements'), where('nom', '==', etablissementNom));
        const snapEtab = await getDocs(qEtab);
        
        if (snapEtab.empty) {
            console.error("Établissement non trouvé.");
            return;
        }
        
        const etablissementId = snapEtab.docs[0].id;

        // Créer le profil utilisateur dans Firestore
        await setDoc(doc(db, 'utilisateurs', uid), {
            id: uid,
            email: "testseeder@gestcave.com",
            nom: "Manager",
            prenom: "Etoile",
            role: "client_admin",
            etablissement_id: etablissementId,
            dateCreation: new Date().toISOString()
        });

        console.log("Profil utilisateur créé avec succès !");
        process.exit(0);
    } catch (e) {
        console.error("Erreur:", e.message);
        process.exit(1);
    }
}

createTestUserProfile();
