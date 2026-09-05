import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Power, ShieldPlus, UserPlus, Users } from 'lucide-react';

type StaffRole = 'manager' | 'cashier' | 'kitchen' | 'waiter' | 'delivery';

type StaffAccount = {
  id: string;
  full_name: string;
  employee_code: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

type Props = {
  sessionToken: string;
  isRTL: boolean;
};

const roleLabels: Record<StaffRole, { ar: string; fr: string }> = {
  manager: { ar: 'مدير', fr: 'Manager' },
  cashier: { ar: 'كاشير', fr: 'Caissier' },
  kitchen: { ar: 'مطبخ', fr: 'Cuisine' },
  waiter: { ar: 'نادل', fr: 'Serveur' },
  delivery: { ar: 'توصيل', fr: 'Livreur' },
};

export const StaffAccessManager: React.FC<Props> = ({ sessionToken, isRTL }) => {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [role, setRole] = useState<StaffRole>('cashier');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const callStaffApi = useCallback(async (body: Record<string, unknown>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!supabaseUrl || !publishableKey) throw new Error(isRTL ? 'إعدادات Supabase غير مكتملة' : 'Configuration Supabase incomplète');
    const response = await fetch(`${supabaseUrl}/functions/v1/manage-staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({ sessionToken, ...body }),
    });
    const result = await response.json() as { staff?: StaffAccount[] | StaffAccount; error?: string };
    if (!response.ok) throw new Error(result.error || (isRTL ? 'تعذر تنفيذ العملية' : 'Opération impossible'));
    return result;
  }, [isRTL, sessionToken]);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callStaffApi({ action: 'list' });
      setStaff(Array.isArray(result.staff) ? result.staff : []);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : (isRTL ? 'تعذر تحميل العمال' : 'Impossible de charger le personnel') });
    } finally {
      setLoading(false);
    }
  }, [callStaffApi, isRTL]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !/^\d{4}$/.test(pin)) {
      setMessage({ type: 'error', text: isRTL ? 'أدخل الاسم وPIN مكوّنًا من 4 أرقام' : 'Saisissez le nom et un PIN de 4 chiffres' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await callStaffApi({
        action: 'create',
        staff: { fullName: fullName.trim(), employeeCode: employeeCode.trim(), role, pin },
      });
      setFullName('');
      setEmployeeCode('');
      setRole('cashier');
      setPin('');
      setMessage({ type: 'success', text: isRTL ? 'تم إنشاء حساب العامل بنجاح' : 'Compte créé avec succès' });
      await loadStaff();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : (isRTL ? 'تعذر إنشاء الحساب' : 'Création impossible') });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (account: StaffAccount) => {
    setMessage(null);
    try {
      await callStaffApi({ action: 'set-active', staffId: account.id, isActive: !account.is_active });
      setStaff((current) => current.map((item) => item.id === account.id ? { ...item, is_active: !account.is_active } : item));
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : (isRTL ? 'تعذر تحديث الحساب' : 'Mise à jour impossible') });
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-[#141416] to-[#141416] p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <ShieldPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-white">{isRTL ? 'إدارة حسابات العمال' : 'Gestion des accès équipe'}</h4>
            <p className="text-xs text-gray-400 mt-1">{isRTL ? 'أنشئ حسابات آمنة باسم العامل ورمز PIN، وحدد صلاحيات كل حساب.' : 'Créez des accès sécurisés avec un nom, un PIN et un rôle.'}</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border-red-500/30 text-red-300'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">{isRTL ? 'اسم العامل *' : 'Nom complet *'}</label>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={isRTL ? 'مثال: محمد بن علي' : 'Ex: Mohamed Ben Ali'} className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">{isRTL ? 'رمز الموظف (اختياري)' : 'Code employé (optionnel)'}</label>
            <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder="staff-002" className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">{isRTL ? 'الدور والصلاحية *' : 'Rôle *'}</label>
            <select value={role} onChange={(event) => setRole(event.target.value as StaffRole)} className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500">
              {(Object.keys(roleLabels) as StaffRole[]).map((item) => <option key={item} value={item}>{isRTL ? roleLabels[item].ar : roleLabels[item].fr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">{isRTL ? 'رمز الدخول PIN (4 أرقام) *' : 'PIN (4 chiffres) *'}</label>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white font-mono tracking-[0.35em] focus:outline-none focus:border-amber-500" />
          </div>
          <button type="submit" disabled={saving || !fullName.trim() || pin.length !== 4} className="md:col-span-2 w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-[#FF6321] text-black font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {isRTL ? 'إضافة العامل وحفظ PIN' : 'Ajouter l’accès équipe'}
          </button>
        </form>
      </div>

      <div className="rounded-3xl bg-[#141416] border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" /><h4 className="text-sm font-black text-white">{isRTL ? 'الحسابات المسجلة' : 'Comptes enregistrés'}</h4></div>
          {loading && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
        </div>
        <div className="space-y-2">
          {staff.map((account) => (
            <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F0F10] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${account.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-500'}`}>{account.full_name.charAt(0)}</div>
                <div><p className="text-sm font-bold text-white">{account.full_name}</p><p className="text-[11px] text-gray-400 font-mono">{account.employee_code} · {isRTL ? roleLabels[account.role].ar : roleLabels[account.role].fr}</p></div>
              </div>
              <button onClick={() => void toggleActive(account)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${account.is_active ? 'bg-red-950/40 text-red-300 border border-red-500/20' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'}`}><Power className="w-3.5 h-3.5" />{account.is_active ? (isRTL ? 'تعطيل' : 'Désactiver') : (isRTL ? 'تفعيل' : 'Activer')}</button>
            </div>
          ))}
          {!loading && staff.length === 0 && <p className="text-center text-sm text-gray-500 py-6">{isRTL ? 'لا توجد حسابات' : 'Aucun compte'}</p>}
        </div>
      </div>
    </div>
  );
};
