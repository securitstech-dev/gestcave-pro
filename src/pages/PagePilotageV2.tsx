import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Calculator,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  Database,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Store,
  WifiOff,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import EnvironmentStatus from '../components/system/EnvironmentStatus';

type OrderStatus = 'nouvelle' | 'preparation' | 'prete' | 'encaissee';

const initialOrders = [
  { id: 'T-04', table: 'Terrasse 4', serveur: 'Mireille', total: 27500, status: 'nouvelle' as OrderStatus, items: ['2 Primus', '1 Brochette', '1 Eau'] },
  { id: 'V-12', table: 'VIP 2', serveur: 'Jordan', total: 64200, status: 'preparation' as OrderStatus, items: ['1 Champagne', '2 Assiettes mixtes'] },
  { id: 'C-01', table: 'Comptoir', serveur: 'Sarah', total: 8600, status: 'prete' as OrderStatus, items: ['2 Jus', '1 Sandwich'] },
];

const statusFlow: Record<OrderStatus, OrderStatus> = {
  nouvelle: 'preparation',
  preparation: 'prete',
  prete: 'encaissee',
  encaissee: 'encaissee',
};

const statusLabel: Record<OrderStatus, string> = {
  nouvelle: 'Nouvelle',
  preparation: 'Preparation',
  prete: 'Prete',
  encaissee: 'Encaissee',
};

const formatMoney = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

const caveSupremeSales = [
  { produit: 'Heineken', qte: 5, prix: 500 },
  { produit: 'Ngok', qte: 2, prix: 500 },
  { produit: 'Turbo', qte: 4, prix: 500 },
  { produit: '33 Export', qte: 1, prix: 600 },
  { produit: 'Jus Bralico', qte: 7, prix: 300 },
  { produit: 'Gin Tonic Brasco', qte: 2, prix: 600 },
];

const caveSupremeProducts = [
  { produit: 'Primus', prix: 500 },
  { produit: 'Heineken', prix: 500 },
  { produit: 'Ngok', prix: 500 },
  { produit: 'Jus Brasco', prix: 500 },
  { produit: 'Gin Tonic', prix: 600 },
  { produit: 'Turbo', prix: 500 },
  { produit: 'Class', prix: 600 },
  { produit: 'Chateau de France', prix: 500 },
  { produit: '33 Export', prix: 600 },
  { produit: 'Black', prix: 600 },
  { produit: 'Racine', prix: 600 },
  { produit: 'Gin Tonic Bralico', prix: 600 },
  { produit: 'Jus Bralico', prix: 300 },
  { produit: 'Castel', prix: 700 },
  { produit: 'Beaufort', prix: 600 },
  { produit: '3X', prix: 700 },
  { produit: 'Reactor', prix: 500 },
  { produit: 'Booster Rouge', prix: 600 },
  { produit: 'Chill', prix: 600 },
  { produit: 'Synergie', prix: 500 },
  { produit: 'Vival', prix: 300 },
  { produit: 'Gin Tonic Brasco', prix: 600 },
];

const caveSupremeStock = [
  { produit: 'Primus', matin: 14, entrees: 0, sorties: 0, restant: 14, seuil: 10 },
  { produit: 'Heineken', matin: 24, entrees: 0, sorties: 5, restant: 19, seuil: 10 },
  { produit: 'Ngok', matin: 13, entrees: 0, sorties: 2, restant: 11, seuil: 10 },
  { produit: 'Jus Brasco', matin: 23, entrees: 0, sorties: 0, restant: 23, seuil: 8 },
  { produit: 'Gin Tonic Brasco', matin: 21, entrees: 0, sorties: 2, restant: 19, seuil: 8 },
  { produit: 'Turbo', matin: 16, entrees: 0, sorties: 4, restant: 12, seuil: 10 },
  { produit: '33 Export', matin: 9, entrees: 0, sorties: 1, restant: 8, seuil: 10 },
  { produit: 'Castel', matin: 5, entrees: 16, sorties: 0, restant: 21, seuil: 10 },
  { produit: 'Beaufort', matin: 21, entrees: 0, sorties: 1, restant: 20, seuil: 10 },
];

