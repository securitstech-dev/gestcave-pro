import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { SkeletonDashboard } from '../components/ui/SkeletonLoader';
import { useUIStore } from '../store/uiStore';

// Lazy load modules for better performance
const DashboardAccueil = lazy(() => import('./modules/DashboardAccueil'));
const CaisseExpress = lazy(() => import('./modules/CaisseExpress'));
const GestionEmployes = lazy(() => import('./modules/GestionEmployes'));
const GestionFinance = lazy(() => import('./modules/GestionFinance'));
const GestionCRM = lazy(() => import('./modules/GestionCRM'));
const PlanningEquipe = lazy(() => import('./modules/PlanningEquipe'));
const CentreAlertes = lazy(() => import('./modules/CentreAlertes'));
const GestionConformite = lazy(() => import('./modules/GestionConformite'));
const GestionEtablissement = lazy(() => import('./modules/GestionEtablissement'));
const ModuleDebug = lazy(() => import('./modules/ModuleDebug'));
const IAIntelligence = lazy(() => import('./modules/IAIntelligence'));
const ModeHybride = lazy(() => import('./modules/ModeHybride'));

const TableauClient = () => {
  const { profil, authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { darkMode } = useUIStore();

  useEffect(() => {
    if (!authLoading && !profil) {
      navigate('/connexion');
      return;
    }

    if (profil && !['super_admin', 'admin', 'gerant'].includes(profil.role)) {
      navigate('/caisse-mode');
    }
  }, [profil, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    else setActiveTab('dashboard');
  }, [location]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/tableau-de-bord?tab=${tabId}`, { replace: true });
  };

  if (authLoading || !profil) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardAccueil />;
      case 'caisse-express': return <CaisseExpress />;
      case 'finances': return <GestionFinance />;
      case 'crm': return <GestionCRM />;
      case 'equipe': return <GestionEmployes />;
      case 'planning': return <PlanningEquipe />;
      case 'hybride': return <ModeHybride />;
      case 'alertes': return <CentreAlertes />;
      case 'parametres': return <GestionEtablissement />;
      case 'conformite': return <GestionConformite />;
      case 'ia': return <IAIntelligence />;
      case 'debug': return <ModuleDebug />;
      default: return <DashboardAccueil />;
    }
  };

  return (
    <div className={`app-layout ${darkMode ? 'dark' : ''}`}>
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-surface-2 p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<SkeletonDashboard />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TableauClient;
