import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('super_admin' | 'client_admin' | 'employe')[];
}

const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { profil, initialise, utilisateur } = useAuthStore();

  // Attendre que l'authentification soit initialisée
  if (!initialise) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Rediriger vers connexion si non connecté
  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  // Vérifier le rôle (avec Bypass spécial pour le compte maître ou rôle super_admin)
  const masterEmail = 'securitstech@gmail.com';
  const estMaster = utilisateur?.email?.toLowerCase() === masterEmail;
  const estSuperAdmin = estMaster || profil?.role === 'super_admin';

  if (estSuperAdmin) {
    return <>{children}</>;
  }

  if (!profil || !allowedRoles.includes(profil.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
