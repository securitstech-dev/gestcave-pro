import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

const PageActivation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [chargement, setChargement] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [etape, setEtape] = useState<'verification' | 'formulaire' | 'succes'>('verification');

    useEffect(() => {
        const verifierToken = async () => {
            if (!token) {
                toast.error("Lien invalide");
                navigate('/');
                return;
            }

            try {
                const q = query(collection(db, 'invitations'), where('token', '==', token));
                const snap = await getDocs(q);

                if (snap.empty) {
                    toast.error("Lien expiré ou invalide");
                    navigate('/');
                    return;
                }

                const data = snap.docs[0].data();
                setInvitation({ id: snap.docs[0].id, ...data });
                setEtape('formulaire');
            } catch (err: any) {
                console.error("DEBUG ACTIVATION:", err);
                toast.error(`Erreur de vérification: ${err.message || 'Inconnue'}`);
            } finally {
                setChargement(false);
            }
        };

        verifierToken();
    }, [token, navigate]);

    const finaliserActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (motDePasse.length < 6) return toast.error("Le mot de passe doit faire 6 caractères minimum");
        if (motDePasse !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas");

        setChargement(true);
        try {
            // 1. Création du compte Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, invitation.email, motDePasse);

            // 2. Création du profil Firestore
            await setDoc(doc(db, 'utilisateurs', userCred.user.uid), {
                id: userCred.user.uid,
                email: invitation.email,
                nom: invitation.nom,
                prenom: 'Patron',
                role: 'client_admin',
                etablissement_id: invitation.etablissement_id,
                date_creation: new Date().toISOString()
            });

            // 2.bis Création du profil Employé Maître (pour le PIN)
            await setDoc(doc(db, 'employes', userCred.user.uid), {
                id: userCred.user.uid,
                nom: invitation.nom,
                prenom: 'Patron',
                email: invitation.email,
                role: 'admin',
                pin: '0000',
                etablissement_id: invitation.etablissement_id,
                actif: true
            });

            // 3. Supprimer l'invitation usagée
            await deleteDoc(doc(db, 'invitations', invitation.id));

            setEtape('succes');
            toast.success("Compte activé avec succès !");
            
            setTimeout(() => {
                navigate('/connexion');
            }, 3000);

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                toast.error("Votre compte est déjà activé ! Connectez-vous.");
                setTimeout(() => navigate('/connexion'), 2000);
                return;
            }
            toast.error(err.message || "Erreur lors de l'activation");
        } finally {
            setChargement(false);
        }
    };

    if (chargement && etape === 'verification') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/50 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/50 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center shadow-xl shadow-slate-200/50 mb-8">
                        <ShieldCheck className="text-indigo-600" size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Activation Compte</h1>
                    <p className="text-slate-500 font-medium">Finalisez la configuration de votre espace GestCave Pro.</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white shadow-2xl shadow-slate-200/60">
                    {etape === 'formulaire' && (
                        <form onSubmit={finaliserActivation} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        disabled 
                                        value={invitation?.email} 
                                        className="w-full h-14 bg-slate-100/50 border border-slate-200 rounded-2xl pl-12 font-bold text-slate-400 cursor-not-allowed opacity-60" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Définir un mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="password" 
                                        value={motDePasse}
                                        onChange={(e) => setMotDePasse(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold" 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={chargement}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                {chargement ? <Loader2 className="animate-spin" size={20} /> : "Activer mon espace maintenant"}
                            </button>
                        </form>
                    )}

                    {etape === 'succes' && (
                        <div className="text-center py-6">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">C'est prêt !</h2>
                            <p className="text-slate-500 font-medium mb-10 px-4">Votre établissement est configuré. Votre code PIN d'accès par défaut est :</p>
                            
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-10 inline-block px-12">
                                <span className="text-5xl font-black text-indigo-600 tracking-[0.4em]">0000</span>
                            </div>
                            
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirection automatique...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PageActivation;
