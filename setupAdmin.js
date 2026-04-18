import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

async function setup() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "testseeder@gestcave.com", "password123");
    console.log("Connecté avec auth.");
    const uid = cred.user.uid;
    // L'ID de l'établissement Étoile du Congo a été retourné lors du script précédent
    // "pRmfReXfacgmFDYv4D3D"
    await setDoc(doc(db, "utilisateurs", uid), {
      nom: "Seeder",
      prenom: "Test",
      email: "testseeder@gestcave.com",
      role: "client_admin",
      etablissement_id: "pRmfReXfacgmFDYv4D3D"
    }, { merge: true });
    
    console.log("Profil Admin mis à jour avec succès dans Firestore !");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

setup();
