import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-staff-session',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};
const reply = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });
const encoder = new TextEncoder();
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), (char) => char.charCodeAt(0));

async function verifyStaff(request: Request, secret: string) {
  const token = request.headers.get('x-staff-session') || '';
  const [encodedPayload, encodedSignature] = token.split('.');
  if (!encodedPayload || !encodedSignature) return null;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('HMAC', key, fromBase64Url(encodedSignature), encoder.encode(encodedPayload))) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as { id?: string; role?: string; exp?: number };
  if (!payload.id || !payload.exp || payload.exp < Date.now() || !['manager', 'cashier'].includes(payload.role || '')) return null;
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('CASHIER_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return reply({ error: 'الخدمة غير مهيأة' }, 500);
  try {
    const staff = await verifyStaff(request, serviceRoleKey);
    if (!staff) return reply({ error: 'جلسة الموظف غير صالحة' }, 401);
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    if (request.method === 'GET') {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) {
        console.error('staff order list failed', { code: error.code, message: error.message });
        return reply({ error: 'تعذر تحميل الطلبات' }, 500);
      }
      return reply({ orders: data || [] });
    }

    if (request.method === 'PATCH') {
      const payload = await request.json() as { orderId?: unknown; status?: unknown; isPaid?: unknown; paymentMethod?: unknown; cashReceived?: unknown; changeGiven?: unknown; paidAt?: unknown };
      const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
      if (!orderId) return reply({ error: 'رقم الطلب غير صحيح' }, 400);
      const updates: Record<string, unknown> = {};
      if (typeof payload.status === 'string' && ['received', 'preparing', 'ready', 'completed', 'cancelled'].includes(payload.status)) {
        updates.status = payload.status;
        updates.status_updated_at = new Date().toISOString();
        updates.estimated_minutes = payload.status === 'ready' ? 0 : payload.status === 'preparing' ? 10 : 0;
      }
      if (payload.isPaid === true) {
        if (!['cash', 'baridimob', 'carte'].includes(String(payload.paymentMethod))) return reply({ error: 'طريقة الدفع غير صحيحة' }, 400);
        updates.is_paid = true;
        updates.payment_method = payload.paymentMethod;
        updates.cash_received = typeof payload.cashReceived === 'number' ? payload.cashReceived : null;
        updates.change_given = typeof payload.changeGiven === 'number' ? payload.changeGiven : 0;
        updates.paid_at = typeof payload.paidAt === 'string' ? payload.paidAt : new Date().toISOString();
      }
      if (!Object.keys(updates).length) return reply({ error: 'لا توجد تغييرات صالحة' }, 400);
      const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select('*').limit(1);
      if (error) {
        console.error('staff order update failed', { code: error.code, message: error.message });
        return reply({ error: 'تعذر تحديث حالة الطلب' }, 500);
      }
      return reply({ order: data?.[0] || null });
    }
    return reply({ error: 'الطريقة غير مسموحة' }, 405);
  } catch (error) {
    console.error('staff-orders request failed', error);
    return reply({ error: 'تعذر معالجة الطلب' }, 500);
  }
});
