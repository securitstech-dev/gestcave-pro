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
    <div className="space-y-4 pb-10 max-w-5xl mx-auto">
      <header>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Configuration Boutique</h2>
        <p className="text-slate-500 font-medium text-[9px] mt-0.5">Personnalisez l'identité de votre établissement.</p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
            {/* Infos Générales */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <Building2 size={16} />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase">Identité</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Nom de l'Etablissement</label>
                        <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-xs" />
                    </div>
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Slogan ou Description</label>
                        <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-600 text-xs" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Email de contact</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-900 text-xs" />
                    </div>
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Téléphone</label>
                        <input type="text" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-bold text-slate-900 text-xs" />
                    </div>
                </div>

                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Adresse Géographique</label>
                    <input type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-900 text-xs" />
                </div>
            </div>

            {/* Extras */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Globe size={16} />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase">Détails opérationnels</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Horaires d'ouverture</label>
                        <input type="text" value={formData.horaires} onChange={e => setFormData({...formData, horaires: e.target.value})}
                          placeholder="Ex: 08h00 - 02h00"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-900 text-xs" />
                    </div>
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Site Web / Facebook</label>
                        <input type="text" value={formData.siteWeb} onChange={e => setFormData({...formData, siteWeb: e.target.value})}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none font-medium text-slate-900 text-xs" />
                    </div>
                </div>
            </div>
        </div>

        <aside className="space-y-4">
            {/* Logo Preview */}
            <div className="bg-slate-900 p-6 rounded-2xl text-white text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">Logo établissement</p>
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4 overflow-hidden border border-white/5">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Image size={24} className="text-slate-700" />
                    )}
                </div>
                <input 
                  type="text" 
                  value={formData.logo} 
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                  placeholder="URL du logo..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-medium outline-none text-slate-300 mb-2"
                />
                <p className="text-[8px] text-slate-500 italic leading-tight">Apparaîtra sur vos reçus.</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <h4 className="font-black text-slate-900 text-[10px] uppercase">Sécurité</h4>
                </div>
                <p className="text-[9px] text-slate-600 leading-relaxed mb-4">Seul l'administrateur peut modifier ces informations.</p>
                
                <button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Save size={14} /> Enregistrer
                </button>
            </div>
        </aside>
      </form>
    </div>
  );
};

export default GestionEtablissement;
