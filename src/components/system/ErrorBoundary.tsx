import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Erreur inconnue',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erreur interface GestCave Pro 2.0:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300 ring-1 ring-orange-300/20">
            <AlertTriangle size={40} />
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-orange-300">Protection 2.0 active</p>
          <h1 className="mb-5 text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
            L'application a rencontre une erreur.
          </h1>
          <p className="mb-8 max-w-2xl text-sm font-medium leading-7 text-slate-300">
            GestCave Pro a isole le probleme pour eviter un ecran blanc. Rechargez l'interface; si le probleme revient,
            transmettez ce message au support: <span className="text-orange-200">{this.state.message}</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-14 items-center gap-3 rounded-xl bg-orange-500 px-7 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-950/30 transition hover:bg-orange-400"
          >
            <RefreshCcw size={18} />
            Recharger
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
