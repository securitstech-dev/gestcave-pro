import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Upload, CreditCard, CheckCircle2, Copy, Info, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PageAbonnement = () => {
  const { profil } = useAuthStore();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [forfaitChoisi, setForfaitChoisi] = useState<any>(null);
  const [fichier, setFichier] = useState<File | null>(null);

  const forfaits = [
    { 
      id: 'mensuel', 
      nom: 'Mensuel', 
      prix: '15 000 FCFA', 
      montant: 15000,
      desc: 'Accès complet pendant 1 mois. Idéal pour tester.',
      populaire: false 
    },
    { 
      id: 'trimestriel', 
      nom: 'Trimestriel', 
      prix: '40 000 FCFA', 
      montant: 40000,
      desc: '3 mois d\'accès complet. Économisez 5 000 F.',
      populaire: true 
    },
    { 
      id: 'annuel', 
      nom: 'Annuel', 
      prix: '150 000 FCFA', 
      montant: 150000,
      desc: '12 mois au prix de 10. La meilleure offre.',
      populaire: false 
    },
  ];

  const gererFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFichier(e.target.files[0]);
    }
  };

  const envoyerPaiement = async () => {
    if (!fichier || !forfaitChoisi) return;
    setChargement(true);
    
    try {
      // 1. Upload l'image sur Firebase Storage
      const extension = fichier.name.split('.').pop();
      const nomFichier = `preuves/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const imageRef = ref(storage, nomFichier);
      
      const snapshot = await uploadBytes(imageRef, fichier);
      const urlPreuve = await getDownloadURL(snapshot.ref);

      // 2. Créer l'entrée dans Firestore
      await addDoc(collection(db, 'paiements'), {
        etablissement_id: profil?.etablissement_id || '',
        montant: forfaitChoisi.montant,
        statut: 'en_attente',
        preuve_url: urlPreuve,
        date: new Date().toISOString()
      });
      
      toast.success('Preuve envoyée ! Votre abonnement sera activé après vérification par notre équipe.');
      setEtape(4);
    } catch (erreur: any) {
      toast.error(erreur.message || 'Erreur lors de l\'envoi de la preuve');
    } finally {
      setChargement(false);
    }
  };

  const copierNumero = (texte: string) => {
    navigator.clipboard.writeText(texte);
    toast.success('Numéro copié dans le presse-papier !');
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <button 
            onClick={() => navigate('/tableau-de-bord')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} /> Retour au tableau de bord
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-4">Gestion de l'abonnement</h1>
            <p className="text-slate-400 text-lg">Choisissez votre forfait et payez via Mobile Money</p>
          </div>
        </header>

        <div className="flex justify-center items-center gap-2 mb-12">
          {['Forfait', 'Paiement', 'Preuve'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                etape > i + 1 ? 'bg-accent/20 text-accent' :
                etape === i + 1 ? 'bg-primary/20 text-primary border border-primary/30' : 
                'bg-white/5 text-slate-500'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  etape > i + 1 ? 'bg-accent text-white' :
                  etape === i + 1 ? 'bg-primary text-white' : 'bg-slate-700'
                }`}>{etape > i + 1 ? '✓' : i + 1}</span>
                {label}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 ${etape > i + 1 ? 'bg-accent' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {etape === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
            {forfaits.map((f) => (
              <div 
                key={f.id}
                onClick={() => { setForfaitChoisi(f); setEtape(2); }}
                className={`glass-card p-8 border-2 cursor-pointer transition-all group relative ${
                  f.populaire ? 'border-primary hover:border-primary' : 'border-transparent hover:border-primary/50'
                }`}
              >
                {f.populaire && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    Recommandé
                  </div>
                )}
                <CreditCard className="text-slate-500 group-hover:text-primary mb-4 transition-colors" size={32} />
                <h3 className="text-2xl font-bold mb-2">{f.nom}</h3>
                <p className="text-3xl font-display font-extrabold text-primary mb-4">{f.prix}</p>
                <p className="text-slate-400 mb-6 text-sm">{f.desc}</p>
                <button className="btn-secondary w-full group-hover:bg-primary group-hover:text-white transition-all">
                  Sélectionner
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {etape === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Smartphone className="text-primary" /> Instructions Mobile Money
            </h3>
            
            <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Forfait sélectionné : <strong>{forfaitChoisi?.nom}</strong> — <strong>{forfaitChoisi?.prix}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">🔴 Airtel Money Congo</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-mono text-white tracking-widest">+242 05 302 8383</span>
                  <button onClick={() => copierNumero('+242053028383')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy size={18} className="text-primary" />
                  </button>
                </div>
              </div>

              <div className="p-5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">🟡 MTN Mobile Money Congo</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-mono text-white tracking-widest">+242 06 881 7104</span>
                  <button onClick={() => copierNumero('+242068817104')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy size={18} className="text-primary" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-300/90">
                  <p className="font-medium mb-1">Comment procéder :</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-400/80">
                    <li>Envoyez <strong>{forfaitChoisi?.prix}</strong> au numéro ci-dessus</li>
                    <li>Attendez le SMS de confirmation</li>
                    <li>Prenez une capture d'écran du SMS</li>
                    <li>Cliquez sur « J'ai effectué le paiement »</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setEtape(1)} className="btn-secondary flex-1">Retour</button>
              <button onClick={() => setEtape(3)} className="btn-primary flex-1">J'ai effectué le paiement</button>
            </div>
          </motion.div>
        )}

        {etape === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-lg mx-auto text-center">
            <Upload className="mx-auto text-primary mb-6" size={48} />
            <h3 className="text-2xl font-bold mb-2">Preuve de paiement</h3>
            <p className="text-slate-400 mb-8">Téléchargez la capture d'écran du SMS de confirmation de votre transfert</p>
            
            <div className="mb-8">
              <input 
                type="file" 
                id="preuve" 
                className="hidden" 
                accept="image/*"
                onChange={gererFichier}
              />
              <label 
                htmlFor="preuve"
                className={`block border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all bg-white/5 ${
                  fichier ? 'border-accent/50 bg-accent/5' : 'border-white/10 hover:border-primary/50'
                }`}
              >
                {fichier ? (
                  <div>
                    <CheckCircle2 className="mx-auto text-accent mb-2" size={24} />
                    <span className="text-white font-medium">{fichier.name}</span>
                    <p className="text-xs text-slate-500 mt-1">Cliquez pour changer de fichier</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-slate-500 mb-2" size={24} />
                    <span className="text-slate-500">Cliquez pour choisir un fichier</span>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setEtape(2)} className="btn-secondary flex-1">Retour</button>
              <button 
                onClick={envoyerPaiement}
                disabled={!fichier || chargement}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chargement ? 'Envoi en cours...' : 'Confirmer le paiement'}
              </button>
            </div>
          </motion.div>
        )}

        {etape === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="flex justify-center mb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="bg-accent/20 p-8 rounded-full"
              >
                <CheckCircle2 className="text-accent w-20 h-20" />
              </motion.div>
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">Paiement reçu !</h2>
            <p className="text-xl text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
              Votre preuve de paiement a été transmise avec succès. Notre équipe va la vérifier et activer votre abonnement sous 30 minutes.
            </p>
            <button 
              onClick={() => navigate('/tableau-de-bord')} 
              className="btn-primary px-8 py-3 text-lg"
            >
              Retour au tableau de bord
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PageAbonnement;
