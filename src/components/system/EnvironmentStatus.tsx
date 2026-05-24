import { CheckCircle2, Settings, ShieldAlert } from 'lucide-react';

const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export const missingFirebaseEnv = requiredEnv.filter((key) => !import.meta.env[key]);

const EnvironmentStatus = () => {
  if (missingFirebaseEnv.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 size={16} />
        Firebase configure
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-orange-50 p-5 text-orange-950 ring-1 ring-orange-200">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest">Configuration incomplete</p>
          <p className="text-xs font-semibold text-orange-800">La demo fonctionne, mais les donnees cloud attendent Firebase.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {missingFirebaseEnv.map((key) => (
          <span key={key} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[10px] font-black text-orange-700 ring-1 ring-orange-100">
            <Settings size={12} />
            {key}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentStatus;
