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
            } catch (err) {
                console.error(err);
                toast.error("Erreur de vérification");
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
                email: invitation.email,
                nom: invitation.nom,
                prenom: 'Patron',
                role: 'client_admin',
                etablissement_id: invitation.etablissement_id,
                date_creation: new Date().toISOString()
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
            toast.error(err.message || "Erreur lors de l'activation");
        } finally {
            setChargement(false);
        }
    };

    if (chargement && etape === 'verification') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow mb-6">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight">Activation GestCave Pro</h1>
                    <p className="text-slate-400 mt-2">Plus qu'une étape pour digitaliser votre établissement.</p>
                </div>

                <div className="glass-panel p-8 md:p-10 border-white/10 shadow-2xl">
                    {etape === 'formulaire' && (
                        <form onSubmit={finaliserActivation} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adresse Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="email" 
                                        disabled 
                                        value={invitation?.email} 
                                        className="glass-input w-full pl-12 opacity-60 cursor-not-allowed" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Définir un mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        required
                                        type="password" 
                                        value={motDePasse}
                                        onChange={(e) => setMotDePasse(e.target.value)}
                                        placeholder="••••••••"
                                        className="glass-input w-full pl-12" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        required
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="glass-input w-full pl-12" 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={chargement}
                                className="w-full btn-primary accent py-4 flex items-center justify-center gap-3 text-lg mt-4"
                            >
                                {chargement ? <Loader2 className="animate-spin" size={20} /> : "Activer mon espace"}
                            </button>
                        </form>
                    )}

                    {etape === 'succes' && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                                <CheckCircle2 size={44} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Bienvenue à bord !</h2>
                            <p className="text-slate-400">Votre espace est prêt. Vous allez être redirigé vers la page de connexion...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PageActivation;
