import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export interface ProfilUtilisateur {
  id: string;
  email: string;
  role: 'super_admin' | 'client_admin' | 'employe';
  etablissement_id: string;
  etablissement_nom?: string;
  nom: string;
  prenom?: string;
}

interface EtatAuth {
  utilisateur: FirebaseUser | null;
  profil: ProfilUtilisateur | null;
  chargement: boolean;
  initialise: boolean;
  etablissementSimuleId: string | null;
  setEtablissementSimule: (id: string | null) => void;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (email: string, motDePasse: string, nom: string, etablissementNom: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  reinitialiserMotDePasse: (email: string) => Promise<void>;
  initialiser: () => void;
}

export const useAuthStore = create<EtatAuth>((set, get) => ({
  utilisateur: null,
  profil: null,
  chargement: false,
  initialise: false,
  etablissementSimuleId: localStorage.getItem('gestcave_sim_etab_id'),

  setEtablissementSimule: (id) => {
    if (id) localStorage.setItem('gestcave_sim_etab_id', id);
    else localStorage.removeItem('gestcave_sim_etab_id');
    set({ etablissementSimuleId: id });
  },

  reinitialiserMotDePasse: async (email) => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  },

  initialiser: () => {
    onAuthStateChanged(auth, async (utilisateurFirebase) => {
      if (utilisateurFirebase) {
        try {
          const profilRef = doc(db, 'utilisateurs', utilisateurFirebase.uid);
          const profilSnap = await getDoc(profilRef);
          
          if (profilSnap.exists()) {
            set({ 
              utilisateur: utilisateurFirebase, 
              profil: { id: profilSnap.id, ...profilSnap.data() } as ProfilUtilisateur, 
              initialise: true 
            });
          } else {
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
    } finally {
      set({ chargement: false });
    }
  },

  inscription: async (email, motDePasse, nom, etablissementNom) => {
    set({ chargement: true });
    try {
      // 1. Création du compte Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, motDePasse);
      const uid = userCred.user.uid;

      // 2. Création de l'établissement
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: etablissementNom,
        proprietaire_id: uid,
        date_creation: new Date().toISOString(),
        statut: 'en_attente_validation' // Le Super Admin doit valider
      });

      // 3. Création du profil utilisateur
      const profilData: Omit<ProfilUtilisateur, 'id'> = {
        email,
        role: 'client_admin',
        etablissement_id: etabRef.id,
        etablissement_nom: etablissementNom,
        nom
      };
      
      await setDoc(doc(db, 'utilisateurs', uid), profilData);

      // 4. Création de l'employé "Patron" pour le PIN par défaut
      await setDoc(doc(db, 'employes', uid), {
        id: uid,
        nom: nom,
        email: email,
        role: 'admin',
        pin: '0000',
        etablissement_id: etabRef.id,
        actif: true
      });

      // Mise à jour locale du profil
      set({ profil: { id: uid, ...profilData } });

    } finally {
      set({ chargement: false });
    }
  },

  deconnexion: async () => {
    await signOut(auth);
    set({ utilisateur: null, profil: null });
  },
}));
