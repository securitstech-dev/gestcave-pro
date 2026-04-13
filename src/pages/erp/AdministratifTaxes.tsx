import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldAlert, CheckCircle, Upload, BellRing } from 'lucide-react';
import type { Taxe } from '../../types/erp';

const TAXES_DEMO: Taxe[] = [
  { id: '1', nom: 'Patente Commerciale', organisme: 'Impot', montant: 150000, date_echeance: '2026-06-30', statut: 'a_payer', etablissement_id: 'e1' },
  { id: '2', nom: 'Licence Vente d\'Alcool', organisme: 'Police Administrative', montant: 75000, date_echeance: '2026-05-15', statut: 'a_payer', etablissement_id: 'e1' },
  { id: '3', nom: 'Droit d\'auteur (Musique)', organisme: 'ONDELA', montant: 25000, date_echeance: '2026-04-10', statut: 'en_retard', etablissement_id: 'e1' },
  { id: '4', nom: 'Cotisation Mairie', organisme: 'Mairie', montant: 50000, date_echeance: '2026-01-15', statut: 'payee', etablissement_id: 'e1' },
  { id: '5', nom: 'Certificat d\'Hygiène', organisme: 'Service Hygiène', montant: 30000, date_echeance: '2026-08-01', statut: 'a_payer', etablissement_id: 'e1' },
];

const AdministratifTaxes = () => {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-display font-bold">Administratif & Taxes</h2>
        <p className="text-slate-400 mt-1">Gestion des échéances fiscales, licences et coffre-fort numérique.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rappels d'échéances et Taxes */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShieldAlert className="text-primary" size={20} /> Registre des Taxes & Licences
            </h3>
            <button className="text-primary text-sm font-medium hover:underline">Ajouter une taxe</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Désignation</th>
                <th className="px-6 py-4 font-semibold">Organisme</th>
                <th className="px-6 py-4 font-semibold">Échéance</th>
                <th className="px-6 py-4 font-semibold text-right">Montant</th>
                <th className="px-6 py-4 font-semibold text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {TAXES_DEMO.map(taxe => (
                <tr key={taxe.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold">{taxe.nom}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{taxe.organisme}</td>
                  <td className="px-6 py-4 text-sm font-mono">{nouvelleDate(taxe.date_echeance)}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">{taxe.montant.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-center">
                    {taxe.statut === 'payee' && <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-bold">Réglé</span>}
                    {taxe.statut === 'a_payer' && <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold">À payer</span>}
                    {taxe.statut === 'en_retard' && <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-1"><BellRing size={12} /> Retard</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Coffre-fort numérique */}
        <div className="space-y-6">
          <div className="glass-card p-6">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-accent">
               <FileText size={20} /> Coffre-fort Numérique
             </h3>
             <p className="text-sm text-slate-400 mb-6">Stockez vos documents officiels (NIU, RCCM, Licences) ici pour y avoir accès de n'importe où, même lors d'un contrôle de la mairie.</p>
             
             <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer mb-6">
               <Upload className="mx-auto text-slate-500 mb-2" size={24} />
               <p className="text-sm font-medium">Uploader un PDF ou une photo</p>
               <p className="text-xs text-slate-500 mt-1">Sera sécurisé sur nos serveurs</p>
             </div>

             <h4 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">Documents récents</h4>
             <ul className="space-y-3 pl-2">
                <li className="flex items-center gap-3 text-sm hover:text-white transition-colors cursor-pointer text-slate-300">
                  <FileText size={16} className="text-red-400" />
                  RCCM_ETABLISSEMENT.pdf
                </li>
                <li className="flex items-center gap-3 text-sm hover:text-white transition-colors cursor-pointer text-slate-300">
                  <FileText size={16} className="text-blue-400" />
                  RECU_MAIRIE_2026.jpg
                </li>
                <li className="flex items-center gap-3 text-sm hover:text-white transition-colors cursor-pointer text-slate-300">
                  <FileText size={16} className="text-green-400" />
                  NIU_IMPOTS.pdf
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const nouvelleDate = (dateStr: string) => {
  const [annee, mois, jour] = dateStr.split('-');
  return `${jour}/${mois}/${annee}`;
};

export default AdministratifTaxes;
