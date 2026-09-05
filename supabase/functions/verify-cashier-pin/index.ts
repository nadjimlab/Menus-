import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

const getString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'الطريقة غير مسموحة' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('CASHIER_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase function configuration');
    return jsonResponse({ error: 'الخدمة غير مهيأة' }, 500);
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return jsonResponse({ error: 'يجب إرسال الطلب بصيغة JSON' }, 415);
    }

    const payload: unknown = await request.json();
    const body = payload && typeof payload === 'object'
      ? payload as Record<string, unknown>
      : {};

    const employeeName = getString(body.employeeName);
    const pin = typeof body.pin === 'string' ? body.pin : '';

    if (!employeeName || employeeName.length > 120 || !/^\d{4}$/.test(pin)) {
      return jsonResponse(
        { error: 'اسم العامل ورمز PIN المكون من 4 أرقام مطلوبان' },
        400,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.rpc('verify_cashier_pin', {
      p_employee_name: employeeName,
      p_pin: pin,
    });

    if (error) {
      console.error('verify_cashier_pin RPC failed', {
        code: error.code,
        message: error.message,
      });
      return jsonResponse({ error: 'تعذر التحقق من بيانات العامل' }, 500);
    }

    const staff = Array.isArray(data) ? data[0] : null;
    if (!staff || staff.staff_role !== 'cashier') {
      return jsonResponse({ error: 'اسم العامل أو رمز السر غير صحيح' }, 401);
    }

    return jsonResponse(
      {
        staff: {
          id: staff.staff_id,
          fullName: staff.full_name,
          employeeCode: staff.employee_code,
          role: staff.staff_role,
        },
      },
      200,
    );
  } catch (error) {
    console.error('verify-cashier-pin request failed', error);
    return jsonResponse({ error: 'طلب غير صالح' }, 400);
  }
});

export {};
