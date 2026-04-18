import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Calendar, Download, Users, 
  ArrowUpRight, ArrowDownRight, Printer, 
  Search, Filter, ChevronRight, CheckCircle2,
  AlertCircle, Briefcase, Clock, MapPin, Home,
  FileText, Percent
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import StatCard from '../../components/ui/StatCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employe {
  id: string;
  nom: string;
  role: string;
  salaire: number;
  typeSalaire: 'mensuel' | 'horaire' | 'journalier';
  primes?: { transport: number; logement: number; autres: number; };
}

interface SessionTravail {
  id: string;
  employe_id: string;
  debut: string;
  fin: string | null;
  poste: string;
}

interface Avance {
  employe_id: string;
  montant: number;
  date: string;
}

const GestionPaie = () => {
  const { profil } = useAuthStore();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [sessions, setSessions] = useState<SessionTravail[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [etablissementNom, setEtablissementNom] = useState('Mon Établissement');
  const [loading, setLoading] = useState(true);
  
  const [moisSelectionne, setMoisSelectionne] = useState(new Date().getMonth() + 1);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!profil?.etablissement_id) return;

    const debutMois = new Date(anneeSelectionnee, moisSelectionne - 1, 1);
    const finMois = new Date(anneeSelectionnee, moisSelectionne, 0, 23, 59, 59);

    const chargerEtablissement = async () => {
      try {
        const docRef = doc(db, 'etablissements', profil.etablissement_id);
        const snap = await getDoc(docRef);
        if (snap.exists()) setEtablissementNom(snap.data().nom || 'Mon Établissement');
      } catch (e) {}
    };
    chargerEtablissement();

    // Charger les employés
    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubEmp = onSnapshot(qEmp, (snap) => {
      setEmployes(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[]);
    });

    // Charger les sessions de travail du mois
    const qSessions = query(
      collection(db, 'pointage_presence'), 
      where('etablissement_id', '==', profil.etablissement_id),
      where('debut', '>=', Timestamp.fromDate(debutMois)),
      where('debut', '<=', Timestamp.fromDate(finMois))
    );
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionTravail[]);
    });

    // Charger les avances du mois
    const qAvances = query(
      collection(db, 'avances'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString()),
      where('date', '<=', finMois.toISOString())
    );
    const unsubAvances = onSnapshot(qAvances, (snap) => {
      setAvances(snap.docs.map(d => d.data()) as Avance[]);
    });

    // Charger les transactions pour les commissions
    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString()),
      where('date', '<=', finMois.toISOString())
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => d.data()));
      setLoading(false);
    });

    return () => { unsubEmp(); unsubSessions(); unsubAvances(); unsubTrans(); };
  }, [profil?.etablissement_id, moisSelectionne, anneeSelectionnee]);

  const calculerBulletin = (emp: Employe) => {
    const sessionsEmp = sessions.filter(s => s.employe_id === emp.id);
    const avancesEmp = avances.filter(a => a.employe_id === emp.id).reduce((acc, a) => acc + a.montant, 0);
    const ventesEmp = transactions.filter(t => t.serveurId === emp.id).reduce((acc, t) => acc + (t.total || 0), 0);
    const commission = emp.role === 'serveur' ? Math.floor(ventesEmp * 0.02) : 0;

    let salaireBase = 0;
    let presence = 0; // Jours ou Heures

    if (emp.typeSalaire === 'mensuel') {
      salaireBase = emp.salaire || 0;
      presence = sessionsEmp.length > 0 ? 1 : 0; 
    } else if (emp.typeSalaire === 'journalier') {
      const joursUniques = new Set(sessionsEmp.map(s => {
        const d = (s as any).debut as Timestamp;
        return new Date(d.toMillis()).toISOString().split('T')[0];
      }));
      presence = joursUniques.size;
      salaireBase = presence * (emp.salaire || 0);
    } else if (emp.typeSalaire === 'horaire') {
      let totalMinutes = 0;
      sessionsEmp.forEach((s: any) => {
        if (s.debut && s.fin) {
          let diffMs = (s.fin as Timestamp).toMillis() - (s.debut as Timestamp).toMillis();
          
          // Déduction des pauses
          if (s.pauses && Array.isArray(s.pauses)) {
            s.pauses.forEach((p: any) => {
              if (p.debut && p.fin) {
                diffMs -= (p.fin as Timestamp).toMillis() - (p.debut as Timestamp).toMillis();
              }
            });
          }
          
          totalMinutes += diffMs / 60000;
        }
      });
      presence = Math.round((totalMinutes / 60) * 10) / 10;
      salaireBase = Math.floor(presence * (emp.salaire || 0));
    }

    const primesTransport = emp.primes?.transport || 0;
    const primesLogement = emp.primes?.logement || 0;
    const brut = salaireBase + primesTransport + primesLogement + commission;
    const net = brut - avancesEmp;

    return { salaireBase, presence, commission, primesTransport, primesLogement, brut, avances: avancesEmp, net };
  };

  const genererBulletinPDF = (emp: Employe) => {
    const { salaireBase, presence, commission, primesTransport, primesLogement, brut, avances, net } = calculerBulletin(emp);
    const doc = new jsPDF();
    const dateStr = `${moisSelectionne}/${anneeSelectionnee}`;

    // Header
    doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("GESTCAVE PRO", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`BULLETIN DE PAIE - ${dateStr}`, 14, 28);
    
    doc.setDrawColor(241, 245, 249); doc.line(14, 35, 196, 35);

    // Infos Employé
    doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, 'bold'); doc.text("EMPLOYÉ", 14, 45);
    doc.setFont(undefined, 'normal'); doc.text(`${emp.nom}`, 14, 52);
    doc.text(`Rôle: ${emp.role.toUpperCase()}`, 14, 58);
    doc.text(`Identifiant: ${emp.id.slice(-6).toUpperCase()}`, 14, 64);

    // Infos Entreprise
    doc.setFont(undefined, 'bold'); doc.text("ÉTABLISSEMENT", 120, 45);
    doc.setFont(undefined, 'normal'); doc.text(`${etablissementNom}`, 120, 52);
    doc.text(`Période: ${dateStr}`, 120, 58);

    // Tableau des rubriques
    autoTable(doc, {
      startY: 80,
      head: [['Désignation', 'Base / Quantité', 'Taux / Montant', 'Gains', 'Retenues']],
      body: [
        ['Salaire de Base', `${presence} ${emp.typeSalaire === 'horaire' ? 'H' : 'J'}`, `${emp.salaire.toLocaleString()} F`, `${salaireBase.toLocaleString()} F`, '-'],
        ['Indemnité de Transport', '-', '-', `${primesTransport.toLocaleString()} F`, '-'],
        ['Indemnité de Logement', '-', '-', `${primesLogement.toLocaleString()} F`, '-'],
        ['Commissions sur Ventes (2%)', '-', '-', `${commission.toLocaleString()} F`, '-'],
        ['Avances & Prêts', '-', '-', '-', `${avances.toLocaleString()} F`],
      ],
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      foot: [['TOTAL', '', '', `${brut.toLocaleString()} F`, `${avances.toLocaleString()} F`]],
      footStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Total Net
    doc.setFillColor(248, 250, 252); doc.rect(120, finalY, 76, 15, 'F');
    doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(5, 150, 105);
    doc.text(`NET À PAYER : ${net.toLocaleString()} F`, 125, finalY + 10);

    // Signatures
    doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text("Signature Employeur", 40, finalY + 40);
    doc.text("Signature Employé", 140, finalY + 40);

    doc.save(`Bulletin_${emp.nom.replace(' ', '_')}_${dateStr}.pdf`);
    toast.success(`Bulletin généré pour ${emp.nom}`);
  };

  const masseSalarialeTotale = employes.reduce((acc, emp) => acc + calculerBulletin(emp).net, 0);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Calcul de la paie en cours...</div>;

  return (
    <div className="space-y-4 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-black text-slate-900 tracking-tight uppercase">Centre de Paie</h2>
          <p className="text-slate-500 font-medium text-[10px]">Génération des bulletins et suivi des rémunérations.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <select 
              value={moisSelectionne} 
              onChange={(e) => setMoisSelectionne(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest px-2"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'})}</option>
              ))}
            </select>
            <select 
              value={anneeSelectionnee} 
              onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest px-2 border-l border-slate-100"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Masse Salariale" valeur={`${masseSalarialeTotale.toLocaleString()}`} suffix="F" color="emerald" important subtext={`Pour ${new Date(0, moisSelectionne-1).toLocaleString('fr-FR', {month: 'long'})}`} />
          <StatCard label="Bulletins" valeur={employes.length} subtext="À traiter" color="slate" />
          <StatCard label="Sessions" valeur={sessions.length} subtext="Pointages enregistrés" color="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4">
          {employes.map(emp => {
            const data = calculerBulletin(emp);
            return (
              <motion.div 
                key={emp.id}
                layout
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group"
              >
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {emp.role === 'serveur' ? '🤵' : emp.role === 'caissier' ? '💰' : '👨‍🍳'}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-md leading-none mb-1.5">{emp.nom}</h3>
                        <div className="flex gap-2">
                           <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded tracking-widest uppercase">{emp.role}</span>
                           <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded tracking-widest uppercase">{emp.typeSalaire}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 border-l border-slate-50">
                    <div className="text-center md:text-left">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Présence</p>
                        <p className="font-black text-slate-900 text-xs">
                          {data.presence} {emp.typeSalaire === 'horaire' ? 'H' : 'J'}
                        </p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Gains Brut</p>
                        <p className="font-black text-emerald-600 text-xs">+{data.brut.toLocaleString()} F</p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Avances</p>
                        <p className="font-black text-rose-500 text-xs">-{data.avances.toLocaleString()} F</p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Net à Payer</p>
                        <p className="font-black text-slate-950 text-md tracking-tighter">{data.net.toLocaleString()} F</p>
                    </div>
                </div>

                <button 
                  onClick={() => genererBulletinPDF(emp)}
                  className="px-6 py-3 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  <Printer size={16} /> Imprimer
                </button>
              </motion.div>
            );
          })}

          {employes.length === 0 && (
            <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                <Users size={48} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">Aucun employé à rémunérer</p>
            </div>
          )}
      </div>

      {/* Info Card */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-600/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-10">
              <Percent size={120} />
          </div>
          <div className="flex-1 space-y-3 relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tight">Optimisation Fiscale</h3>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed max-w-xl">
                  Les indemnités de transport et de logement sont calculées hors-taxes pour réduire vos charges patronales. 
                  Le système de pointage garantit que vous ne payez que le temps réel de travail effectué.
              </p>
          </div>
          <div className="shrink-0 relative z-10">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-black/10 hover:bg-indigo-50 transition-all active:scale-95">
                  Paramètres RH
              </button>
          </div>
      </div>
    </div>
  );
};

export default GestionPaie;
