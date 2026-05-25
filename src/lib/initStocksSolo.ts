import { collection, writeBatch, doc, getDocs, query } from 'firebase/firestore';
import { db } from './firebase';

export const initStocksSolo = async (etablissementId: string, products: any[]) => {
  if (!etablissementId) throw new Error("ID Etablissement manquant");

  const articlesRef = collection(db, `etablissements/${etablissementId}/articles`);
  
  // Check if articles already exist to avoid duplicating
  const q = query(articlesRef);
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);

  products.forEach((p) => {
    // Check if product with same name exists
    const exists = snap.docs.find(d => d.data().nom === p.name);
    
    if (!exists) {
      const newDocRef = doc(articlesRef);
      batch.set(newDocRef, {
        nom: p.name,
        categorie: 'Boisson',
        prix_achat: 0,
        prix: p.price,
        stock: 0,
        stockAlerte: 10,
        unite: 'Bouteille',
        reference: p.ref,
        actif: true,
        cree_le: new Date().toISOString(),
      });
    }
  });

  await batch.commit();
};
