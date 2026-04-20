import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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

async function register() {
  const email = "cecilelembi@gmail.com";
  const password = "SuperPassword123!";

  try {
    console.log(`Création du compte Super Admin : ${email}...`);
    let uid;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log("L'utilisateur existe déjà en Auth. Connexion pour mise à jour...");
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
      } else { throw e; }
    }

    await setDoc(doc(db, "utilisateurs", uid), {
      nom: "Lembi",
      prenom: "Cécile",
      email: email,
      role: "super_admin",
      date_creation: new Date().toISOString()
    });

    console.log("--------------------------------------------------");
    console.log("SUCCÈS : Compte créé et configuré en Super Admin !");
    console.log(`Email : ${email}`);
    console.log(`Password : ${password}`);
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (e) {
    console.error("Erreur:", e.message);
    process.exit(1);
  }
}

register();
