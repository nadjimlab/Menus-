import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};
const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });
const encoder = new TextEncoder();
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), (char) => char.charCodeAt(0));

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'الطريقة غير مسموحة' }, 405);
  const serviceRoleKey = Deno.env.get('CASHIER_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) return response({ error: 'الخدمة غير مهيأة' }, 500);

  try {
    const body = await request.json() as { sessionToken?: unknown };
    const token = typeof body.sessionToken === 'string' ? body.sessionToken : '';
    const [encodedPayload, encodedSignature] = token.split('.');
    if (!encodedPayload || !encodedSignature) return response({ error: 'الجلسة غير صالحة' }, 401);
    const key = await crypto.subtle.importKey('raw', encoder.encode(serviceRoleKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(encodedSignature), encoder.encode(encodedPayload));
    if (!valid) return response({ error: 'الجلسة غير صالحة' }, 401);
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as { id?: string; fullName?: string; role?: string; exp?: number };
    if (!payload.id || !payload.fullName || !['manager', 'cashier'].includes(payload.role || '') || !payload.exp || payload.exp < Date.now()) return response({ error: 'انتهت الجلسة' }, 401);
    return response({ staff: { id: payload.id, fullName: payload.fullName, role: payload.role }, expiresAt: payload.exp });
  } catch (error) {
    console.error('staff-session request failed', error);
    return response({ error: 'الجلسة غير صالحة' }, 401);
  }
});
