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
  getDocs
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
  initialiserTempsReel: (etablissementId: string) => void; // Alias
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

    const qTables = query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId));
    unsubs.push(onSnapshot(qTables, (snap) => {
      const tables = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TablePlan));
      set({ tables });
    }));

    const qProduits = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId));
    unsubs.push(onSnapshot(qProduits, (snap) => {
      const produits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produit));
      set({ produits });
    }));

    const qCommandes = query(collection(db, 'commandes'), where('etablissementId', '==', etablissementId), where('statut', '!=', 'payee'));
    unsubs.push(onSnapshot(qCommandes, (snap) => {
      const commandes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commande));
      set({ commandes });
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
      tableId: null,
      tableNom: 'A EMPORTER',
      serveurId,
      serveurNom,
      dateOuverture: new Date().toISOString(),
      statut: 'ouverte',
      lignes: [],
      total: 0,
      nombreCouverts: 1,
      type: 'a_emporter'
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvelleCommande);
    return docRef.id;
  },

  ajouterLigne: async (commandeId, produit) => {
    try {
      let commande = get().commandes.find(c => c.id === commandeId);
      
      // Si non trouvé en local (latence snapshot), on tente un fetch direct
      if (!commande) {
        const snap = await getDocs(query(collection(db, 'commandes'), where('__name__', '==', commandeId)));
        if (!snap.empty) {
          commande = { id: snap.docs[0].id, ...snap.docs[0].data() } as Commande;
        }
      }

      if (!commande) {
        console.error("Commande introuvable:", commandeId);
        return;
      }

      const existant = commande.lignes.find(l => l.produitId === produit.id && l.statut === 'en_attente');
      let nouvellesLignes;

      if (existant) {
        nouvellesLignes = commande.lignes.map(l => 
          l.id === existant.id ? { ...l, quantite: l.quantite + 1, sousTotal: (l.quantite + 1) * l.prixUnitaire } : l
        );
      } else {
        const nouvelleLigne: LigneCommande = {
          id: Math.random().toString(36).substr(2, 9),
          produitId: produit.id,
          produitNom: produit.nom,
          quantite: 1,
          prixUnitaire: produit.prix,
          sousTotal: produit.prix,
          statut: 'en_attente'
        };
        nouvellesLignes = [...commande.lignes, nouvelleLigne];
      }

      const total = nouvellesLignes.reduce((acc, l) => acc + l.sousTotal, 0);
      await updateDoc(doc(db, 'commandes', commandeId), { 
        lignes: nouvellesLignes, 
        total 
      });
    } catch (error) {
      console.error("Erreur ajouterLigne:", error);
      toast.error("Erreur lors de l'ajout");
    }
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    try {
      let commande = get().commandes.find(c => c.id === commandeId);
      if (!commande) {
        const snap = await getDocs(query(collection(db, 'commandes'), where('__name__', '==', commandeId)));
        if (!snap.empty) {
          commande = { id: snap.docs[0].id, ...snap.docs[0].data() } as Commande;
        }
      }
      if (!commande) return;

      const lignes = commande.lignes.map(l => {
        if (l.id === ligneId) {
          const nveleQte = Math.max(1, l.quantite + delta);
          return { ...l, quantite: nveleQte, sousTotal: nveleQte * l.prixUnitaire };
        }
        return l;
      });

      const total = lignes.reduce((acc, l) => acc + l.sousTotal, 0);
      await updateDoc(doc(db, 'commandes', commandeId), { lignes, total });
    } catch (error) {
      console.error("Erreur modifierQuantite:", error);
    }
  },

  supprimerLigne: async (commandeId, ligneId) => {
    try {
      let commande = get().commandes.find(c => c.id === commandeId);
      if (!commande) {
        const snap = await getDocs(query(collection(db, 'commandes'), where('__name__', '==', commandeId)));
        if (!snap.empty) {
          commande = { id: snap.docs[0].id, ...snap.docs[0].data() } as Commande;
        }
      }
      if (!commande) return;

      const lignes = commande.lignes.filter(l => l.id !== ligneId);
      const total = lignes.reduce((acc, l) => acc + l.sousTotal, 0);

      await updateDoc(doc(db, 'commandes', commandeId), { lignes, total });
    } catch (error) {
      console.error("Erreur supprimerLigne:", error);
    }
  },

  envoyerCuisine: async (commandeId) => {
    try {
      let commande = get().commandes.find(c => c.id === commandeId);
      if (!commande) {
        const snap = await getDocs(query(collection(db, 'commandes'), where('__name__', '==', commandeId)));
        if (!snap.empty) {
          commande = { id: snap.docs[0].id, ...snap.docs[0].data() } as Commande;
        }
      }
      if (!commande) return;

      const maintenant = new Date().toISOString();
      const batch = writeBatch(db);
      
      commande.lignes.forEach(ligne => {
        if (ligne.statut === 'en_attente') {
          const produitRef = doc(db, 'produits', ligne.produitId);
          batch.update(produitRef, {
            stockTotal: increment(-ligne.quantite)
          });
        }
      });

      const lignes = commande.lignes.map(l => 
        l.statut === 'en_attente' ? { ...l, statut: 'en_preparation', heureEnvoi: maintenant } as LigneCommande : l
      );

      const commandeRef = doc(db, 'commandes', commandeId);
      batch.update(commandeRef, { 
        statut: 'envoyee',
        lignes 
      });

      await batch.commit();
    } catch (error) {
      console.error("Erreur envoyerCuisine:", error);
    }
  },

  encaisserCommande: async (commandeId, modePaiement, clientNom, montantRemise = 0, montantPaye = 0, clientContact = '') => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const totalFinal = Math.max(0, commande.total - montantRemise);
    const resteAPayer = Math.max(0, totalFinal - (montantPaye || 0));

    try {
      const batch = writeBatch(db);
      
      const commandeRef = doc(db, 'commandes', commandeId);
      batch.update(commandeRef, { 
        statut: 'payee',
        methodePaiement: modePaiement,
        clientNom: clientNom || null,
        clientContact: clientContact || null,
        montantPaye: montantPaye || totalFinal,
        montantRestant: resteAPayer,
        remise: montantRemise,
        totalFinal: totalFinal
      });

      if (commande.tableId) {
        const tableRef = doc(db, 'tables', commande.tableId);
        batch.update(tableRef, {
          statut: 'libre',
          commandeActiveId: null
        });
      }

      const transactionRef = doc(collection(db, 'transactions_pos'));
      batch.set(transactionRef, {
        commandeId,
        total: totalFinal,
        totalInitial: commande.total,
        montantRecu: montantPaye || totalFinal,
        montantRestant: resteAPayer,
        montantRemise,
        modePaiement,
        clientNom: clientNom || 'Client Anonyme',
        clientContact: clientContact || '',
        serveurNom: commande.serveurNom,
        tableNom: commande.tableNom,
        type: commande.type,
        date: new Date().toISOString(),
        etablissement_id: useAuthStore.getState().profil?.etablissement_id
      });

      await batch.commit();
      
    } catch (error) {
      console.error("Erreur lors de l'encaissement :", error);
      throw error;
    }
  },

  marquerLignePrete: async (commandeId, ligneId) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = commande.lignes.map(l => 
      l.id === ligneId ? { ...l, statut: 'pret' } : l
    );

    await updateDoc(doc(db, 'commandes', commandeId), { lignes });
  },

  marquerCommandeServie: async (commandeId) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = commande.lignes.map(l => ({ ...l, statut: 'servi' }));
    
    await updateDoc(doc(db, 'commandes', commandeId), { 
      statut: 'servie',
      lignes 
    });
  }
}));
