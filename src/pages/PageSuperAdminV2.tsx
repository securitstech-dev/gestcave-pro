import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Headphones,
  Landmark,
  LockKeyhole,
  Mail,
  MessageSquare,
  Rocket,
  Search,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query as firestoreQuery } from 'firebase/firestore';
import { db } from '../lib/firebase';

type AdminTab = 'dashboard' | 'demandes' | 'paiements' | 'etablissements' | 'support' | 'finance';

const demoClients = [
  { nom: 'Le Bar Model', ville: 'Pointe-Noire', plan: 'Business', statut: 'Actif', ca: 280000, risque: 'Faible' },
  { nom: 'Cave Atlantic', ville: 'Brazzaville', plan: 'Premium', statut: 'Paiement a verifier', ca: 95000, risque: 'Moyen' },
  { nom: 'VIP Terrasse', ville: 'Dolisie', plan: 'Starter', statut: 'Expire dans 4 jours', ca: 45000, risque: 'Eleve' },
  { nom: 'Market Express', ville: 'Pointe-Noire', plan: 'Essai', statut: 'A convertir', ca: 0, risque: 'Moyen' },
];

const demoDemandes = [
  { nom: 'Chez Odette Lounge', contact: 'odette@example.com', source: 'Landing page', urgence: 'Nouveau' },
  { nom: 'Maquis Central', contact: '+242 06 000 0000', source: 'Commercial', urgence: 'A rappeler' },
  { nom: 'Cave La Reserve', contact: 'reserve@example.com', source: 'WhatsApp', urgence: 'Paiement pret' },
];

const demoPaiements = [
  { client: 'Cave Atlantic', montant: 95000, statut: 'En attente', date: 'Aujourd hui' },
  { client: 'Le Bar Model', montant: 280000, statut: 'Valide', date: 'Ce mois' },
];

const demoTickets = [
  { sujet: 'Activation compte client', client: 'Maquis Central', niveau: 'Urgent' },
  { sujet: 'Probleme impression ticket', client: 'VIP Terrasse', niveau: 'Normal' },
  { sujet: 'Configuration modules', client: 'Market Express', niveau: 'Normal' },
];

const formatMoney = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

