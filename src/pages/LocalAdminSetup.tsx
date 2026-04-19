import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const LocalAdminSetup = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const createAdmin = async () => {
    setStatus('loading');
    const email = 'local.admin@gestcave.pro';
    const password = 'LocalAdmin2026!';
    
    try {
      let uid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // Si l'utilisateur existe déjà, on continue pour créer le profil Firestore
          // Note: On ne peut pas récupérer l'UID facilement ici sans se connecter, 
          // mais dans un environnement de test vide, on peut ruser ou demander à l'user de le supprimer.
          throw new Error("L'utilisateur existe déjà. Veuillez le supprimer dans la console Firebase (Authentication) pour recommencer proprement.");
        }
        throw authError;
      }

      await setDoc(doc(db, 'utilisateurs', uid), {
        email: email,
        nom: 'Local',
        prenom: 'Admin',
        role: 'super_admin',
        date_creation: new Date().toISOString()
      });

      setStatus('success');
      setMessage(`Compte Super Admin créé avec succès !\nEmail: ${email}\nMot de passe: ${password}`);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Inter',sans-serif]">
      <div className="bg-white p-12 max-w-lg w-full rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Shield size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] mb-4">Configuration Admin Local</h1>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Cliquez sur le bouton ci-dessous pour créer le compte Super Admin de secours pour votre environnement local.
        </p>

        {status === 'idle' && (
          <button 
            onClick={createAdmin}
            className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
          >
            Créer le Compte Admin Local
          </button>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="animate-spin text-[#1E3A8A]" size={40} />
            <p className="font-bold text-[#1E3A8A]">Création en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 text-emerald-600 font-bold mb-4">
              <CheckCircle size={20} />
              <span>Opération réussie</span>
            </div>
            <pre className="text-xs font-mono text-emerald-800 whitespace-pre-wrap bg-white/50 p-4 rounded-xl">
              {message}
            </pre>
            <p className="text-xs text-emerald-600 mt-4 font-medium italic">
              Note: Conservez ces identifiants précieusement. Vous pouvez maintenant supprimer ce composant.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 text-rose-600 font-bold mb-4">
              <AlertCircle size={20} />
              <span>Erreur</span>
            </div>
            <p className="text-sm text-rose-800 font-medium">{message}</p>
            <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-bold text-rose-600 underline">Réessayer</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalAdminSetup;
