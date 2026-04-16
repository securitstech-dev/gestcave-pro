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
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { toast } from 'react-hot-toast';

// Utilitaire pour l'impression thermique
export const imprimerTicket = (commande: Commande, etablissementNom: string) => {
  const contenu = `
    <html>
      <head>
        <title>Ticket ${commande.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; font-family: 'Courier New', Courier, monospace; 
            padding: 5mm; font-size: 12px; line-height: 1.2;
            color: black;
          }
          .header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed black; padding-bottom: 2mm; }
          .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .details { margin-bottom: 5mm; font-size: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
          .table th { text-align: left; border-bottom: 1px solid black; padding-bottom: 1mm; }
          .item-row td { padding: 1mm 0; }
          .total-section { border-top: 2px solid black; padding-top: 2mm; text-align: right; }
          .total { font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 8mm; font-size: 10px; border-top: 1px dashed black; padding-top: 2mm; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${etablissementNom}</div>
          <div>Buvette & Cave</div>
        </div>
        
        <div class="details">
          <div>Ticket: ${commande.id.slice(-8).toUpperCase()}</div>
          <div>Table: ${commande.tableNom || 'EMPORTE'}</div>
          <div>Date: ${new Date(commande.dateOuverture).toLocaleString('fr-FR')}</div>
          <div>Serveur: ${commande.serveurNom}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th width="10%">Qté</th>
              <th width="60%">Article</th>
              <th width="30%" style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${commande.lignes.map(l => `
              <tr class="item-row">
                <td>${l.quantite}</td>
                <td>${l.produitNom}</td>
                <td style="text-align: right">${l.sousTotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          ${commande.remise ? `<div>Remise: -${commande.remise.toLocaleString()} F</div>` : ''}
          <div class="total">TOTAL: ${commande.total.toLocaleString()} FCFA</div>
        </div>

        <div class="footer">
          Merci de votre visite !<br/>
          Propulsé par GESTCAVE PRO
        </div>

        <script>
          window.focus();
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;

  const fenetre = window.open('', '_blank', 'width=400,height=600');
  if (fenetre) {
    fenetre.document.write(contenu);
    fenetre.document.close();
  } else {
    toast.error("Veuillez autoriser les popups pour l'impression");
  }
};

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
  etablissement_id: string;
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
  etablissement_id: string | null;
  tables: TablePlan[];
  produits: Produit[];
  commandes: Commande[];
  loading: boolean;
  unsubs: (() => void)[];
  
  initPOS: (etablissementId: string) => void;
  initialiserTempsReel: (etablissementId: string) => void;
  arreterTempsReel: () => void;
  
  refreshCommande: (id: string) => Promise<void>;
  ouvrirTable: (tableId: string, serveurId: string, serveurNom: string, nombreCouverts: number) => Promise<string>;
  ouvrirVenteEmporter: (serveurId: string, serveurNom: string) => Promise<string>;
  ajouterLigne: (commandeId: string, produit: Produit) => Promise<void>;
  modifierQuantite: (commandeId: string, ligneId: string, delta: number) => Promise<void>;
  supprimerLigne: (commandeId: string, ligneId: string) => Promise<void>;
  envoyerCuisine: (commandeId: string) => Promise<void>;
  marquerLignePrete: (commandeId: string, ligneId: string) => Promise<void>;
  marquerCommandeServie: (commandeId: string) => Promise<void>;
  encaisserCommande: (commandeId: string, modePaiement: 'comptant' | 'credit', clientNom: string, montantRemise?: number, montantPaye?: number, clientContact?: string, refPaiement?: string) => Promise<void>;
  annulerCommande: (commandeId: string) => Promise<void>;
}

