import { create } from 'zustand';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';

export interface Produit {
  id: string;
  nom: string;
  categorie: string;
  sousCategorie?: string;
  prix: number;
  stockActuel: number;
  stockAlerte: number;
  emoji?: string;
}

export interface TablePlan {
  id: string;
  nom: string;
  capacite: number;
  statut: 'libre' | 'occupee' | 'en_attente_paiement';
  zone: 'salle' | 'terrasse' | 'vip';
  commandeActiveId?: string;
}

export interface LigneCommande {
  id: string;
  produitId: string;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'servi';
  note?: string;
}

export interface Commande {
  id: string;
  tableId: string;
  tableNom: string;
  serveurId: string;
  serveurNom: string;
  dateOuverture: string;
  statut: 'ouverte' | 'envoyee' | 'en_preparation' | 'servie' | 'payee';
  lignes: LigneCommande[];
  total: number;
  nombreCouverts: number;
}

interface PosState {
  tables: TablePlan[];
  produits: Produit[];
  commandes: Commande[];
  loading: boolean;
  unsubscribers: (() => void)[];
  
  initialiserTempsReel: () => void;
  arreterTempsReel: () => void;
  ajouterLigne: (commandeId: string, produit: Produit) => Promise<void>;
  modifierQuantite: (commandeId: string, ligneId: string, delta: number) => Promise<void>;
  supprimerLigne: (commandeId: string, ligneId: string) => Promise<void>;
  envoyerCuisine: (commandeId: string) => Promise<void>;
  ouvrirTable: (tableId: string, serveurId: string, serveurNom: string, couverts: number) => Promise<string>;
  marquerLignePrete: (commandeId: string, ligneId: string) => Promise<void>;
  marquerCommandeServie: (commandeId: string) => Promise<void>;
  encaisserCommande: (commandeId: string, modePaiement: string) => Promise<void>;
}

export const usePOSStore = create<PosState>((set, get) => ({
  tables: [],
  produits: [],
  commandes: [],
  loading: true,
  unsubscribers: [],

  initialiserTempsReel: () => {
    // Si on a déjà des abonnements, on évite les doublons
    get().arreterTempsReel();

    const unsubscribers: (() => void)[] = [];

    // 1. Écouter les tables
    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      const tables = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TablePlan[];
      set({ tables });
    });
    unsubscribers.push(unsubTables);

    // 2. Écouter les produits
    const unsubProduits = onSnapshot(collection(db, 'produits'), (snapshot) => {
      const produits = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[];
      set({ produits });
    });
    unsubscribers.push(unsubProduits);

    // 3. Écouter les commandes non payées
    const qCommandes = query(collection(db, 'commandes'), where('statut', '!=', 'payee'));
    const unsubCommandes = onSnapshot(qCommandes, (snapshot) => {
      const commandes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Commande[];
      set({ commandes, loading: false });
    });
    unsubscribers.push(unsubCommandes);

    set({ unsubscribers });
  },

  arreterTempsReel: () => {
    get().unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },

  ouvrirTable: async (tableId, serveurId, serveurNom, couverts) => {
    const table = get().tables.find(t => t.id === tableId);
    if (!table) throw new Error("Table introuvable");

    // Créer la commande
    const nouvelleCommande = {
      tableId,
      tableNom: table.nom,
      serveurId,
      serveurNom,
      dateOuverture: new Date().toISOString(),
      statut: 'ouverte',
      lignes: [],
      total: 0,
      nombreCouverts: couverts
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvelleCommande);

    // Mettre à jour la table
    await updateDoc(doc(db, 'tables', tableId), {
      statut: 'occupee',
      commandeActiveId: docRef.id
    });

    return docRef.id;
  },

  ajouterLigne: async (commandeId, produit) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = [...commande.lignes];
    const ligneExistante = lignes.find(l => l.produitId === produit.id && l.statut === 'en_attente');

    if (ligneExistante) {
      ligneExistante.quantite += 1;
      ligneExistante.sousTotal = ligneExistante.quantite * ligneExistante.prixUnitaire;
    } else {
      lignes.push({
        id: Math.random().toString(36).substring(7),
        produitId: produit.id,
        produitNom: produit.nom,
        quantite: 1,
        prixUnitaire: produit.prix,
        sousTotal: produit.prix,
        statut: 'en_attente'
      });
    }

    const total = lignes.reduce((acc, ligne) => acc + ligne.sousTotal, 0);
    await updateDoc(doc(db, 'commandes', commandeId), { lignes, total });
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = [...commande.lignes];
    const index = lignes.findIndex(l => l.id === ligneId);
    if (index === -1) return;

    const ligne = lignes[index];
    if (ligne.statut !== 'en_attente') return;

    const newQuantite = ligne.quantite + delta;
    if (newQuantite <= 0) {
      lignes.splice(index, 1);
    } else {
      ligne.quantite = newQuantite;
      ligne.sousTotal = newQuantite * ligne.prixUnitaire;
    }

    const total = lignes.reduce((acc, l) => acc + l.sousTotal, 0);
    await updateDoc(doc(db, 'commandes', commandeId), { lignes, total });
  },

  supprimerLigne: async (commandeId, ligneId) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = commande.lignes.filter(l => l.id !== ligneId);
    const total = lignes.reduce((acc, l) => acc + l.sousTotal, 0);

    await updateDoc(doc(db, 'commandes', commandeId), { lignes, total });
  },

  envoyerCuisine: async (commandeId) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = commande.lignes.map(l => 
      l.statut === 'en_attente' ? { ...l, statut: 'en_preparation' } as LigneCommande : l
    );

    await updateDoc(doc(db, 'commandes', commandeId), { 
      statut: 'envoyee',
      lignes 
    });
  },

  encaisserCommande: async (commandeId, modePaiement) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    // Archiver la commande
    await updateDoc(doc(db, 'commandes', commandeId), { statut: 'payee' });

    // Libérer la table
    await updateDoc(doc(db, 'tables', commande.tableId), {
      statut: 'libre',
      commandeActiveId: null
    });

    // Optionnel : Générer la transaction POS sur Firebase (collection "transactions_pos")
    await addDoc(collection(db, 'transactions_pos'), {
      commandeId,
      total: commande.total,
      modePaiement,
      date: new Date().toISOString()
    });
  },

  marquerLignePrete: async (commandeId, ligneId) => {
    const commande = get().commandes.find(c => c.id === commandeId);
    if (!commande) return;

    const lignes = commande.lignes.map(l => 
      l.id === ligneId ? { ...l, statut: 'pret' } : l
    );

    // Si tout est prêt, on peut passer la commande en statut "en_preparation" ou "servie" ? 
    // On reste simple : on met juste à jour les lignes
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

    // Mettre à jour la table aussi si besoin
    await updateDoc(doc(db, 'tables', commande.tableId), {
      statut: 'libre', // On libère la table quand c'est servi ? Ou quand c'est payé ?
      // Dans ce système, on libère à l'encaissement. 
      // Ici on marque juste comme prête pour le serveur.
    });
  }
}));