const PageSuperAdminV2 = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [query, setQuery] = useState('');
  const [firebaseStatus, setFirebaseStatus] = useState<'connexion' | 'connecte' | 'demo'>('connexion');
  const [liveClients, setLiveClients] = useState<any[]>([]);
  const [liveDemandes, setLiveDemandes] = useState<any[]>([]);
  const [livePaiements, setLivePaiements] = useState<any[]>([]);
  const [liveTickets, setLiveTickets] = useState<any[]>([]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    const failToDemo = (error: unknown) => {
      console.warn('Firebase indisponible pour Super Admin 2.0:', error);
      setFirebaseStatus('demo');
    };

    try {
      unsubs.push(onSnapshot(collection(db, 'etablissements'), (snap) => {
        setLiveClients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setFirebaseStatus('connecte');
      }, failToDemo));

      unsubs.push(onSnapshot(firestoreQuery(collection(db, 'demandes_acces'), orderBy('date_demande', 'desc')), (snap) => {
        setLiveDemandes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setFirebaseStatus('connecte');
      }, failToDemo));

      unsubs.push(onSnapshot(collection(db, 'paiements'), (snap) => {
        setLivePaiements(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setFirebaseStatus('connecte');
      }, failToDemo));

      unsubs.push(onSnapshot(collection(db, 'tickets_support'), (snap) => {
        setLiveTickets(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setFirebaseStatus('connecte');
      }, failToDemo));
    } catch (error) {
      failToDemo(error);
    }

    const timer = window.setTimeout(() => {
      setFirebaseStatus((current) => current === 'connexion' ? 'demo' : current);
    }, 4500);

    return () => {
      window.clearTimeout(timer);
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const clients = useMemo(() => {
    if (!liveClients.length) return demoClients;
    return liveClients.map((client) => ({
      nom: client.nom || client.nom_etablissement || client.contact_principal || 'Etablissement sans nom',
      ville: client.ville || client.departement || 'Non renseigne',
      plan: client.subscription_plan || client.plan || 'Starter',
      statut: client.subscription_status === 'actif' || client.statut === 'actif' ? 'Actif' : client.subscription_status || client.statut || 'A verifier',
      ca: Number(client.ca_mensuel || client.revenu_mensuel || client.total_paye || 0),
      risque: client.subscription_status === 'actif' || client.statut === 'actif' ? 'Faible' : 'Moyen',
    }));
  }, [liveClients]);

  const demandes = useMemo(() => {
    if (!liveDemandes.length) return demoDemandes;
    return liveDemandes.map((demande) => ({
      nom: demande.nom_etablissement || demande.nom || 'Demande sans nom',
      contact: demande.email_contact || demande.telephone || demande.contact || 'Contact non renseigne',
      source: demande.source || 'Firebase',
      urgence: demande.statut || 'Nouveau',
    }));
  }, [liveDemandes]);

  const paiements = useMemo(() => {
    if (!livePaiements.length) return demoPaiements;
    return livePaiements.map((paiement) => ({
      client: paiement.nom_etablissement || paiement.clientNom || paiement.email || 'Client',
      montant: Number(paiement.montant || 0),
      statut: paiement.statut || 'A verifier',
      date: paiement.date_validation || paiement.date || 'Firebase',
    }));
  }, [livePaiements]);

  const tickets = useMemo(() => {
    if (!liveTickets.length) return demoTickets;
    return liveTickets.map((ticket) => ({
      sujet: ticket.sujet || ticket.message || 'Ticket support',
      client: ticket.client || ticket.etablissement || ticket.nom || 'Client',
      niveau: ticket.priorite || ticket.niveau || 'Normal',
    }));
  }, [liveTickets]);

  const [selectedClient, setSelectedClient] = useState(demoClients[0]);

  useEffect(() => {
    setSelectedClient((current) => clients.find((client) => client.nom === current.nom) || clients[0]);
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => `${client.nom} ${client.ville} ${client.plan}`.toLowerCase().includes(q));
  }, [query]);

  const totalCA = clients.reduce((sum, client) => sum + client.ca, 0) || paiements.reduce((sum, paiement) => sum + paiement.montant, 0);
  const actifs = clients.filter((client) => client.statut === 'Actif').length;
  const alertes = clients.filter((client) => client.risque !== 'Faible').length + demandes.length + tickets.filter((ticket) => ticket.niveau === 'Urgent').length;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#12366f] text-white shadow-xl shadow-blue-950/15">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-500">Super Admin 2.0</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-[#12366f] md:text-4xl">Console Centrale</h1>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className={`inline-flex h-12 items-center justify-center rounded-xl px-4 text-[10px] font-black uppercase tracking-widest ${
              firebaseStatus === 'connecte' ? 'bg-emerald-50 text-emerald-700' : firebaseStatus === 'connexion' ? 'bg-blue-50 text-[#12366f]' : 'bg-orange-50 text-orange-700'
            }`}>
              {firebaseStatus === 'connecte' ? 'Firebase connecte' : firebaseStatus === 'connexion' ? 'Connexion Firebase...' : 'Mode demo + secours'}
            </span>
            <Link to="/v2" className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 px-5 text-xs font-black uppercase tracking-widest text-slate-700">
              Pilotage manager
            </Link>
            <Link to="/connexion" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200">
              Connexion reelle
              <LockKeyhole size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-7 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl bg-[#0f1f3a] p-4 text-white shadow-xl shadow-slate-300/40">
          <div className="mb-6 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Navigation</p>
          </div>
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={18} />} label="Vue globale" />
          <NavItem active={activeTab === 'demandes'} onClick={() => setActiveTab('demandes')} icon={<UserPlus size={18} />} label="Demandes d'acces" badge={demandes.length} />
          <NavItem active={activeTab === 'paiements'} onClick={() => setActiveTab('paiements')} icon={<CreditCard size={18} />} label="Paiements" badge={paiements.filter((p) => String(p.statut).toLowerCase().includes('attente')).length || paiements.length} />
          <NavItem active={activeTab === 'etablissements'} onClick={() => setActiveTab('etablissements')} icon={<Building2 size={18} />} label="Etablissements" />
          <NavItem active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<Headphones size={18} />} label="Support" badge={tickets.length} />
          <NavItem active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<Landmark size={18} />} label="Finance interne" />
          <div className="mt-8 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
            <Rocket className="mb-3 text-orange-300" size={24} />
            <p className="text-sm font-black uppercase">Mode demo visible</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
              Cette interface montre la v2 sans attendre un compte super-admin.
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<TrendingUp size={20} />} label="CA total" value={formatMoney(totalCA)} />
            <Metric icon={<Building2 size={20} />} label="Clients actifs" value={`${actifs}/${clients.length}`} />
            <Metric icon={<Mail size={20} />} label="Demandes" value={String(demandes.length)} />
            <Metric icon={<AlertTriangle size={20} />} label="Alertes" value={String(alertes)} warning />
          </div>

          {activeTab === 'dashboard' || activeTab === 'etablissements' ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase text-[#12366f]">Etablissements clients</h2>
                  <p className="text-xs font-semibold text-slate-400">Recherche, statut commercial et risque de churn.</p>
                </div>
                <div className="flex h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 ring-1 ring-slate-200">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher..."
                    className="w-48 bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <button
                    key={client.nom}
                    onClick={() => setSelectedClient(client)}
                    className={`grid w-full gap-4 rounded-xl p-4 text-left transition md:grid-cols-[1fr_130px_130px_40px] md:items-center ${
                      selectedClient.nom === client.nom ? 'bg-blue-50 ring-2 ring-[#12366f]/20' : 'bg-slate-50 ring-1 ring-slate-100 hover:bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-black text-slate-900">{client.nom}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{client.ville} | Plan {client.plan}</p>
                    </div>
                    <Status label={client.statut} />
                    <p className="text-sm font-black text-slate-700">{formatMoney(client.ca)}</p>
                    <ArrowRight className="text-slate-400" size={18} />
                  </button>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-widest text-orange-500">Client selectionne</p>
                <h2 className="mt-2 text-2xl font-black uppercase text-[#12366f]">{selectedClient.nom}</h2>
                <div className="mt-5 space-y-3">
                  <Detail label="Ville" value={selectedClient.ville} />
                  <Detail label="Plan" value={selectedClient.plan} />
                  <Detail label="Revenu" value={formatMoney(selectedClient.ca)} />
                  <Detail label="Risque" value={selectedClient.risque} />
                </div>
                <button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#12366f] text-xs font-black uppercase tracking-widest text-white">
                  Ouvrir inspection
                  <ArrowRight size={16} />
                </button>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase text-[#12366f]">Demandes urgentes</h2>
                  <MessageSquare className="text-orange-500" size={20} />
                </div>
                <div className="space-y-3">
                  {demandes.map((demande) => (
                    <div key={demande.nom} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <p className="font-black text-slate-800">{demande.nom}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{demande.contact}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{demande.source}</span>
                        <span className="rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-600">{demande.urgence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
          ) : null}

          {activeTab === 'demandes' ? (
            <ListPanel
              title="Demandes d'acces"
              subtitle="Demandes lues depuis Firebase si disponible."
              rows={demandes.map((demande) => ({
                title: demande.nom,
                meta: demande.contact,
                value: demande.source,
                badge: demande.urgence,
              }))}
            />
          ) : null}

          {activeTab === 'paiements' ? (
            <ListPanel
              title="Paiements"
              subtitle="Validation commerciale et suivi des montants."
              rows={paiements.map((paiement) => ({
                title: paiement.client,
                meta: String(paiement.date),
                value: formatMoney(paiement.montant),
                badge: paiement.statut,
              }))}
            />
          ) : null}

          {activeTab === 'support' ? (
            <ListPanel
              title="Support client"
              subtitle="Tickets et messages a traiter."
              rows={tickets.map((ticket) => ({
                title: ticket.sujet,
                meta: ticket.client,
                value: 'Support',
                badge: ticket.niveau,
              }))}
            />
          ) : null}

          {activeTab === 'finance' ? (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-black uppercase text-[#12366f]">Finance interne</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Vue simple des revenus et encaissements.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Metric icon={<TrendingUp size={20} />} label="Revenus calcules" value={formatMoney(totalCA)} />
                <Metric icon={<CreditCard size={20} />} label="Pieces paiement" value={String(paiements.length)} />
                <Metric icon={<AlertTriangle size={20} />} label="A traiter" value={String(paiements.filter((p) => String(p.statut).toLowerCase().includes('attente')).length)} warning />
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
};

const NavItem = ({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick: () => void }) => (
  <button onClick={onClick} className={`mb-1 flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-black transition ${active ? 'bg-white text-[#12366f]' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}>
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {badge ? <span className="rounded-lg bg-orange-500 px-2 py-1 text-[10px] text-white">{badge}</span> : null}
  </button>
);

const Metric = ({ icon, label, value, warning }: { icon: React.ReactNode; label: string; value: string; warning?: boolean }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${warning ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-[#12366f]'}`}>{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
  </div>
);

const Status = ({ label }: { label: string }) => {
  const positive = label === 'Actif';
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
      {positive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {label}
    </span>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-slate-100 py-3">
    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-sm font-black text-slate-800">{value}</span>
  </div>
);

const ListPanel = ({ title, subtitle, rows }: { title: string; subtitle: string; rows: Array<{ title: string; meta: string; value: string; badge: string }> }) => (
  <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <h2 className="text-xl font-black uppercase text-[#12366f]">{title}</h2>
    <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>
    <div className="mt-6 space-y-3">
      {rows.map((row, index) => (
        <div key={`${row.title}-${index}`} className="grid gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 md:grid-cols-[1fr_160px_150px] md:items-center">
          <div>
            <p className="font-black text-slate-900">{row.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{row.meta}</p>
          </div>
          <p className="text-sm font-black text-slate-700">{row.value}</p>
          <span className="w-fit rounded-lg bg-orange-50 px-3 py-2 text-[10px] font-black uppercase text-orange-700">{row.badge}</span>
        </div>
      ))}
    </div>
  </section>
);

export default PageSuperAdminV2;
