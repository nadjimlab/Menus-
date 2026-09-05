import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const jsonResponse = (body: Record<string, unknown>, status: number) => new Response(JSON.stringify(body), { status, headers: corsHeaders });
const getString = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), (char) => char.charCodeAt(0));

async function signSession(payload: Record<string, unknown>, secret: string) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))));
  return `${body}.${signature}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'الطريقة غير مسموحة' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('CASHIER_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'الخدمة غير مهيأة' }, 500);

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) return jsonResponse({ error: 'يجب إرسال الطلب بصيغة JSON' }, 415);
    const body = await request.json() as Record<string, unknown>;
    const employeeName = getString(body.employeeName);
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!employeeName || employeeName.length > 120 || !/^\d{4}$/.test(pin)) return jsonResponse({ error: 'اسم العامل ورمز PIN المكون من 4 أرقام مطلوبان' }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase.rpc('verify_cashier_pin', { p_employee_name: employeeName, p_pin: pin });
    if (error) {
      console.error('verify_cashier_pin RPC failed', { code: error.code, message: error.message });
      const setupMissing = error.code === '42883' || error.code === '42P01' || error.code === '42501';
      return jsonResponse(
        {
          error: setupMissing
            ? 'لم يتم إعداد حسابات الموظفين في Supabase. شغّل ملف supabase_staff_auth.sql أولاً.'
            : 'تعذر التحقق من بيانات العامل',
        },
        500,
      );
    }
    const staff = Array.isArray(data) ? data[0] : null;
    if (!staff || !['cashier', 'manager'].includes(staff.staff_role)) return jsonResponse({ error: 'اسم العامل أو رمز السر غير صحيح' }, 401);

    const sessionToken = await signSession({
      id: staff.staff_id,
      fullName: staff.full_name,
      role: staff.staff_role,
      exp: Date.now() + 8 * 60 * 60 * 1000,
    }, serviceRoleKey);
    return jsonResponse({
      staff: { id: staff.staff_id, fullName: staff.full_name, employeeCode: staff.employee_code, role: staff.staff_role },
      sessionToken,
    }, 200);
  } catch (error) {
    console.error('verify-cashier-pin request failed', error);
    return jsonResponse({ error: 'طلب غير صالح' }, 400);
  }
});

export { fromBase64Url };
