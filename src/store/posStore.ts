import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  increment,
  writeBatch,
  Timestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { toast } from 'react-hot-toast';

export interface LigneCommande {
  id: string;
  produitId: string;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'servi';
  note?: string;
  heureEnvoi?: string;
}

export interface Commande {
  id: string;
  etablissementId: string;
  tableId: string | null;
  tableNom: string | null;
  serveurId: string;
  serveurNom: string;
  dateOuverture: string;
  statut: 'ouverte' | 'envoyee' | 'en_preparation' | 'servie' | 'payee';
  lignes: LigneCommande[];
  total: number;
  nombreCouverts: number;
  type: 'sur_place' | 'a_emporter';
  methodePaiement?: 'comptant' | 'credit';
  clientNom?: string;
  clientContact?: string;
  montantPaye?: number;
  montantRestant?: number;
  remise?: number;
  totalFinal?: number;
}

export interface TablePlan {
  id: string;
  nom: string;
  zone: 'salle' | 'terrasse' | 'vip' | 'comptoir';
  capacite: number;
  statut: 'libre' | 'occupee' | 'en_attente_paiement';
  commandeActiveId: string | null;
}

export interface Produit {
  id: string;
  nom: string;
  categorie: string;
  sousCategorie?: string;
  prix: number;
  stockTotal: number;
  stockAlerte?: number;
  unitesParCasier?: number;
  unite?: string;
  emoji?: string;
}

interface PosState {
  tables: TablePlan[];
  produits: Produit[];
  commandes: Commande[];
  loading: boolean;
  unsubs: (() => void)[];
  
  initPOS: (etablissementId: string) => void;
  initialiserTempsReel: (etablissementId: string) => void;
  arreterTempsReel: () => void;
  
  ouvrirTable: (tableId: string, serveurId: string, serveurNom: string, nombreCouverts: number) => Promise<string>;
  ouvrirVenteEmporter: (serveurId: string, serveurNom: string) => Promise<string>;
  ajouterLigne: (commandeId: string, produit: Produit) => Promise<void>;
  modifierQuantite: (commandeId: string, ligneId: string, delta: number) => Promise<void>;
  supprimerLigne: (commandeId: string, ligneId: string) => Promise<void>;
  envoyerCuisine: (commandeId: string) => Promise<void>;
  marquerLignePrete: (commandeId: string, ligneId: string) => Promise<void>;
  marquerCommandeServie: (commandeId: string) => Promise<void>;
  encaisserCommande: (commandeId: string, modePaiement: 'comptant' | 'credit', clientNom: string, montantRemise?: number, montantPaye?: number, clientContact?: string) => Promise<void>;
}

