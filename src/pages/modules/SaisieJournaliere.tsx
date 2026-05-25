import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Save, RotateCcw, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Printer, Calendar, X, Package, TrendingDown, FileText
} from 'lucide-react';
import { db } from '../../lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, writeBatch
} from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Produit {
  id: string;
  nom: string;
  prix: number;
  prix_achat?: number;
  stockTotal: number;
  stockAlerte: number;
  unitesParCasier?: number;
  emoji?: string;
}

interface LigneVente {
  produitId: string;
  ref: string;
  nom: string;
  prix: number;
  prixAchat: number;
  emoji: string;
  qteVendue: number;
  stockDebut: number;
  stockFin: number;
  stockAlerte: number;
  unitesParCasier: number;
}

// ─── Composant principal ──────────────────────────────────────────────────────
const SaisieJournaliere = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;

  const [produits, setProduits] = useState<Produit[]>([]);
  const [lignes, setLignes] = useState<LigneVente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dateJournee, setDateJournee] = useState(new Date().toISOString().slice(0, 10));
  const [observation, setObservation] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Input refs pour navigation clavier (Tab entre lignes)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Charger les produits depuis Firebase ──────────────────────────────────
  useEffect(() => {
    if (!etablissementId) { setLoading(false); return; }

    const charger = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'produits'),
          where('etablissement_id', '==', etablissementId)
        );
        const snap = await getDocs(q);
        const liste = snap.docs.map((d, idx) => ({
          id: d.id,
          ...(d.data() as Omit<Produit, 'id'>),
        })) as Produit[];

        // Trier par nom
        liste.sort((a, b) => a.nom.localeCompare(b.nom));
        setProduits(liste);

        // Construire les lignes de saisie
        const nouvLignes: LigneVente[] = liste.map((p, i) => ({
          produitId: p.id,
          ref: String(i + 1).padStart(2, '0'),
          nom: p.nom,
          prix: p.prix,
          prixAchat: p.prix_achat || 0,
          emoji: p.emoji || '🍺',
          qteVendue: 0,
          stockDebut: p.stockTotal,
          stockFin: p.stockTotal,
          stockAlerte: p.stockAlerte || 5,
          unitesParCasier: p.unitesParCasier || 12,
        }));
        setLignes(nouvLignes);
      } catch (e) {
        toast.error('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [etablissementId]);

  // ── Mise à jour d'une ligne ───────────────────────────────────────────────
  const majQteVendue = (idx: number, val: number) => {
    setLignes(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const qte = Math.max(0, val);
      return {
        ...l,
        qteVendue: qte,
        stockFin: Math.max(0, l.stockDebut - qte),
      };
    }));
  };

  const majStockDebut = (idx: number, val: number) => {
    setLignes(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const debut = Math.max(0, val);
      return {
        ...l,
        stockDebut: debut,
        stockFin: Math.max(0, debut - l.qteVendue),
      };
    }));
  };

  const majStockFin = (idx: number, val: number) => {
    setLignes(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const fin = Math.max(0, val);
      return {
        ...l,
        stockFin: fin,
        qteVendue: Math.max(0, l.stockDebut - fin),
      };
    }));
  };

  const majPrixAchat = (idx: number, val: number) => {
    // Prix achat est chargé depuis Firebase - non éditable ici
  };

  // ── Totaux ────────────────────────────────────────────────────────────────
  const totalVentes = lignes.reduce((s, l) => s + l.qteVendue * l.prix, 0);
  const totalUnites = lignes.reduce((s, l) => s + l.qteVendue, 0);
  const totalMarge  = lignes.reduce((s, l) => s + l.qteVendue * (l.prix - l.prixAchat), 0);
  const lignesEnAlerte = lignes.filter(l => l.stockFin <= l.stockAlerte);

  // ── Réinitialiser ─────────────────────────────────────────────────────────
  const reinitialiser = () => {
    setLignes(prev => prev.map(l => ({ ...l, qteVendue: 0, stockFin: l.stockDebut })));
    setObservation('');
    setSaved(false);
  };

  // ── Enregistrement ────────────────────────────────────────────────────────
  const enregistrer = async () => {
    if (!etablissementId) return;
    setSaving(true);
    setShowConfirm(false);
    try {
      const batch = writeBatch(db);
      const lignesVendues = lignes.filter(l => l.qteVendue > 0);

      // 1. Mise à jour du stock dans Firebase pour chaque produit vendu
      for (const l of lignesVendues) {
        const ref = doc(db, 'produits', l.produitId);
        batch.update(ref, { stockTotal: l.stockFin });
      }

      // 2. Enregistrement d'une transaction de synthèse journalière
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        type: 'saisie_manuelle',
        date: new Date(dateJournee).toISOString(),
        dateJournee,
        montantTotal: totalVentes,
        totalUnites,
        lignes: lignesVendues.map(l => ({
          produitId: l.produitId,
          nom: l.nom,
          prixUnitaire: l.prix,
          prixAchat: l.prixAchat,
          margeUnitaire: l.prix - l.prixAchat,
          quantite: l.qteVendue,
          montant: l.qteVendue * l.prix,
          margeTotal: l.qteVendue * (l.prix - l.prixAchat),
          stockDebut: l.stockDebut,
          stockFin: l.stockFin,
        })),
        observation,
        caissierNom: profil?.prenom || profil?.nom || 'Gérant',
        etablissement_id: etablissementId,
        createdAt: new Date().toISOString(),
      });

      // 3. Historique des stocks pour chaque ligne
      for (const l of lignesVendues) {
        const hRef = doc(collection(db, 'historique_stocks'));
        batch.set(hRef, {
          produitId: l.produitId,
          produitNom: l.nom,
          type: 'vente_manuelle',
          ancienStock: l.stockDebut,
          nouveauStock: l.stockFin,
          ecart: -(l.qteVendue),
          date: new Date(dateJournee).toISOString(),
          etablissement_id: etablissementId,
        });
      }

      await batch.commit();

      toast.success(`✅ Journée du ${new Date(dateJournee).toLocaleDateString('fr-FR')} enregistrée !`);
      setSaved(true);
    } catch (e: any) {
      toast.error('Erreur : ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const telechargerPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Titre
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138); // #1E3A8A
    doc.text(`Rapport de Journée - ${profil?.etablissement_nom || 'Mon Etablissement'}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date : ${new Date(dateJournee).toLocaleDateString('fr-FR')}`, 14, 28);
    doc.text(`Total Unités : ${totalUnites} | Total Encaissé : ${totalVentes.toLocaleString()} XAF`, 14, 34);

    const tableData = lignes.map(l => [
      l.ref,
      l.nom,
      l.prix.toLocaleString(),
      l.qteVendue.toString(),
      (l.qteVendue * l.prix).toLocaleString(),
      l.stockDebut.toString(),
      l.stockFin.toString()
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Réf', 'Article', 'Prix Vente', 'Qté Vendue', 'Montant', 'Stock Début', 'Stock Fin']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { fontStyle: 'bold', textColor: [255, 122, 0] }, // Qté vendue
        4: { fontStyle: 'bold', textColor: [16, 185, 129] } // Montant
      }
    });

    if (observation) {
      const finalY = (doc as any).lastAutoTable.finalY || 42;
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text('Observations :', 14, finalY + 10);
      doc.setTextColor(100, 100, 100);
      doc.text(observation, 14, finalY + 16, { maxWidth: 180 });
    }

    doc.save(`Rapport_Ventes_${dateJournee}.pdf`);
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-full py-40">
      <div className="flex flex-col items-center gap-6 text-[#1E3A8A]">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-[#1E3A8A] rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest opacity-50">Chargement des articles...</p>
      </div>
    </div>
  );

  const dateAff = new Date(dateJournee + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-6 lg:space-y-8 pb-24 animate-in fade-in duration-700">

      {/* ── En-tête ── */}
      <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full text-[#FF7A00] text-[10px] font-black uppercase tracking-widest mb-4">
            <ClipboardList size={14} /> Saisie Manuelle
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-2">
            Rapport de <span className="text-[#FF7A00]">Journée</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm max-w-md">
            Reportez ici les ventes de votre fiche papier. Les stocks seront mis à jour automatiquement.
          </p>
        </div>

        {/* Date sélecteur */}
        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 w-full md:w-auto">
            <Calendar size={18} className="text-[#FF7A00] shrink-0" />
            <input
              type="date"
              value={dateJournee}
              onChange={e => setDateJournee(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-[#1E3A8A] text-sm w-full"
            />
          </div>
          <p className="text-xs font-bold text-slate-400 capitalize">{dateAff}</p>
        </div>
      </div>

      {/* ── Alerte ruptures ── */}
      {lignesEnAlerte.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-rose-700">
              {lignesEnAlerte.length} article{lignesEnAlerte.length > 1 ? 's' : ''} en alerte de stock
            </p>
            <p className="text-xs text-rose-500 font-medium mt-0.5">
              {lignesEnAlerte.map(l => l.nom).join(' • ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Tableau de saisie ── */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">

        {/* En-tête du tableau — style fiche papier */}
        <div className="bg-[#1E3A8A] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-widest">
              {profil?.etablissement_nom || 'Mon Bar'} — Fiche de Ventes Journalière
            </h2>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-1 capitalize">{dateAff}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-blue-300 text-[10px] font-black uppercase tracking-widest">
            <Package size={14} /> {lignes.length} articles
          </div>
        </div>

        {/* Tableau responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-4 w-10">#</th>
                <th className="px-4 py-4">Article</th>
                <th className="px-4 py-4 text-center w-28">Prix Vente</th>
                <th className="px-4 py-4 text-center w-28 bg-slate-100/80 border-x border-slate-200">Prix Achat</th>
                <th className="px-4 py-4 text-center w-28 bg-orange-50/50 border-x border-orange-100">Qté Vendue</th>
                <th className="px-4 py-4 text-center w-32">Montant</th>
                <th className="px-4 py-4 text-center w-28 bg-emerald-50/50 border-x border-emerald-100">Marge U.</th>
                <th className="px-4 py-4 text-center w-28 bg-emerald-50/50 border-r border-emerald-100">Marge Tot.</th>
                <th className="px-4 py-4 text-center w-28 bg-blue-50/50 border-x border-blue-100">Stk Début</th>
                <th className="px-4 py-4 text-center w-28 bg-blue-50/50">Stk Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lignes.map((l, idx) => {
                const montant = l.qteVendue * l.prix;
                const enAlerte = l.stockFin <= l.stockAlerte;
                return (
                  <tr
                    key={l.produitId}
                    className={`group transition-all ${enAlerte && l.stockFin >= 0 ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}
                  >
                    {/* Référence */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-black text-slate-300">{l.ref}</span>
                    </td>

                    {/* Nom article */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{l.emoji}</span>
                        <div>
                          <p className="font-bold text-[#1E3A8A] text-sm leading-tight">{l.nom}</p>
                          {enAlerte && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">⚠ Stock bas</p>}
                        </div>
                      </div>
                    </td>

                    {/* Prix vente */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-extrabold text-[#1E3A8A] text-sm">{l.prix.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-300 font-bold ml-1">XAF</span>
                    </td>

                    {/* Prix achat — lu depuis Firebase, lecture seule */}
                    <td className="px-4 py-3 text-center bg-slate-50/50 border-x border-slate-100">
                      {l.prixAchat > 0 ? (
                        <>
                          <span className="font-bold text-slate-500 text-sm">{l.prixAchat.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-300 font-bold ml-1">XAF</span>
                        </>
                      ) : (
                        <span className="text-slate-200 text-xs font-bold">—</span>
                      )}
                    </td>

                    {/* Quantité vendue — saisie principale */}
                    <td className="px-2 py-2 bg-orange-50/30 border-x border-orange-100">
                      <input
                        type="number"
                        min={0}
                        value={l.qteVendue === 0 ? '' : l.qteVendue}
                        placeholder="0"
                        onChange={e => majQteVendue(idx, Number(e.target.value) || 0)}
                        ref={el => (inputRefs.current[idx * 3] = el)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            inputRefs.current[(idx + 1) * 3]?.focus();
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            inputRefs.current[(idx - 1) * 3]?.focus();
                          }
                        }}
                        className="w-full h-11 text-center text-xl font-black text-[#FF7A00] bg-white border-2 border-orange-200 rounded-xl outline-none focus:border-[#FF7A00] focus:shadow-[0_0_0_3px_rgba(255,122,0,0.15)] transition-all"
                      />
                    </td>

                    {/* Montant calculé */}
                    <td className="px-4 py-3 text-center">
                      {montant > 0 ? (
                        <span className="font-extrabold text-emerald-600 text-sm">{montant.toLocaleString()} <span className="text-[9px] text-slate-300 font-bold">XAF</span></span>
                      ) : (
                        <span className="text-slate-200 font-bold text-sm">—</span>
                      )}
                    </td>

                    {/* Marge Unitaire = Prix Vente - Prix Achat */}
                    <td className="px-4 py-3 text-center bg-emerald-50/20 border-x border-emerald-100">
                      {l.prixAchat > 0 ? (
                        <span className={`font-extrabold text-sm ${
                          l.prix - l.prixAchat > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {(l.prix - l.prixAchat).toLocaleString()}
                          <span className="text-[9px] text-slate-300 font-bold ml-1">XAF</span>
                        </span>
                      ) : (
                        <span className="text-slate-200 text-sm font-bold">—</span>
                      )}
                    </td>

                    {/* Marge Totale = Marge U. × Qté */}
                    <td className="px-4 py-3 text-center bg-emerald-50/20 border-r border-emerald-100">
                      {l.prixAchat > 0 && l.qteVendue > 0 ? (
                        <span className={`font-extrabold text-sm ${
                          (l.prix - l.prixAchat) * l.qteVendue > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {((l.prix - l.prixAchat) * l.qteVendue).toLocaleString()}
                          <span className="text-[9px] text-slate-300 font-bold ml-1">XAF</span>
                        </span>
                      ) : (
                        <span className="text-slate-200 text-sm font-bold">—</span>
                      )}
                    </td>

                    {/* Stock début */}
                    <td className="px-2 py-2 bg-blue-50/30 border-x border-blue-100">
                      <input
                        type="number"
                        min={0}
                        value={l.stockDebut === 0 ? '' : l.stockDebut}
                        placeholder="0"
                        onChange={e => majStockDebut(idx, Number(e.target.value) || 0)}
                        ref={el => (inputRefs.current[idx * 3 + 1] = el)}
                        className="w-full h-11 text-center text-sm font-bold text-[#1E3A8A] bg-white border border-blue-100 rounded-xl outline-none focus:border-[#1E3A8A] transition-all"
                      />
                    </td>

                    {/* Stock fin */}
                    <td className="px-2 py-2 bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        value={l.stockFin === 0 ? '' : l.stockFin}
                        placeholder="0"
                        onChange={e => majStockFin(idx, Number(e.target.value) || 0)}
                        ref={el => (inputRefs.current[idx * 3 + 2] = el)}
                        className={`w-full h-11 text-center text-sm font-bold bg-white border rounded-xl outline-none transition-all ${
                          enAlerte
                            ? 'text-rose-600 border-rose-300 focus:border-rose-500'
                            : 'text-[#1E3A8A] border-blue-100 focus:border-[#1E3A8A]'
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-[#1E3A8A] text-white">
                <td colSpan={3} className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Totaux de la Journée</span>
                </td>
                <td className="px-2 py-4" />
                <td className="px-4 py-4 text-center">
                  <span className="text-xl font-black text-[#FF7A00]">{totalUnites}</span>
                  <span className="text-[10px] text-blue-300 font-bold ml-1 uppercase">unités</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-xl font-black text-emerald-400">{totalVentes.toLocaleString()}</span>
                  <span className="text-[10px] text-blue-300 font-bold ml-1 uppercase">XAF</span>
                </td>
                <td className="px-4 py-4 text-center bg-emerald-900/20" colSpan={2}>
                  <span className="text-xl font-black text-emerald-300">{totalMarge.toLocaleString()}</span>
                  <span className="text-[10px] text-blue-300 font-bold ml-1 uppercase">XAF marge</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Observations ── */}
      <div className="bg-white p-6 lg:p-8 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-blue-900/5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
          Observations / Notes du Gérant
        </label>
        <textarea
          value={observation}
          onChange={e => setObservation(e.target.value)}
          placeholder="Ex: Panne de frigo, commande spéciale, événement particulier..."
          rows={3}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-[#1E3A8A] transition-all font-medium text-sm text-slate-700 resize-none"
        />
      </div>

      {/* ── Résumé & Actions ── */}
      <div className="bg-white p-6 lg:p-8 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Résumé chiffres */}
          <div className="flex gap-6 lg:gap-10 flex-wrap">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Encaissé</p>
              <p className="text-2xl font-black text-emerald-600">{totalVentes.toLocaleString()} <span className="text-xs text-slate-400">XAF</span></p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unités Vendues</p>
              <p className="text-2xl font-black text-[#1E3A8A]">{totalUnites}</p>
            </div>
            {totalMarge > 0 && (
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marge Brute</p>
                <p className="text-2xl font-black text-emerald-500">{totalMarge.toLocaleString()} <span className="text-xs text-slate-400">XAF</span></p>
              </div>
            )}
            {lignesEnAlerte.length > 0 && (
              <div className="text-center">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Articles Critiques</p>
                <p className="text-2xl font-black text-rose-600">{lignesEnAlerte.length}</p>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={telechargerPDF}
              className="h-14 px-6 bg-slate-100 text-[#1E3A8A] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <FileText size={16} /> Exporter PDF
            </button>
            <button
              onClick={reinitialiser}
              className="h-14 px-6 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} /> Remettre à zéro
            </button>

            {saved ? (
              <div className="h-14 px-8 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={18} /> Journée enregistrée !
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={saving || totalUnites === 0}
                className="h-14 px-8 bg-[#1E3A8A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-40"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
                ) : (
                  <><Save size={16} /> Enregistrer la journée</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de confirmation ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1E3A8A]/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowConfirm(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 transition">
              <X size={20} />
            </button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#1E3A8A] rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white">
                <Save size={36} />
              </div>
              <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Confirmer l'enregistrement</h3>
              <p className="text-slate-400 text-sm font-medium">Vous allez enregistrer :</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Date journée</span>
                <span className="text-sm font-extrabold text-[#1E3A8A] capitalize">{dateAff}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-50 p-5 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total ventes</span>
                <span className="text-lg font-extrabold text-emerald-600">{totalVentes.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between items-center bg-orange-50 p-5 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unités vendues</span>
                <span className="text-lg font-extrabold text-[#FF7A00]">{totalUnites} bouteilles</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 p-5 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Stocks mis à jour</span>
                <span className="text-sm font-extrabold text-[#1E3A8A]">{lignes.filter(l => l.qteVendue > 0).length} articles</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-medium text-center mb-6">
              Les stocks dans Firebase seront automatiquement ajustés.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                Annuler
              </button>
              <button onClick={enregistrer} className="flex-1 h-14 bg-[#1E3A8A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default SaisieJournaliere;
