import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Landmark, FileText, RefreshCcw, ChevronDown, Info } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GrandLivre = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;

  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState<any>(null);
  const [etablissementNom, setEtablissementNom] = useState('Mon Établissement');

  const chargerRapport = async () => {
    if (!etablissementId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const debut = new Date(annee, mois - 1, 1);
      const fin = new Date(annee, mois, 0, 23, 59, 59);

      // 1. CA Réel (transactions_pos)
      const qTrans = query(collection(db, 'transactions_pos'),
        where('etablissement_id', '==', etablissementId),
        where('date', '>=', debut.toISOString()),
        where('date', '<=', fin.toISOString())
      );
      const snapTrans = await getDocs(qTrans);
      const transactions = snapTrans.docs.map(d => d.data());
      
      // CA Réel = Uniquement les transactions finales (pour éviter les doublons avec acomptes)
      const transactionsFinales = transactions.filter(t => t.type === 'final');
      const caTotal = transactionsFinales.reduce((s, t) => s + (Number(t.totalVente || t.montant) || 0), 0);
      
      const caEspeces = transactionsFinales.filter(t => t.modePaiement === 'especes' || t.modePaiement === 'comptant').reduce((s, t) => s + (Number(t.montant) || 0), 0);
      const caMobile = transactionsFinales.filter(t => t.modePaiement === 'mobile').reduce((s, t) => s + (Number(t.montant) || 0), 0);
      const caCarte = transactionsFinales.filter(t => t.modePaiement === 'carte').reduce((s, t) => s + (Number(t.montant) || 0), 0);
      const caCredit = transactionsFinales.filter(t => t.modePaiement === 'credit').reduce((s, t) => s + (Number(t.totalVente) || 0), 0);

      // 2. Charges fixes saisies
      const qCharges = query(collection(db, 'charges_fixes'),
        where('etablissement_id', '==', etablissementId),
        where('date', '>=', debut.toISOString()),
        where('date', '<=', fin.toISOString())
      );
      const snapCharges = await getDocs(qCharges);
      const charges = snapCharges.docs.map(d => d.data());
      const totalCharges = charges.reduce((s, c) => s + (c.montant || 0), 0);

      // 3. Achats fournisseurs
      const qAchats = query(collection(db, 'achats_fournisseurs'),
        where('etablissement_id', '==', etablissementId),
        where('date', '>=', debut.toISOString()),
        where('date', '<=', fin.toISOString())
      );
      const snapAchats = await getDocs(qAchats);
      const totalAchats = snapAchats.docs.reduce((s, d) => s + (d.data().montantTotal || 0), 0);

      // 4. Masse salariale (via pointages + barème)
      const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', etablissementId));
      const snapEmp = await getDocs(qEmp);
      const employes = snapEmp.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      const qSessions = query(collection(db, 'pointage_presence'),
        where('etablissement_id', '==', etablissementId),
        where('debut', '>=', Timestamp.fromDate(debut)),
        where('debut', '<=', Timestamp.fromDate(fin))
      );
      const snapSessions = await getDocs(qSessions);
      const sessionsPointage = snapSessions.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      let masseSalariale = 0;
      employes.forEach(emp => {
        const sessEmp = sessionsPointage.filter(s => s.employe_id === emp.id);
        if (emp.typeSalaire === 'mensuel') {
          if (sessEmp.length > 0) masseSalariale += emp.salaire || 0;
        } else if (emp.typeSalaire === 'journalier') {
          const jours = new Set(sessEmp.map((s: any) => {
            const d = s.debut?.toMillis ? new Date(s.debut.toMillis()) : new Date(s.debut);
            return d.toISOString().split('T')[0];
          })).size;
          masseSalariale += jours * (emp.salaire || 0);
        } else if (emp.typeSalaire === 'horaire') {
          let mins = 0;
          sessEmp.forEach((s: any) => {
            if (s.debut && s.fin) {
              const d1 = s.debut?.toMillis ? s.debut.toMillis() : new Date(s.debut).getTime();
              const d2 = s.fin?.toMillis ? s.fin.toMillis() : new Date(s.fin).getTime();
              mins += (d2 - d1) / 60000;
            }
          });
          masseSalariale += Math.floor((mins / 60) * (emp.salaire || 0));
        }
      });

      // 5. Calculs fiscaux Congo
      const tva = caTotal * 0.18;
      const taxeLoisirs = caTotal * 0.05;
      const taxeTourisme = caTotal * 0.02;
      const cnss = masseSalariale * 0.165;
      const totalChargesExploit = totalAchats + totalCharges + masseSalariale + cnss + taxeLoisirs + taxeTourisme;
      const resultatBrut = caTotal - totalChargesExploit;
      const is = resultatBrut > 0 ? resultatBrut * 0.30 : 0;
      const resultatNet = resultatBrut - is;

      // Établissement nom
      const qEtab = await getDocs(query(collection(db, 'etablissements'), where('__name__', '==', etablissementId)));
      if (!qEtab.empty) setEtablissementNom(qEtab.docs[0].data().nom || 'Mon Établissement');

      setRapport({
        caTotal, caEspeces, caMobile, caCarte, caCredit,
        totalCharges, totalAchats, masseSalariale,
        tva, taxeLoisirs, taxeTourisme, cnss, is,
        totalChargesExploit, resultatBrut, resultatNet,
        nbTransactions: transactions.length,
        nbEmployes: employes.length,
        nbPointages: sessionsPointage.length,
        charges, transactions: transactions.slice(0, 10)
      });
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerRapport(); }, [mois, annee, etablissementId]);

  const exporterPDF = () => {
    if (!rapport) return;
    const doc = new jsPDF();
    const periodeStr = new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();

    // En-tête
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text('GESTCAVE PRO', 14, 20);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('GRAND LIVRE COMPTABLE & FISCAL', 14, 30);
    doc.text(`${etablissementNom.toUpperCase()} — PÉRIODE : ${periodeStr}`, 14, 38);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 150, 38);

    // KPIs
    doc.setTextColor(30, 58, 138); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('INDICATEURS CLÉS', 14, 55);
    autoTable(doc, {
      startY: 58,
      body: [
        ['Chiffre d\'Affaires Total', `${rapport.caTotal.toLocaleString()} XAF`, 'Transactions', `${rapport.nbTransactions}`],
        ['Résultat Net', `${rapport.resultatNet.toLocaleString()} XAF`, 'Employés Actifs', `${rapport.nbEmployes}`],
      ],
      bodyStyles: { fontSize: 9, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      columnStyles: { 0: { textColor: [100,116,139] }, 2: { textColor: [100,116,139] } }
    });

    // Détail CA
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['CHIFFRE D\'AFFAIRES PAR MODE DE PAIEMENT', 'MONTANT (XAF)']],
      body: [
        ['Espèces / Comptant', rapport.caEspeces.toLocaleString()],
        ['Mobile Money', rapport.caMobile.toLocaleString()],
        ['Carte Bancaire', rapport.caCarte.toLocaleString()],
        ['Crédit Client', rapport.caCredit.toLocaleString()],
        ['TOTAL CA', rapport.caTotal.toLocaleString()],
      ],
      headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      foot: [['', '']],
    });

    // Charges
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['CHARGES D\'EXPLOITATION', 'MONTANT (XAF)']],
      body: [
        ['Achats Fournisseurs / Approvisionnements', rapport.totalAchats.toLocaleString()],
        ['Charges Fixes (Loyer, Eau, Élec...)', rapport.totalCharges.toLocaleString()],
        ['Masse Salariale Brute', rapport.masseSalariale.toLocaleString()],
        ['CNSS Patronale (16.5%)', rapport.cnss.toLocaleString()],
        ['Taxe Loisirs (5% CA)', rapport.taxeLoisirs.toLocaleString()],
        ['Taxe Tourisme (2% CA)', rapport.taxeTourisme.toLocaleString()],
        ['TOTAL CHARGES', rapport.totalChargesExploit.toLocaleString()],
      ],
      headStyles: { fillColor: [239, 68, 68], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    // Résultat
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['COMPTE DE RÉSULTAT', 'MONTANT (XAF)']],
      body: [
        ['CA Total', rapport.caTotal.toLocaleString()],
        ['(-) Total Charges d\'Exploitation', `- ${rapport.totalChargesExploit.toLocaleString()}`],
        ['= Résultat Brut', rapport.resultatBrut.toLocaleString()],
        ['(-) Impôt sur les Bénéfices IS (30%)', `- ${rapport.is.toLocaleString()}`],
        ['= RÉSULTAT NET', rapport.resultatNet.toLocaleString()],
      ],
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [240, 253, 244], textColor: [5, 150, 105], fontStyle: 'bold' },
    });

    // Pied de page fiscal
    const fy = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(rapport.resultatNet >= 0 ? 5 : 239, rapport.resultatNet >= 0 ? 150 : 68, rapport.resultatNet >= 0 ? 105 : 68);
    doc.rect(14, fy, 182, 20, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`BÉNÉFICE NET DU MOIS : ${rapport.resultatNet.toLocaleString()} XAF`, 105, fy + 13, { align: 'center' });

    doc.setFontSize(7); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
    doc.text('Document généré par GestCave Pro — Fiscalité République du Congo (TVA 18%, IS 30%, CNSS 16.5%)', 105, fy + 30, { align: 'center' });

    doc.save(`GrandLivre_${etablissementNom}_${periodeStr.replace(' ', '_')}.pdf`);
    toast.success('Grand Livre exporté en PDF !');
  };

  const moisNom = new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-60" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-4">
            <BookOpen size={14} /> Grand Livre Comptable
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-2">
            Rapport <span className="text-[#FF7A00]">Financier</span>
          </h1>
          <p className="text-slate-500 font-medium capitalize">{moisNom} · {etablissementNom}</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 flex-wrap justify-center">
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <select value={mois} onChange={e => setMois(Number(e.target.value))} className="bg-white border-none outline-none font-bold text-[10px] uppercase tracking-widest px-4 py-3 text-[#1E3A8A] rounded-xl shadow-sm">
              {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'}).toUpperCase()}</option>)}
            </select>
            <select value={annee} onChange={e => setAnnee(Number(e.target.value))} className="bg-white border-none outline-none font-bold text-[10px] uppercase tracking-widest px-4 py-3 text-[#1E3A8A] rounded-xl shadow-sm">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={chargerRapport} className="h-12 w-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-[#1E3A8A] transition-all">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exporterPDF} disabled={!rapport} className="h-12 px-6 bg-[#1E3A8A] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-blue-900/20 disabled:opacity-40 hover:bg-blue-800 transition-all">
            <Download size={16} /> Exporter PDF
          </button>
        </div>
      </header>

      {loading && (
        <div className="py-32 text-center">
          <div className="w-16 h-16 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-[#1E3A8A] font-bold uppercase tracking-widest text-xs">Compilation du Grand Livre...</p>
        </div>
      )}

      {(!rapport && !loading) && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
            <Info size={48} />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune donnée disponible pour cette période.</p>
        </div>
      )}

      {rapport && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'CA Encaissé', val: rapport.caTotal, icon: <TrendingUp size={20} />, color: 'blue', unit: 'XAF' },
              { label: 'Charges Totales', val: rapport.totalChargesExploit, icon: <TrendingDown size={20} />, color: 'rose', unit: 'XAF' },
              { label: 'Masse Salariale', val: rapport.masseSalariale, icon: <Users size={20} />, color: 'orange', unit: 'XAF' },
              { label: 'Résultat Net', val: rapport.resultatNet, icon: <Landmark size={20} />, color: rapport.resultatNet >= 0 ? 'emerald' : 'rose', unit: 'XAF' },
            ].map((kpi, i) => (
              <div key={i} className={`bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 group hover:scale-[1.02] transition-all`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  kpi.color === 'blue' ? 'bg-blue-50 text-[#1E3A8A]' :
                  kpi.color === 'rose' ? 'bg-rose-50 text-rose-500' :
                  kpi.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                  kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                }`}>{kpi.icon}</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                <p className={`text-3xl font-extrabold tracking-tight ${
                  kpi.color === 'emerald' ? 'text-emerald-600' : kpi.color === 'rose' ? 'text-rose-600' : 'text-[#1E3A8A]'
                }`}>
                  {kpi.val.toLocaleString()} <span className="text-sm font-bold opacity-30">{kpi.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* CA par mode */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center"><DollarSign size={22} /></div>
                <div>
                  <h3 className="font-bold text-[#1E3A8A] text-lg">Ventilation du CA</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Par mode de paiement</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Espèces / Comptant', val: rapport.caEspeces, color: '#1E3A8A' },
                  { label: 'Mobile Money', val: rapport.caMobile, color: '#FF7A00' },
                  { label: 'Carte Bancaire', val: rapport.caCarte, color: '#10b981' },
                  { label: 'Crédit Client', val: rapport.caCredit, color: '#ef4444' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-600">{item.label}</span>
                      <span style={{ color: item.color }}>{item.val.toLocaleString()} XAF</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rapport.caTotal ? (item.val / rapport.caTotal) * 100 : 0}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compte de résultat */}
            <div className="bg-[#1E3A8A] p-8 rounded-[2rem] shadow-xl shadow-blue-900/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><FileText size={22} /></div>
                <div>
                  <h3 className="font-bold text-white text-lg">Compte de Résultat</h3>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">Fiscalité République du Congo</p>
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'CA Total', val: rapport.caTotal, plus: true },
                  { label: 'Achats & Approvisionnements', val: rapport.totalAchats, plus: false },
                  { label: 'Charges Fixes', val: rapport.totalCharges, plus: false },
                  { label: 'Masse Salariale + CNSS', val: rapport.masseSalariale + rapport.cnss, plus: false },
                  { label: 'Taxes Loisirs + Tourisme', val: rapport.taxeLoisirs + rapport.taxeTourisme, plus: false },
                  { label: 'Impôt Société IS (30%)', val: rapport.is, plus: false },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 text-sm font-medium">{row.label}</span>
                    <span className={`font-black text-sm ${row.plus ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.plus ? '+' : '-'} {row.val.toLocaleString()} XAF
                    </span>
                  </div>
                ))}
                <div className={`flex justify-between items-center py-4 px-6 rounded-2xl mt-4 ${rapport.resultatNet >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  <span className="text-white font-black uppercase tracking-widest text-sm">Résultat Net</span>
                  <span className="text-white font-black text-2xl tracking-tight">{rapport.resultatNet.toLocaleString()} XAF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Taxes récapitulatif */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center"><Landmark size={22} /></div>
              <div>
                <h3 className="font-bold text-[#1E3A8A] text-lg">Obligations Fiscales & Sociales</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Réglementation Congo-Brazzaville</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'TVA 18%', val: rapport.tva, note: 'À reverser à la DGI' },
                { label: 'Taxe Loisirs 5%', val: rapport.taxeLoisirs, note: 'Sur CA brut' },
                { label: 'Taxe Tourisme 2%', val: rapport.taxeTourisme, note: 'Sur CA brut' },
                { label: 'CNSS 16.5%', val: rapport.cnss, note: 'Part patronale' },
                { label: 'IS 30%', val: rapport.is, note: 'Sur bénéfice net' },
              ].map((tax, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{tax.label}</p>
                  <p className="text-2xl font-black text-[#FF7A00] tracking-tight mb-2">{Math.round(tax.val).toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">XAF · {tax.note}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GrandLivre;