export const usePOSStore = create<PosState>((set, get) => ({
  tables: [],
  produits: [],
  commandes: [],
  loading: false,
  unsubs: [],

  initPOS: (etablissementId) => {
    get().arreterTempsReel();
    set({ loading: true });
    
    const unsubs = [];

    unsubs.push(onSnapshot(query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ tables: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TablePlan)) });
    }));

    unsubs.push(onSnapshot(query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ produits: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produit)) });
    }));

    unsubs.push(onSnapshot(query(collection(db, 'commandes'), where('etablissementId', '==', etablissementId), where('statut', '!=', 'payee')), (snap) => {
      set({ commandes: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commande)) });
    }));

    set({ loading: false, unsubs });
  },

  initialiserTempsReel: (etablissementId) => get().initPOS(etablissementId),
  
  arreterTempsReel: () => {
    get().unsubs.forEach(u => u());
    set({ unsubs: [] });
  },

  ouvrirTable: async (tableId, serveurId, serveurNom, nombreCouverts) => {
    const table = get().tables.find(t => t.id === tableId);
    if (!table || table.statut !== 'libre') throw new Error('Table non disponible');

    const profile = useAuthStore.getState().profil;

    const nouvelleCommande: Omit<Commande, 'id'> = {
      etablissementId: profile?.etablissement_id || '',
      tableId,
      tableNom: table.nom,
      serveurId,
      serveurNom,
      dateOuverture: new Date().toISOString(),
      statut: 'ouverte',
      lignes: [],
      total: 0,
      nombreCouverts,
      type: 'sur_place'
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvelleCommande);
    await updateDoc(doc(db, 'tables', tableId), {
      statut: 'occupee',
      commandeActiveId: docRef.id
    });

    return docRef.id;
  },

  ouvrirVenteEmporter: async (serveurId, serveurNom) => {
    const profile = useAuthStore.getState().profil;
    const nouvelleCommande: Omit<Commande, 'id'> = {
      etablissementId: profile?.etablissement_id || '',
      tableId: null, tableNom: 'A EMPORTER', serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: 1, type: 'a_emporter'
    };
    const docRef = await addDoc(collection(db, 'commandes'), nouvelleCommande);
    return docRef.id;
  },

  ajouterLigne: async (commandeId, produit) => {
    if (!commandeId) return;
    try {
      // 1. On récupère la commande (plus fiable via getDoc direct en cas de latence)
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) {
        toast.error("Commande non trouvée");
        return;
      }
      const data = snap.data();
      const lignes = (data.lignes || []) as LigneCommande[];

      // 2. Logique d'ajout ou mise à jour
      const existantIdx = lignes.findIndex(l => l.produitId === produit.id && l.statut === 'en_attente');
      let nouvellesLignes = [...lignes];

      if (existantIdx > -1) {
        const item = nouvellesLignes[existantIdx];
        const nveleQte = item.quantite + 1;
        nouvellesLignes[existantIdx] = {
            ...item,
            quantite: nveleQte,
            sousTotal: nveleQte * produit.prix
        };
      } else {
        nouvellesLignes.push({
          id: Math.random().toString(36).substr(2, 9),
          produitId: produit.id,
          produitNom: produit.nom,
          quantite: 1,
          prixUnitaire: produit.prix,
          sousTotal: produit.prix,
          statut: 'en_attente'
        });
      }

      // 3. Calcul du nouveau total (on recalcule tout pour éviter NaN)
      const total = nouvellesLignes.reduce((sum, item) => sum + (Number(item.sousTotal) || 0), 0);

      // 4. Update Firestore
      await updateDoc(commandeRef, { 
        lignes: nouvellesLignes, 
        total: total 
      });
      
    } catch (error) {
      console.error("Erreur ajout:", error);
      toast.error("Erreur lors de l'ajout");
    }
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    if (!commandeId) return;
    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) return;
      
      const data = snap.data();
      const lignes = (data.lignes || []) as LigneCommande[];
      
      const nouvellesLignes = lignes.map(l => {
        if (l.id === ligneId) {
          const nveleQte = Math.max(1, l.quantite + delta);
          return { ...l, quantite: nveleQte, sousTotal: nveleQte * l.prixUnitaire };
        }
        return l;
      });

      const total = nouvellesLignes.reduce((sum, item) => sum + (Number(item.sousTotal) || 0), 0);
      await updateDoc(commandeRef, { lignes: nouvellesLignes, total });
    } catch (error) {
      console.error("Erreur modif qté:", error);
    }
  },

  supprimerLigne: async (commandeId, ligneId) => {
    if (!commandeId) return;
    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) return;
      
      const data = snap.data();
      const lignes = (data.lignes || []) as LigneCommande[];
      const nouvellesLignes = lignes.filter(l => l.id !== ligneId);
      const total = nouvellesLignes.reduce((sum, item) => sum + (Number(item.sousTotal) || 0), 0);
      await updateDoc(commandeRef, { lignes: nouvellesLignes, total });
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  },

  envoyerCuisine: async (commandeId) => {
    if (!commandeId) return;
    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const lignes = (data.lignes || []) as LigneCommande[];
      const maintenant = new Date().toISOString();
      const batch = writeBatch(db);
      
      lignes.forEach(ligne => {
        if (ligne.statut === 'en_attente') {
          batch.update(doc(db, 'produits', ligne.produitId), {
            stockTotal: increment(-ligne.quantite)
          });
        }
      });

      const deplacementLignes = lignes.map(l => 
        l.statut === 'en_attente' ? { ...l, statut: 'en_preparation', heureEnvoi: maintenant } as LigneCommande : l
      );

      batch.update(commandeRef, { statut: 'envoyee', lignes: deplacementLignes });
      await batch.commit();
    } catch (error) {
      console.error("Erreur envoyer:", error);
      toast.error("Échec de l'envoi");
    }
  },

  encaisserCommande: async (commandeId, modePaiement, clientNom, montantRemise = 0, montantPaye = 0, clientContact = '') => {
    if (!commandeId) return;
    try {
      const batch = writeBatch(db);
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) return;
      
      const commande = { id: snap.id, ...snap.data() } as Commande;
      const totalFinal = Math.max(0, commande.total - montantRemise);
      const resteAPayer = Math.max(0, totalFinal - (montantPaye || 0));

      batch.update(commandeRef, { 
        statut: 'payee', methodePaiement: modePaiement,
        clientNom: clientNom || null, clientContact: clientContact || null,
        montantPaye: montantPaye || totalFinal, montantRestant: resteAPayer,
        remise: montantRemise, totalFinal: totalFinal
      });

      if (commande.tableId) {
        batch.update(doc(db, 'tables', commande.tableId), { statut: 'libre', commandeActiveId: null });
      }

      batch.set(doc(collection(db, 'transactions_pos')), {
        commandeId, total: totalFinal, totalInitial: commande.total,
        montantRecu: montantPaye || totalFinal, montantRestant: resteAPayer,
        montantRemise, modePaiement, clientNom: clientNom || 'Client Anonyme',
        clientContact: clientContact || '', serveurNom: commande.serveurNom,
        tableNom: commande.tableNom, type: commande.type, date: new Date().toISOString(),
        etablissement_id: useAuthStore.getState().profil?.etablissement_id
      });

      await batch.commit();
    } catch (error) {
      console.error("Erreur encaissement:", error);
      throw error;
    }
  },

  marquerLignePrete: async (commandeId, ligneId) => {
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = (snap.data().lignes || []) as LigneCommande[];
    const nvelles = lignes.map(l => l.id === ligneId ? { ...l, statut: 'pret' } : l);
    await updateDoc(commandeRef, { lignes: nvelles });
  },

  marquerCommandeServie: async (commandeId) => {
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = (snap.data().lignes || []) as LigneCommande[];
    const nvelles = lignes.map(l => ({ ...l, statut: 'servi' }));
    await updateDoc(commandeRef, { statut: 'servie', lignes: nvelles });
  }
}));
