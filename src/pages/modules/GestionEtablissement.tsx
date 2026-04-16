import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Building2, MapPin, Phone, 
  Store, Save, Image, Globe, Mail, 
  Clock, ShieldCheck, Heart
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const GestionEtablissement = () => {
  const { profil } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    logo: '',
    siteWeb: '',
    horaires: '',
    description: ''
  });

  useEffect(() => {
    const fetchEtab = async () => {
      if (!profil?.etablissement_id) return;
      try {
        const docRef = doc(db, 'etablissements', profil.etablissement_id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFormData(snap.data() as any);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEtab();
  }, [profil?.etablissement_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profil?.etablissement_id) return;
    
    const toastId = toast.loading("Mise à jour...");
    try {
      const docRef = doc(db, 'etablissements', profil.etablissement_id);
      await updateDoc(docRef, formData);
      toast.success("Configuration enregistrée !", { id: toastId });
    } catch {
      toast.error("Échec de la mise à jour", { id: toastId });
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">Chargement de la boutique...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      <header>
        <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Configuration Boutique</h2>
        <p className="text-slate-500 font-medium mt-1">Personnalisez l'identité de votre établissement.</p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
            {/* Infos Générales */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                        <Building2 size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">IDENTITÉ</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nom de l'Etablissement</label>
                        <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Slogan ou Description courte</label>
                        <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-600" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email de contact</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-900" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Téléphone principal</label>
                        <input type="text" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-900" />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Adresse Géographique</label>
                    <input type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-900" />
                </div>
            </div>

            {/* Extras */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Globe size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">DÉTAILS OPÉRATIONNELS</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Horaires d'ouverture</label>
                        <input type="text" value={formData.horaires} onChange={e => setFormData({...formData, horaires: e.target.value})}
                          placeholder="Ex: 08h00 - 02h00"
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-900" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Site Web / Facebook</label>
                        <input type="text" value={formData.siteWeb} onChange={e => setFormData({...formData, siteWeb: e.target.value})}
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-medium text-slate-900" />
                    </div>
                </div>
            </div>
        </div>

        <aside className="space-y-8">
            {/* Logo Preview */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Logo de l'établissement</p>
                <div className="w-32 h-32 mx-auto rounded-[2rem] bg-white/10 flex items-center justify-center mb-8 overflow-hidden group border border-white/5">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Image size={40} className="text-slate-700" />
                    )}
                </div>
                <input 
                  type="text" 
                  value={formData.logo} 
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                  placeholder="URL du logo..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-medium outline-none text-slate-300 mb-4"
                />
                <p className="text-[9px] text-slate-500 italic">Collez l'URL de votre image pour l'afficher sur vos reçus.</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem]">
                <div className="flex items-center gap-4 mb-4">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    <h4 className="font-black text-slate-900 text-sm uppercase">Sécurité</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">Seul l'administrateur peut modifier ces informations. Elles seront utilisées pour générer vos entêtes de <strong className="text-slate-900">Factures & Reçus</strong>.</p>
                
                <button type="submit" className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Save size={18} /> Enregistrer
                </button>
            </div>
        </aside>
      </form>
    </div>
  );
};

export default GestionEtablissement;
