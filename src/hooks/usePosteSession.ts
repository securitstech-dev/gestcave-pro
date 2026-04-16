import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';

export const usePosteSession = () => {
  const { initialiserTempsReel, tables, etablissement_id: posEtabId } = usePOSStore();
  const { profil } = useAuthStore();
  const navigate = useNavigate();

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
    if (etablissementId && !posEtabId) {
      initialiserTempsReel(etablissementId);
    }
  }, [etablissementId, posEtabId, initialiserTempsReel]);

  const quitterPoste = () => {
    sessionStorage.removeItem('poste_employe_nom');
    sessionStorage.removeItem('poste_employe_role');
    const etabId = sessionStorage.getItem('poste_etablissement_id');
    if (etabId) {
      navigate(`/poste/${etabId}`);
    } else {
      navigate('/choisir-role');
    }
  };

  return { nomEmploye, roleEmploye, etablissementId, quitterPoste };
};
