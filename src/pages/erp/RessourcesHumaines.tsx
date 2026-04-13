import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Calendar, Briefcase, Plus } from 'lucide-react';
import type { Employe } from '../../types/erp';

const EMPLOYES_DEMO: Employe[] = [
  { id: '1', nom: 'Moukassa', prenom: 'Jean', role: 'serveur', salaire_base: 50000, telephone: '06 123 4567', etablissement_id: 'e1' },
  { id: '2', nom: 'Ibara', prenom: 'Alice', role: 'caissier', salaire_base: 80000, telephone: '05 987 6543', etablissement_id: 'e1' },
  { id: '3', nom: 'Kolelas', prenom: 'Paul', role: 'cuisinier', salaire_base: 120000, telephone: '04 555 1234', etablissement_id: 'e1' },
];

const RessourcesHumaines = () => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Ressources Humaines</h2>
          <p className="text-slate-400 mt-1">Gestion des employés et de la paie</p>
        </div>
        <button className="btn-primary py-2 flex items-center gap-2">
          <Plus size={18} /> Ajouter un employé
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="font-bold text-lg">Liste du personnel</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nom & Prénom</th>
                <th className="px-6 py-4 font-semibold">Rôle</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold text-right">Salaire Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {EMPLOYES_DEMO.map(emp => (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {emp.prenom[0]}{emp.nom[0]}
                    </div>
                    {emp.prenom} {emp.nom}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{emp.telephone}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{emp.salaire_base.toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-accent">
               <DollarSign size={20} /> Module de Paie
             </h3>
             <p className="text-sm text-slate-400 mb-6">Sélectionnez le mois pour générer les fiches de paie et l'historique comptable.</p>
             
             <div className="flex bg-slate-900 rounded-xl mb-4 overflow-hidden">
               <div className="p-3 bg-slate-800 text-slate-400 border-r border-white/5"><Calendar size={20}/></div>
               <select className="flex-1 bg-transparent px-4 font-medium outline-none">
                 <option>Avril 2026</option>
                 <option>Mars 2026</option>
                 <option>Février 2026</option>
               </select>
             </div>

             <button className="w-full btn-secondary text-sm py-3 mb-2">Historique des paies</button>
             <button className="w-full btn-primary text-sm py-3">Exécuter la paie du mois</button>
          </div>
          
          <div className="glass-card p-6 border-l-4 border-l-yellow-500 bg-yellow-500/5">
             <h4 className="font-bold text-yellow-500 mb-2">Masse salariale</h4>
             <p className="text-3xl font-display font-bold">250 000 F</p>
             <p className="text-xs text-yellow-500/70 mt-1">Total mensuel hors primes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RessourcesHumaines;