export const usePOSStore = create<PosState>((set, get) => ({
  etablissement_id: null,
  tables: [],
  produits: [],
  commandes: [],
  loading: false,
  unsubs: [],

  initPOS: (etablissementId) => {
    if (!etablissementId) return;
    get().arreterTempsReel();
    set({ loading: true, etablissement_id: etablissementId });
    
    const unsubs = [];

    // TABLES
    unsubs.push(onSnapshot(query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ tables: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TablePlan)) });
    }));

    // PRODUITS
    unsubs.push(onSnapshot(query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId)), (snap) => {
      set({ produits: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produit)) });
    }));

    // COMMANDES (DOUBLE ÉCOUTE POUR RÉTROCOMPATIBILITÉ etablissementId / etablissement_id)
    const handleCommandes = (snap: any) => {
      const newItems = snap.docs.map((d:any) => ({ id: d.id, ...d.data() } as Commande));
      set(state => {
          const current = [...state.commandes];
          newItems.forEach((item: Commande) => {
              const idx = current.findIndex(c => c.id === item.id);
              if (idx > -1) current[idx] = item;
              else current.push(item);
          });
          return { commandes: current.filter(c => c.statut !== 'payee') };
      });
    };

    unsubs.push(onSnapshot(query(collection(db, 'commandes'), where('etablissement_id', '==', etablissementId), where('statut', '!=', 'payee')), handleCommandes));
    unsubs.push(onSnapshot(query(collection(db, 'commandes'), where('etablissementId', '==', etablissementId), where('statut', '!=', 'payee')), handleCommandes));

    set({ loading: false, unsubs });
  },

  initialiserTempsReel: (etablissementId) => get().initPOS(etablissementId),
  
  arreterTempsReel: () => {
    get().unsubs.forEach(u => u());
    set({ unsubs: [] });
  },

  refreshCommande: async (id) => {
      console.log("Refreshing command:", id);
      const snap = await getDoc(doc(db, 'commandes', id));
      if (snap.exists()) {
          const cmd = { id: snap.id, ...snap.data() } as Commande;
          set(s => {
              const exists = s.commandes.some(c => c.id === id);
              if (exists) {
                  return { commandes: s.commandes.map(c => c.id === id ? cmd : c) };
              } else {
                  return { commandes: [...s.commandes, cmd] };
              }
          });
      }
  },

  ouvrirTable: async (tableId, serveurId, serveurNom, nombreCouverts) => {
    const profile = useAuthStore.getState().profil;
    const table = get().tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table introuvable');

    const nouvCmd = {
      etablissement_id: profile?.etablissement_id || '',
      etablissementId: profile?.etablissement_id || '', // Double champ pour sécurité
      tableId, tableNom: table.nom, serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: Number(nombreCouverts), type: 'sur_place'
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvCmd);
    await updateDoc(doc(db, 'tables', tableId), { statut: 'occupee', commandeActiveId: docRef.id });
    return docRef.id;
  },

  ouvrirVenteEmporter: async (serveurId, serveurNom) => {
    const profile = useAuthStore.getState().profil;
    const nouvCmd = {
      etablissement_id: profile?.etablissement_id || '',
      etablissementId: profile?.etablissement_id || '',
      tableId: null, tableNom: 'A EMPORTER', serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: 1, type: 'a_emporter'
    };
    const docRef = await addDoc(collection(db, 'commandes'), nouvCmd);
    return docRef.id;
  },

  ajouterLigne: async (commandeId, produit) => {
    if (!commandeId || !produit) return;
    const toastId = toast.loading(`Enregistrement de ${produit.nom}...`);

    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) throw new Error("Commande introuvable en base");

      const data = snap.data();
      const lignesActuelles = (data.lignes || []) as LigneCommande[];
      
      const idx = lignesActuelles.findIndex(l => l.produitId === produit.id && l.statut === 'en_attente');
      let nvellesLignes = [...lignesActuelles];

      if (idx > -1) {
        const item = nvellesLignes[idx];
        const nveleQte = (Number(item.quantite) || 0) + 1;
        nvellesLignes[idx] = { ...item, quantite: nveleQte, sousTotal: nveleQte * Number(produit.prix) };
      } else {
        nvellesLignes.push({
          id: Math.random().toString(36).substr(2, 9),
          produitId: produit.id, produitNom: produit.nom,
          quantite: 1, prixUnitaire: Number(produit.prix),
          sousTotal: Number(produit.prix), statut: 'en_attente'
        });
      }

      const nouveauTotal = nvellesLignes.reduce((sum, l) => sum + (Number(l.sousTotal) || 0), 0);
      await updateDoc(commandeRef, { lignes: nvellesLignes, total: nouveauTotal });
      
      // FORCE REFRESH AVEC AJOUT SI MANQUANT
      await get().refreshCommande(commandeId);

      toast.success(`${produit.nom} ajouté !`, { id: toastId });
    } catch (err: any) {
      console.error("ERREUR POS:", err);
      toast.error("Erreur: " + err.message, { id: toastId });
    }
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const nvele = (data.lignes || []).map((l:any) => {
        if (l.id === ligneId) {
            const q = Math.max(1, l.quantite + delta);
            return { ...l, quantite: q, sousTotal: q * l.prixUnitaire };
        }
        return l;
    });
    const total = nvele.reduce((s:any, i:any) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes: nvele, total });
    await get().refreshCommande(commandeId);
  },

  supprimerLigne: async (commandeId, ligneId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = ((snap.data().lignes || []) as LigneCommande[]).filter(l => l.id !== ligneId);
    const total = lignes.reduce((s, i) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes, total });
    await get().refreshCommande(commandeId);
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

    const nvele = lignes.map(l => l.statut === 'en_attente' ? { ...l, statut: 'pret', heureEnvoi: mtn } : l);
    batch.update(commandeRef, { statut: 'envoyee', lignes: nvele });
    await batch.commit();
    await get().refreshCommande(commandeId);
    toast.success("Tournée validée !");
  },

  marquerLignePrete: async (commandeId, ligneId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const nvelles = (snap.data().lignes || []).map((l:any) => l.id === ligneId ? {...l, statut: 'pret'} : l);
    await updateDoc(ref, { lignes: nvelles });
    await get().refreshCommande(commandeId);
  },

  marquerCommandeServie: async (commandeId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const nvelles = (snap.data().lignes || []).map((l:any) => ({...l, statut: 'servi'}));
    await updateDoc(ref, { statut: 'servie', lignes: nvelles });
    await get().refreshCommande(commandeId);
  },

  encaisserCommande: async (commandeId, mode, client, remise = 0, paye = 0, contact = '', refPaiement = '') => {
    const batch = writeBatch(db);
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const cmd = { id: snap.id, ...snap.data() } as Commande;
    const totalFinal = Math.max(0, cmd.total - remise);
    const restant = Math.max(0, totalFinal - paye);

    batch.update(commandeRef, { 
      statut: 'payee', methodePaiement: mode, clientNom: client || null, clientContact: contact || null,
      montantPaye: paye || totalFinal, montantRestant: restant, remise, totalFinal
    });

    if (cmd.tableId) {
      batch.update(doc(db, 'tables', cmd.tableId), { statut: 'libre', commandeActiveId: null });
    }

    batch.set(doc(collection(db, 'transactions_pos')), {
      commandeId, total: totalFinal, montantRecu: paye || totalFinal,
      montantRestant: restant, modePaiement: mode, date: new Date().toISOString(),
      clientNom: client || 'Direct', clientContact: contact || '',
      etablissement_id: useAuthStore.getState().profil?.etablissement_id,
      serveurId: cmd.serveurId,
      serveurNom: cmd.serveurNom,
      refPaiement: refPaiement || null
    });

    await batch.commit();
    await get().refreshCommande(commandeId);
  },

  annulerCommande: async (commandeId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const batch = writeBatch(db);
    
    // Libération de la table
    if (data.tableId) {
        batch.update(doc(db, 'tables', data.tableId), { statut: 'libre', commandeActiveId: null });
    }
    
    // Restitution des stocks pour les lignes validées
    const lignes = (data.lignes || []) as LigneCommande[];
    lignes.forEach(l => {
        if (l.statut !== 'en_attente') {
            batch.update(doc(db, 'produits', l.produitId), { stockTotal: increment(l.quantite) });
        }
    });

    // Suppression définitive pour éviter de laisser une commande fantôme
    batch.delete(commandeRef);
    await batch.commit();
    
    // Nettoyage de l'état local
    set(state => ({ commandes: state.commandes.filter(c => c.id !== commandeId) }));
  }
}));