const PagePilotageV2 = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [stockAlert, setStockAlert] = useState(6);
  const [fondCaisse, setFondCaisse] = useState(35100);
  const [depenses, setDepenses] = useState(8500);
  const [remisePatron, setRemisePatron] = useState(0);
  const [avanceClient, setAvanceClient] = useState(0);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'encaissee');
    return {
      active: activeOrders.length,
      ready: orders.filter((order) => order.status === 'prete').length,
      revenue: orders.filter((order) => order.status === 'encaissee').reduce((sum, order) => sum + order.total, 0),
      openRevenue: activeOrders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  const clotureCaveSupreme = useMemo(() => {
    const ventes = caveSupremeSales.reduce((sum, item) => sum + item.qte * item.prix, 0);
    const recettes = ventes + fondCaisse + avanceClient;
    const totalDepenses = depenses + remisePatron;
    return {
      ventes,
      recettes,
      totalDepenses,
      soldeFin: recettes - totalDepenses,
      papier: 36000,
      ecart: recettes - totalDepenses - 36000,
    };
  }, [avanceClient, depenses, fondCaisse, remisePatron]);

  const alertesStockCaveSupreme = useMemo(
    () => caveSupremeStock.filter((item) => item.restant <= item.seuil),
    [],
  );

  const advanceOrder = (id: string) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status: statusFlow[order.status] } : order)),
    );
  };

  const drawPaperHeader = (doc: jsPDF, title: string, subtitle: string) => {
    doc.setFillColor(35, 35, 35);
    doc.rect(12, 10, 186, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 105, 17, { align: 'center' });
    doc.setFontSize(9);
    doc.text(subtitle, 105, 22, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  const drawTable = (doc: jsPDF, startY: number, headers: string[], rows: Array<Array<string | number>>, widths: number[]) => {
    let y = startY;
    let x = 12;
    doc.setFillColor(55, 55, 55);
    doc.rect(12, y, widths.reduce((a, b) => a + b, 0), 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      doc.text(header, x + 2, y + 6);
      x += widths[index];
    });
    doc.setTextColor(0, 0, 0);
    y += 10;
    doc.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      x = 12;
      doc.setDrawColor(210, 210, 210);
      doc.rect(12, y, widths.reduce((a, b) => a + b, 0), 9);
      row.forEach((cell, index) => {
        doc.text(String(cell), x + 2, y + 6);
        x += widths[index];
      });
      y += 9;
    });
    return y;
  };

  const generateCaveSupremePdf = (filled: boolean) => {
    const doc = new jsPDF();
    const date = filled ? '23/05/2026' : '____ / ____ / ______';
    const vendeuse = filled ? 'DORCAS' : '________________';

    drawPaperHeader(doc, 'CAVE SUPREME', 'TABLEAU OPERATIONNEL JOURNALIER');
    doc.setFontSize(10);
    doc.text(`Date: ${date}`, 12, 36);
    doc.text(`Jour: ${filled ? 'Samedi' : '________________'}`, 78, 36);
    doc.text(`Vendeuse: ${vendeuse}`, 140, 36);

    const salesRows: Array<Array<string | number>> = (filled ? caveSupremeSales : caveSupremeProducts).map((item, index) => {
      const qte = 'qte' in item ? Number(item.qte) : 0;
      const montant = qte * Number(item.prix);
      return [
      index + 1,
      item.produit,
      filled ? qte : '',
      `${item.prix} F`,
      filled ? `${montant} F` : '',
      '',
      ];
    });
    const yAfterSales = drawTable(doc, 45, ['N', 'PRODUIT VENDU', 'QTE', 'PRIX UNIT.', 'MONTANT', 'OBSERVATION'], salesRows, [12, 58, 25, 28, 35, 28]);
    doc.setFont('helvetica', 'bold');
    doc.text(`SOUS-TOTAL: ${filled ? `${clotureCaveSupreme.ventes} F` : '________________ FCFA'}`, 122, yAfterSales + 10);

    doc.addPage();
    drawPaperHeader(doc, 'CAVE SUPREME', 'FICHE DE SUIVI DES VENTES ET DU STOCK');
    doc.setFontSize(10);
    doc.text(`Date: ${date}`, 12, 36);
    doc.text(`Semaine N: ______`, 80, 36);
    doc.text(`Rempli par: ${filled ? 'Jacques' : '________________'}`, 135, 36);
    const stockSource = filled ? caveSupremeStock : caveSupremeProducts.map((item) => ({
      produit: item.produit,
      matin: '',
      entrees: '',
      sorties: '',
      restant: '',
    }));
    const stockRows = stockSource.map((item, index) => [
      index + 1,
      item.produit,
      '',
      '',
      '',
      filled ? item.matin : '',
      filled ? item.entrees : '',
      filled ? item.sorties : '',
      filled ? item.restant : '',
      '',
      '',
    ]);
    drawTable(doc, 45, ['N', 'PRODUIT', 'PRIX ACHAT', 'PRIX VENTE', 'MARGE', 'DEBUT', 'ENTREES', 'SORTIES', 'RESTANT', 'MONTANT', 'ETAT'], stockRows, [10, 35, 18, 18, 15, 18, 18, 18, 18, 20, 16]);

    doc.addPage();
    drawPaperHeader(doc, 'CAVE SUPREME', 'BILAN DE LA JOURNEE');
    doc.setFontSize(10);
    doc.text(`Date: ${date}`, 12, 36);
    doc.text('RECETTES DU JOUR', 12, 52);
    doc.text(`Total ventes: ${filled ? `${clotureCaveSupreme.ventes} F` : '________________ FCFA'}`, 18, 64);
    doc.text(`Autres recettes / avances: ${filled ? `${avanceClient} F` : '________________ FCFA'}`, 18, 76);
    doc.text(`Solde caisse debut: ${filled ? `${fondCaisse} F` : '________________ FCFA'}`, 18, 88);
    doc.text(`TOTAL RECETTES: ${filled ? `${clotureCaveSupreme.recettes} F` : '________________ FCFA'}`, 18, 102);

    doc.text('DEPENSES DU JOUR', 112, 52);
    doc.text(`Achat boissons / livraisons: ${filled ? `Castel ${depenses} F` : '________________ FCFA'}`, 118, 64);
    doc.text(`Depenses diverses: ${filled ? '0 F' : '________________ FCFA'}`, 118, 76);
    doc.text(`Remise au patron: ${filled ? `${remisePatron} F` : '________________ FCFA'}`, 118, 88);
    doc.text(`TOTAL DEPENSES: ${filled ? `${clotureCaveSupreme.totalDepenses} F` : '________________ FCFA'}`, 118, 102);

    doc.setFillColor(45, 45, 45);
    doc.rect(12, 116, 186, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`SOLDE CAISSE FIN DE JOURNEE: ${filled ? `${clotureCaveSupreme.soldeFin} F` : '________________ FCFA'}`, 105, 125, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.text('OBSERVATION VENDEUSE', 18, 148);
    doc.text(filled ? 'Paiement de 3000 FCFA de Yaya signale.' : '________________________________________________________', 18, 160);
    doc.text('SIGNATURE VENDEUSE', 85, 148);
    doc.text('VISA PATRON', 145, 148);

    doc.save(filled ? 'cave-supreme-bilan-23-05-2026.pdf' : 'cave-supreme-fiche-vierge.pdf');
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-orange-500">GestCave Pro 2.0</p>
            <h1 className="max-w-4xl text-3xl font-black uppercase tracking-tight text-[#12366f] md:text-5xl">
              Centre de pilotage operationnel
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
              Une vue de travail prete pour le manager: commandes, cuisine, caisse, stock critique et conformite dans un seul ecran.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 px-5 text-xs font-black uppercase tracking-widest text-slate-700">
              Accueil
            </Link>
            <Link to="/connexion" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200">
              Ouvrir session
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<Activity size={20} />} label="Commandes actives" value={stats.active.toString()} tone="blue" />
            <Metric icon={<ChefHat size={20} />} label="Pretes a servir" value={stats.ready.toString()} tone="orange" />
            <Metric icon={<CreditCard size={20} />} label="A encaisser" value={formatMoney(stats.openRevenue)} tone="emerald" />
            <Metric icon={<ReceiptText size={20} />} label="Deja encaisse" value={formatMoney(stats.revenue)} tone="slate" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase text-[#12366f]">Flux commandes</h2>
                  <p className="text-xs font-semibold text-slate-400">Simulation locale incluse dans la v2</p>
                </div>
                <Smartphone className="text-orange-500" />
              </div>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-[#12366f] ring-1 ring-slate-200">{order.id}</span>
                        <span className="text-sm font-black text-slate-800">{order.table}</span>
                        <span className="text-xs font-semibold text-slate-400">Serveur: {order.serveur}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">{order.items.join(' | ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-white px-3 py-2 text-xs font-black uppercase text-slate-600 ring-1 ring-slate-200">{statusLabel[order.status]}</span>
                      <button
                        onClick={() => advanceOrder(order.id)}
                        disabled={order.status === 'encaissee'}
                        className="h-11 rounded-xl bg-[#12366f] px-4 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Avancer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase text-[#12366f]">Stock critique</h2>
                  <p className="text-xs font-semibold text-slate-400">Ajustable pour tester les alertes</p>
                </div>
                <PackageCheck className="text-emerald-600" />
              </div>
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-orange-300">Casiers Primus restants</p>
                <div className="my-5 flex items-end gap-3">
                  <span className="text-6xl font-black">{stockAlert}</span>
                  <span className="pb-2 text-sm font-bold text-slate-400">seuil alerte: 8</span>
                </div>
                <input
                  aria-label="Stock restant"
                  type="range"
                  min="0"
                  max="24"
                  value={stockAlert}
                  onChange={(event) => setStockAlert(Number(event.target.value))}
                  className="w-full accent-orange-500"
                />
                {stockAlert < 8 ? (
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-orange-500/15 p-4 text-orange-100 ring-1 ring-orange-300/20">
                    <AlertTriangle size={20} />
                    <p className="text-xs font-bold">Achat fournisseur recommande avant le prochain service.</p>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-500/15 p-4 text-emerald-100 ring-1 ring-emerald-300/20">
                    <CheckCircle2 size={20} />
                    <p className="text-xs font-bold">Stock suffisant pour le service en cours.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-orange-500">Nouveau module 2.0</p>
                <h2 className="text-2xl font-black uppercase text-[#12366f]">Mode Solo - mini bar & petit restaurant</h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
                  Pour les petits business ou une seule personne est a la fois serveuse, caissiere et parfois cuisine.
                  L'ecran simplifie tout en trois gestes: choisir les articles, encaisser, imprimer ou garder en dette.
                </p>
              </div>
              <div className="rounded-2xl bg-orange-50 px-5 py-4 text-orange-700 ring-1 ring-orange-100">
                <p className="text-[10px] font-black uppercase tracking-widest">Offre conseillee</p>
                <p className="mt-1 text-2xl font-black">9 900 FCFA/mois</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <SoloStep icon={<Store size={20} />} title="1 seul ecran" text="Plus besoin de separer serveur, caisse et cuisine." />
              <SoloStep icon={<ReceiptText size={20} />} title="Vente rapide" text="Commande directe: produit, quantite, paiement." />
              <SoloStep icon={<WifiOff size={20} />} title="Sans internet" text="Les ventes restent sur l'appareil et se synchronisent apres." />
              <SoloStep icon={<BellRing size={20} />} title="Alertes simples" text="Stock bas, dette client, fin de journee." />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-orange-300">Parcours mini-bar</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Commande', 'La serveuse clique sur les boissons/plats vendus.'],
                    ['Preparation', 'Si elle prepare elle-meme, pas besoin de bon cuisine.'],
                    ['Paiement', 'Especes, mobile money, credit client ou acompte.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-xl bg-white/8 p-4 ring-1 ring-white/10">
                      <p className="font-black uppercase text-white">{title}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-3">
                  <Database className="text-[#12366f]" size={22} />
                  <p className="text-sm font-black uppercase text-[#12366f]">Mode hors-ligne</p>
                </div>
                <p className="text-xs font-semibold leading-6 text-slate-500">
                  Sans reseau, l'application garde les ventes localement sur le telephone, la tablette ou le PC.
                  Quand internet revient, elle envoie les ventes vers Firebase et marque ce qui est synchronise.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-orange-500">Cas pratique reel</p>
                <h2 className="text-2xl font-black uppercase text-[#12366f]">Cave Supreme - point du 23/05/2026</h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
                  J'ai repris ta fiche papier: ventes par boisson, stock du matin, sorties, stock restant, depenses Castel,
                  solde de caisse et observation. Le logiciel doit produire exactement ce bilan, mais sans calcul manuel.
                </p>
              </div>
              <div className={`rounded-2xl px-5 py-4 ring-1 ${clotureCaveSupreme.ecart === 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-orange-50 text-orange-700 ring-orange-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">Controle caisse</p>
                <p className="mt-1 text-2xl font-black">{clotureCaveSupreme.ecart === 0 ? 'OK' : `${formatMoney(clotureCaveSupreme.ecart)} ecart`}</p>
              </div>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-2">
              <button
                onClick={() => generateCaveSupremePdf(false)}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-slate-100 px-5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-200"
              >
                <ReceiptText size={18} />
                Imprimer fiche vierge PDF
              </button>
              <button
                onClick={() => generateCaveSupremePdf(true)}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200 transition hover:bg-orange-400"
              >
                <ReceiptText size={18} />
                Generer PDF rempli du 23/05/2026
              </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <div className="grid grid-cols-[1fr_80px_100px_120px] bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">
                    <span>Produit vendu</span>
                    <span>Qte</span>
                    <span>Prix</span>
                    <span className="text-right">Montant</span>
                  </div>
                  {caveSupremeSales.map((item) => (
                    <div key={item.produit} className="grid grid-cols-[1fr_80px_100px_120px] border-t border-slate-100 px-4 py-3 text-sm font-bold">
                      <span>{item.produit}</span>
                      <span>{item.qte}</span>
                      <span>{formatMoney(item.prix)}</span>
                      <span className="text-right text-[#12366f]">{formatMoney(item.qte * item.prix)}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_120px] bg-orange-50 px-4 py-4 text-sm font-black uppercase text-orange-700">
                    <span>Total ventes papier</span>
                    <span className="text-right">{formatMoney(clotureCaveSupreme.ventes)}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <div className="grid grid-cols-[1fr_70px_70px_70px_80px_90px] bg-[#12366f] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">
                    <span>Stock boisson</span>
                    <span>Matin</span>
                    <span>Entrees</span>
                    <span>Sorties</span>
                    <span>Restant</span>
                    <span>Alerte</span>
                  </div>
                  {caveSupremeStock.map((item) => {
                    const ok = item.matin + item.entrees - item.sorties === item.restant;
                    const alerte = item.restant <= item.seuil;
                    return (
                      <div key={item.produit} className="grid grid-cols-[1fr_70px_70px_70px_80px_90px] border-t border-slate-100 px-4 py-3 text-sm font-bold">
                        <span>{item.produit}</span>
                        <span>{item.matin}</span>
                        <span>{item.entrees}</span>
                        <span>{item.sorties}</span>
                        <span className={ok ? 'text-emerald-700' : 'text-orange-600'}>{item.restant} {ok ? 'OK' : 'A voir'}</span>
                        <span className={alerte ? 'text-orange-600' : 'text-emerald-700'}>{alerte ? `Acheter <= ${item.seuil}` : 'OK'}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-100">
                  <div className="mb-4 flex items-center gap-3">
                    <AlertTriangle className="text-orange-600" size={22} />
                    <div>
                      <p className="text-sm font-black uppercase text-orange-800">Stocks d'alerte a ne jamais oublier</p>
                      <p className="text-xs font-semibold text-orange-700">
                        Meme en Mode Solo, le logiciel doit signaler les boissons a racheter avant rupture.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {alertesStockCaveSupreme.map((item) => (
                      <div key={item.produit} className="rounded-xl bg-white p-4 ring-1 ring-orange-100">
                        <p className="font-black text-slate-900">{item.produit}</p>
                        <p className="mt-1 text-xs font-bold text-orange-700">
                          Restant: {item.restant} | Seuil mini: {item.seuil}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="rounded-2xl bg-slate-950 p-5 text-white">
                <div className="mb-5 flex items-center gap-3">
                  <Calculator className="text-orange-300" size={24} />
                  <div>
                    <p className="text-sm font-black uppercase">Bilan automatique</p>
                    <p className="text-xs font-semibold text-slate-400">Journee du 23/05/2026</p>
                  </div>
                </div>

                <NumberInput label="Solde debut" value={fondCaisse} onChange={setFondCaisse} />
                <NumberInput label="Achat / depenses" value={depenses} onChange={setDepenses} />
                <NumberInput label="Remise au patron" value={remisePatron} onChange={setRemisePatron} />
                <NumberInput label="Autres recettes / avances" value={avanceClient} onChange={setAvanceClient} />

                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  <ClosingLine label="Total ventes" value={clotureCaveSupreme.ventes} />
                  <ClosingLine label="Total recettes" value={clotureCaveSupreme.recettes} />
                  <ClosingLine label="Total depenses" value={clotureCaveSupreme.totalDepenses} />
                  <ClosingLine label="Solde fin calcule" value={clotureCaveSupreme.soldeFin} highlight />
                  <ClosingLine label="Solde papier" value={clotureCaveSupreme.papier} />
                </div>

                <div className="mt-5 rounded-xl bg-white/8 p-4 ring-1 ring-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Observation vendeuse</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                    Paiement de 3 000 FCFA de Yaya signale sur la fiche. Dans l'app, on l'enregistrerait comme dette reglee ou avance recue.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <EnvironmentStatus />
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-5 text-lg font-black uppercase text-[#12366f]">Controle manager</h2>
            <div className="space-y-4">
              <Checklist icon={<ShieldCheck size={18} />} title="Conformite" text="Taxes, licence, BCDA et mairie visibles avant controle." />
              <Checklist icon={<Clock3 size={18} />} title="Pointage" text="Retards et presences centralises pour la paie." />
              <Checklist icon={<Users size={18} />} title="Equipes" text="Roles separes: serveur, cuisine, caisse, manager." />
              <Checklist icon={<BarChart3 size={18} />} title="Finances" text="Ventes encaissees et restes a payer suivis en temps reel." />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
};

const Metric = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'blue' | 'orange' | 'emerald' | 'slate' }) => {
  const tones = {
    blue: 'bg-blue-50 text-[#12366f]',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  );
};

const Checklist = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 ring-1 ring-slate-200">{icon}</div>
    <div>
      <p className="text-sm font-black uppercase text-slate-800">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  </div>
);

const SoloStep = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-500 ring-1 ring-slate-200">{icon}</div>
    <p className="text-sm font-black uppercase text-slate-900">{title}</p>
    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p>
  </div>
);

const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="mb-3 block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-11 w-full rounded-xl border border-white/10 bg-white/8 px-3 text-sm font-black text-white outline-none focus:border-orange-300"
    />
  </label>
);

const ClosingLine = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${highlight ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-200'}`}>
    <span className="text-xs font-black uppercase">{label}</span>
    <span className="text-sm font-black">{formatMoney(value)}</span>
  </div>
);

export default PagePilotageV2;
