export type ModuleId = 'solo' | 'pos' | 'stock' | 'hr' | 'compta' | 'kds' | 'analytics';
export type PlanId = 'essai_gratuit' | 'solo' | 'starter' | 'premium' | 'business';

export type SubscriptionPlan = {
  id: PlanId;
  label: string;
  shortLabel: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  modules: ModuleId[];
  limits: {
    workers: number | 'illimite';
    terminals: number | 'illimite';
    sites: number | 'illimite';
  };
};

export const MODULE_LABELS: Record<ModuleId, string> = {
  solo: 'Mode Solo patron',
  pos: 'Point de vente, caisse et commandes',
  stock: 'Stocks, achats et inventaire',
  hr: 'Employes, pointage et paie',
  compta: 'Comptabilite, grand livre et taxes',
  kds: 'Cuisine, bar et preparation',
  analytics: 'Analyses predictives et pilotage avance',
};

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  essai_gratuit: {
    id: 'essai_gratuit',
    label: 'Essai Gratuit',
    shortLabel: 'Essai',
    description: 'Tous les modules ouverts pendant la periode de test.',
    monthlyPrice: 0,
    annualPrice: 0,
    modules: ['pos', 'stock', 'hr', 'compta', 'kds', 'analytics'],
    limits: { workers: 'illimite', terminals: 'illimite', sites: 1 },
  },
  solo: {
    id: 'solo',
    label: 'Solo Mini-Bar',
    shortLabel: 'Solo',
    description: 'Pour un patron seul: un PIN maitre, caisse, tables, cuisine/bar et stock simple.',
    monthlyPrice: 9900,
    annualPrice: 99000,
    modules: ['solo', 'pos', 'stock', 'kds'],
    limits: { workers: 1, terminals: 1, sites: 1 },
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    shortLabel: 'Starter',
    description: 'Pour un petit bar ou restaurant: caisse, tables, cuisine/bar et stock.',
    monthlyPrice: 30000,
    annualPrice: 300000,
    modules: ['pos', 'stock', 'kds'],
    limits: { workers: 3, terminals: 2, sites: 1 },
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    shortLabel: 'Premium',
    description: 'Pour une equipe complete avec RH, paie, comptabilite et postes separes.',
    monthlyPrice: 55000,
    annualPrice: 550000,
    modules: ['pos', 'stock', 'hr', 'compta', 'kds'],
    limits: { workers: 15, terminals: 'illimite', sites: 1 },
  },
  business: {
    id: 'business',
    label: 'Business',
    shortLabel: 'Business',
    description: 'Pour les structures avancees: multi-site, analyse et pilotage complet.',
    monthlyPrice: 95000,
    annualPrice: 950000,
    modules: ['pos', 'stock', 'hr', 'compta', 'kds', 'analytics'],
    limits: { workers: 'illimite', terminals: 'illimite', sites: 'illimite' },
  },
};

export const MODULES_PAR_PLAN: Record<string, ModuleId[]> = Object.fromEntries(
  Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => [id, plan.modules])
) as Record<string, ModuleId[]>;

export const normalizePlanId = (plan?: string | null): PlanId => {
  const raw = String(plan || '').trim().toLowerCase();
  if (raw.includes('solo')) return 'solo';
  if (raw.includes('business') || raw.includes('empire')) return 'business';
  if (raw.includes('premium') || raw.includes('performance')) return 'premium';
  if (raw.includes('starter') || raw.includes('essentiel') || raw === 'mensuel') return 'starter';
  if (raw.includes('essai') || raw.includes('demo')) return 'essai_gratuit';
  return 'starter';
};

export const getPlan = (plan?: string | null): SubscriptionPlan => SUBSCRIPTION_PLANS[normalizePlanId(plan)];

export const getModulesForPlan = (plan?: string | null): ModuleId[] => getPlan(plan).modules;

export const resolveActiveModules = (modulesActifs?: string[] | null, plan?: string | null): ModuleId[] => {
  if (modulesActifs?.length) return modulesActifs as ModuleId[];
  return getModulesForPlan(plan);
};

export const planIncludesModule = (modules: string[] | null | undefined, module: ModuleId, plan?: string | null) =>
  resolveActiveModules(modules, plan).includes(module);
