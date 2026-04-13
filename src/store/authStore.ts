import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface ProfilUtilisateur {
  id: string;
  email: string;
  role: 'super_admin' | 'client_admin' | 'employe';
  etablissement_id: string;
  nom: string;
  prenom: string;
}

interface EtatAuth {
  utilisateur: FirebaseUser | null;
  profil: ProfilUtilisateur | null;
  chargement: boolean;
  initialise: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  initialiser: () => void;
}

export const useAuthStore = create<EtatAuth>((set) => ({
  utilisateur: null,
  profil: null,
  chargement: false,
  initialise: false,

  initialiser: () => {
    // Écouteur en temps réel de la session Firebase
    onAuthStateChanged(auth, async (utilisateurFirebase) => {
      if (utilisateurFirebase) {
        try {
          // Chercher le profil étendu dans la collection "utilisateurs" Firestore
          const profilRef = doc(db, 'utilisateurs', utilisateurFirebase.uid);
          const profilSnap = await getDoc(profilRef);
          
          if (profilSnap.exists()) {
            set({ 
              utilisateur: utilisateurFirebase, 
              profil: { id: profilSnap.id, ...profilSnap.data() } as ProfilUtilisateur, 
              initialise: true 
            });
          } else {
            // Utilisateur n'a pas de profil (Super Admin par defaut par ex.)
            set({ utilisateur: utilisateurFirebase, profil: null, initialise: true });
          }
        } catch (error) {
          console.error("Erreur chargement profil:", error);
          set({ utilisateur: utilisateurFirebase, profil: null, initialise: true });
        }
      } else {
        set({ utilisateur: null, profil: null, initialise: true });
      }
    });
  },

  connexion: async (email, motDePasse) => {
    set({ chargement: true });
    try {
      await signInWithEmailAndPassword(auth, email, motDePasse);
      // L'écouteur onAuthStateChanged s'occupera de mettre à jour le state
    } finally {
      set({ chargement: false });
    }
  },

  deconnexion: async () => {
    await signOut(auth);
    set({ utilisateur: null, profil: null });
  },
}));
