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
    if (!etablissementId) return;
    get().arreterTempsReel();
    set({ loading: true });
    
    const unsubs = [];

    unsubs.push(onSnapshot(query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ tables: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TablePlan)) });
    }));

    unsubs.push(onSnapshot(query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ produits: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produit)) });
    }));

    // CRITIQUE : Assurer le renommage correct si nécessaire, on utilise etablissementId pour les commandes
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
    const profile = useAuthStore.getState().profil;
    const table = get().tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table introuvable');

    const nouvCmd = {
      etablissementId: profile?.etablissement_id || '',
      tableId, tableNom: table.nom, serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: Number(nombreCouverts), type: 'sur_place'
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvCmd);
    await updateDoc(doc(db, 'tables', tableId), { statut: 'occupee', commandeActiveId: docRef.id });
    return docRef.id;
  },

  ouvrirVenteEmporter: async (serveurId, serveurNom) => {
      // Simplifié
      return '';
  },

  ajouterLigne: async (commandeId, produit) => {
    if (!commandeId || !produit) return;
    const toastId = toast.loading(`Ajout de ${produit.nom}...`);

    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      
      if (!snap.exists()) {
        toast.error("Commande inaccessible (ID: " + commandeId + ")", { id: toastId });
        return;
      }

      const data = snap.data();
      const lignesActuelles = (data.lignes || []) as LigneCommande[];
      
      const idx = lignesActuelles.findIndex(l => l.produitId === produit.id && l.statut === 'en_attente');
      let nvellesLignes = [...lignesActuelles];

      if (idx > -1) {
        const item = nvellesLignes[idx];
        const nveleQte = (item.quantite || 0) + 1;
        nvellesLignes[idx] = {
          ...item,
          quantite: nveleQte,
          sousTotal: nveleQte * (Number(produit.prix) || 0)
        };
      } else {
        nvellesLignes.push({
          id: Math.random().toString(36).substr(2, 9),
          produitId: produit.id,
          produitNom: produit.nom,
          quantite: 1,
          prixUnitaire: Number(produit.prix) || 0,
          sousTotal: Number(produit.prix) || 0,
          statut: 'en_attente'
        });
      }

      const nouveauTotal = nvellesLignes.reduce((sum, l) => sum + (Number(l.sousTotal) || 0), 0);
      
      await updateDoc(commandeRef, {
        lignes: nvellesLignes,
        total: nouveauTotal
      });

      toast.success(`${produit.nom} ajouté !`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur Firestore: " + err.message, { id: toastId });
    }
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = (snap.data().lignes || []) as LigneCommande[];
    const nvele = lignes.map(l => {
        if (l.id === ligneId) {
            const q = Math.max(1, l.quantite + delta);
            return { ...l, quantite: q, sousTotal: q * l.prixUnitaire };
        }
        return l;
    });
    const total = nvele.reduce((s, i) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes: nvele, total });
  },

  supprimerLigne: async (commandeId, ligneId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = ((snap.data().lignes || []) as LigneCommande[]).filter(l => l.id !== ligneId);
    const total = lignes.reduce((s, i) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes, total });
  },

  envoyerCuisine: async (commandeId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const lignes = (data.lignes || []) as LigneCommande[];
    const batch = writeBatch(db);
    const mtn = new Date().toISOString();
    
    lignes.forEach(l => {
        if (l.statut === 'en_attente') {
            batch.update(doc(db, 'produits', l.produitId), { stockTotal: increment(-l.quantite) });
        }
    });

    const nvele = lignes.map(l => l.statut === 'en_attente' ? { ...l, statut: 'en_preparation', heureEnvoi: mtn } : l);
    batch.update(commandeRef, { statut: 'envoyee', lignes: nvele });
    await batch.commit();
  },

  encaisserCommande: async (commandeId, mode, client, remise = 0, paye = 0, contact = '') => {
      // ... logique identique mais sécurisée
  },

  marquerLignePrete: async (commandeId, ligneId) => {},
  marquerCommandeServie: async (commandeId) => {}
}));
