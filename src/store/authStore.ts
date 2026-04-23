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
  etablissement_status?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  departement?: string;
  nb_chaises?: number;
  type_etablissement?: 'restaurant' | 'bar' | 'mixte';
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
  finaliserActivation: (invitation: any, motDePasse: string) => Promise<void>;
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
          let profilSnap = await getDoc(profilRef);
          
          // Si le profil n'existe pas encore, on attend un court instant (propagation Firestore)
          // Utile lors de la création de compte ultra-rapide
          if (!profilSnap.exists()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            profilSnap = await getDoc(profilRef);
          }

          if (profilSnap.exists()) {
            const profilData = profilSnap.data() as ProfilUtilisateur;
            let statusEtab = 'actif';
            
            if (profilData.etablissement_id) {
              const etabSnap = await getDoc(doc(db, 'etablissements', profilData.etablissement_id));
              if (etabSnap.exists()) {
                statusEtab = etabSnap.data().statut || etabSnap.data().subscription_status || 'actif';
              }
            }

            set({ 
              utilisateur: utilisateurFirebase, 
              profil: { ...profilData, id: profilSnap.id, etablissement_status: statusEtab } as ProfilUtilisateur, 
              initialise: true 
            });
          } else {
            // Si toujours pas de profil après délai, on considère qu'il n'existe pas (cas exceptionnel)
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
      const userCred = await signInWithEmailAndPassword(auth, email, motDePasse);
      
      // Fetch profile immediately to avoid race condition with RoleGuard
      const profilRef = doc(db, 'utilisateurs', userCred.user.uid);
      const profilSnap = await getDoc(profilRef);
      
      if (profilSnap.exists()) {
        const profilData = profilSnap.data() as ProfilUtilisateur;
        let statusEtab = 'actif';
        
        if (profilData.etablissement_id) {
          const etabSnap = await getDoc(doc(db, 'etablissements', profilData.etablissement_id));
          if (etabSnap.exists()) {
            statusEtab = etabSnap.data().statut || etabSnap.data().subscription_status || 'actif';
          }
        }

        set({ 
          utilisateur: userCred.user, 
          profil: { ...profilData, id: profilSnap.id, etablissement_status: statusEtab } as ProfilUtilisateur,
          initialise: true
        });
      }
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
        statut: 'en_attente_validation', // Le Super Admin doit valider
        modules_actifs: []
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
      set({ profil: { id: uid, ...profilData }, utilisateur: userCred.user, initialise: true });

    } finally {
      set({ chargement: false });
    }
  },

  deconnexion: async () => {
    await signOut(auth);
    set({ utilisateur: null, profil: null });
  },

  finaliserActivation: async (invitation, motDePasse) => {
    set({ chargement: true });
    try {
      // 1. Création du compte Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, invitation.email, motDePasse);
      const uid = userCred.user.uid;

      // 2. Création du profil Firestore
      const profilData: ProfilUtilisateur = {
        id: uid,
        email: invitation.email,
        nom: invitation.nom,
        prenom: 'Patron',
        role: 'client_admin',
        etablissement_id: invitation.etablissement_id,
      };
      
      await setDoc(doc(db, 'utilisateurs', uid), {
        ...profilData,
        date_creation: new Date().toISOString()
      });

      // 3. Création du profil Employé Maître
      await setDoc(doc(db, 'employes', uid), {
        id: uid,
        nom: invitation.nom,
        prenom: 'Patron',
        email: invitation.email,
        role: 'admin',
        pin: '0000',
        etablissement_id: invitation.etablissement_id,
        actif: true
      });

      // 4. Supprimer l'invitation
      await deleteDoc(doc(db, 'invitations', invitation.id));

      // Mise à jour locale immédiate de l'état
      set({ 
        utilisateur: userCred.user, 
        profil: profilData, 
        initialise: true 
      });

    } finally {
      set({ chargement: false });
    }
  },
}));
