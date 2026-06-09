import React from 'react';
import { 
  Bell, Search, Sun, Moon, Maximize, 
  Menu, X
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { NotificationCenter } from '../ui/NotificationCenter';

export const Header = () => {
  const { 
    darkMode, toggleDarkMode, toggleSidebar,
    sidebarCollapsed
  } = useUIStore();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="h-[72px] bg-surface border-b border-subtle flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-text-muted hover:text-brand bg-surface-2 rounded-lg"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>

        {/* Global Search */}
        <div className="hidden md:flex items-center gap-3 bg-surface-2 px-4 py-2.5 rounded-full border border-subtle w-96 group focus-within:border-brand focus-within:bg-surface transition-all">
          <Search size={18} className="text-text-muted group-focus-within:text-brand transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher (Clients, Factures, Produits)..." 
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-text-primary placeholder:text-text-muted"
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 bg-surface-3 rounded text-[10px] font-bold text-text-muted border border-border">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Actions */}
        <button 
          onClick={toggleFullScreen}
          className="p-2.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-full transition-all"
          title="Plein écran"
        >
          <Maximize size={18} />
        </button>
        
        <button 
          onClick={toggleDarkMode}
          className="p-2.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-full transition-all"
          title={darkMode ? "Mode Clair" : "Mode Sombre"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-px h-8 bg-subtle mx-2" />

        <NotificationCenter />
      </div>
    </header>
  );
};
