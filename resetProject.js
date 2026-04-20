import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

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

const COLLECTIONS_A_NETTOYER = [
  'etablissements',
  'utilisateurs',
  'employes',
  'commandes',
  'tables',
  'produits',
  'sessions_caisse',
  'transactions_pos',
  'pointage_presence',
  'historique_stocks',
  'sessions_travail',
  'invitations'
];

async function nettoyerCollection(nom) {
  console.log(`Nettoyage de la collection : ${nom}...`);
  const querySnapshot = await getDocs(collection(db, nom));
  const promises = querySnapshot.docs.map(d => deleteDoc(doc(db, nom, d.id)));
  await Promise.all(promises);
  console.log(`Collection ${nom} vide.`);
}

async function resetComplet() {
  console.log("!!! DÉMARRAGE DU RESET COMPLET DU PROJET !!!");
  
  try {
    // 1. Nettoyage de Firestore
    for (const coll of COLLECTIONS_A_NETTOYER) {
      await nettoyerCollection(coll);
    }

    console.log("\n--- Firestore est maintenant vide ---");

    // 2. Création du Super Admin frais
    const email = "cecilelembi@gmail.com";
    const password = "SuperPassword123!";

    console.log(`\nCréation du compte Super Admin : ${email}...`);
    
    let uid;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        // Si déjà là, on se connecte pour récupérer l'UID
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
      } else {
        throw e;
      }
    }

    await setDoc(doc(db, "utilisateurs", uid), {
      nom: "Super",
      prenom: "Admin",
      email: email,
      role: "super_admin",
      date_creation: new Date().toISOString()
    });

    console.log("\n==================================================");
    console.log("PROJET RÉINITIALISÉ AVEC SUCCÈS !");
    console.log("Toutes les données ont été supprimées.");
    console.log(`Connectez-vous sur Vercel avec :`);
    console.log(`Email : ${email}`);
    console.log(`Password : ${password}`);
    console.log("==================================================");
    
    process.exit(0);
  } catch (error) {
    console.error("ERREUR CRITIQUE LORS DU RESET :", error.message);
    process.exit(1);
  }
}

resetComplet();
