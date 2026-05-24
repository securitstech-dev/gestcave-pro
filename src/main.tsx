import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/system/ErrorBoundary';

const Racine = () => {
  const initialiser = useAuthStore((state) => state.initialiser);

  useEffect(() => {
    initialiser();
  }, [initialiser]);

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Racine />
    </ErrorBoundary>
  </React.StrictMode>
);
