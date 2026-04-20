import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// REMPLACER PAR LES CONFIGS DE PRODUCTION SI BESOIN
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

async function createSuperAdmin() {
  const email = "admin@gestcave-pro.com"; // Email souhaité
  const password = "SuperPassword123!";   // Mot de passe souhaité

  try {
    console.log(`Tentative de création du Super Admin: ${email}...`);
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, "utilisateurs", uid), {
      nom: "Super",
      prenom: "Admin",
      email: email,
      role: "super_admin",
      date_creation: new Date().toISOString()
    });

    console.log("--------------------------------------------------");
    console.log("SUCCÈS : Compte Super Admin créé !");
    console.log(`Email : ${email}`);
    console.log(`Password : ${password}`);
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log("Le compte existe déjà. Tentative de mise à jour du rôle en Firestore...");
      // Si le compte existe déjà en Auth, on force juste le rôle en Firestore
      // Note: Il faudrait être connecté pour faire ça via ce script, ou le faire via la console Firebase.
      console.error("Erreur: Le compte Auth existe déjà. Utilisez la console Firebase pour réinitialiser le mot de passe ou changer le rôle.");
    } else {
      console.error("Erreur:", e.message);
    }
    process.exit(1);
  }
}

createSuperAdmin();
