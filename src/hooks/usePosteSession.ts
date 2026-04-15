import { useEffect } from 'react';
import { usePOSStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';

/**
 * Hook utilisé par les interfaces de rôle (Serveur, Caissier, Cuisine).
 * Lit les infos de session depuis :
 *   1. sessionStorage (accès via Lien de Poste /poste/:id)
 *   2. authStore.profil (accès via Dashboard patron connecté)
 * Et réinitialise le posStore si nécessaire (ex: après refresh de page).
 */
export const usePosteSession = () => {
  const { initialiserTempsReel, tables } = usePOSStore();
  const { profil } = useAuthStore();

  // Infos employé depuis sessionStorage (mode poste)
  const nomEmploye = sessionStorage.getItem('poste_employe_nom')
    || profil?.prenom
    || 'Employé';

  const roleEmploye = sessionStorage.getItem('poste_employe_role')
    || profil?.role
    || 'serveur';

  const etablissementId = sessionStorage.getItem('poste_etablissement_id')
    || profil?.etablissement_id
    || null;

  // Si le store n'a pas de données (ex: refresh de page) — on réinitialise
  useEffect(() => {
    if (etablissementId && tables.length === 0) {
      initialiserTempsReel(etablissementId);
    }
  }, [etablissementId, tables.length, initialiserTempsReel]);

  return { nomEmploye, roleEmploye, etablissementId };
};
