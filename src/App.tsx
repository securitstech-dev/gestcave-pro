import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PageAccueil from './pages/PageAccueil';
import PageConnexion from './pages/PageConnexion';
import TableauSuperAdmin from './pages/TableauSuperAdmin';
import TableauClient from './pages/TableauClient';
import PageAbonnement from './pages/PageAbonnement';
import SelectionMode from './pages/roles/SelectionMode';
import InterfaceServeur from './pages/roles/InterfaceServeur';
import InterfaceCuisine from './pages/roles/InterfaceCuisine';
import InterfaceCaissier from './pages/roles/InterfaceCaissier';
import PageInscription from './pages/PageInscription';
import PagePoste from './pages/PagePoste';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<PageAccueil />} />
          <Route path="/connexion" element={<PageConnexion />} />
          
          {/* Sélection de rôle après connexion */}
          <Route path="/choisir-role" element={<SelectionMode />} />

          {/* Interfaces spécialisées par rôle */}
          <Route path="/serveur" element={<InterfaceServeur />} />
          <Route path="/cuisine" element={<InterfaceCuisine />} />
          <Route path="/caisse" element={<InterfaceCaissier />} />

          {/* Routes Admin */}
          <Route path="/super-admin/*" element={<TableauSuperAdmin />} />
          <Route path="/tableau-de-bord/*" element={<TableauClient />} />
          <Route path="/abonnement" element={<PageAbonnement />} />
          <Route path="/inscription" element={<PageInscription />} />
          {/* Route poste : accès direct des appareils du personnel via lien unique */}
          <Route path="/poste/:etablissementId" element={<PagePoste />} />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;

