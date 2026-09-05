import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const getString = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const allowedRoles = new Set(['manager', 'cashier', 'kitchen', 'waiter', 'delivery']);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'الطريقة غير مسموحة' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('CASHIER_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'الخدمة غير مهيأة' }, 500);

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return jsonResponse({ error: 'يجب إرسال الطلب بصيغة JSON' }, 415);
    }

    const payload = await request.json() as Record<string, unknown>;
    const managerName = getString(payload.managerName);
    const managerPin = typeof payload.managerPin === 'string' ? payload.managerPin : '';
    const action = getString(payload.action);
    if (!managerName || !/^\d{4}$/.test(managerPin)) {
      return jsonResponse({ error: 'بيانات المدير غير صحيحة' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: verified, error: verifyError } = await supabase.rpc('verify_cashier_pin', {
      p_employee_name: managerName,
      p_pin: managerPin,
    });
    if (verifyError) {
      console.error('manager verification failed', { code: verifyError.code, message: verifyError.message });
      return jsonResponse({ error: 'تعذر التحقق من صلاحية المدير' }, 500);
    }
    const manager = Array.isArray(verified) ? verified[0] : null;
    if (!manager || manager.staff_role !== 'manager') {
      return jsonResponse({ error: 'هذه العملية متاحة للمدير فقط' }, 403);
    }

    if (action === 'list') {
      const { data, error } = await supabase.rpc('list_staff_accounts');
      if (error) {
        console.error('staff list failed', { code: error.code, message: error.message });
        return jsonResponse({ error: 'تعذر تحميل قائمة العمال' }, 500);
      }
      return jsonResponse({ staff: data ?? [] });
    }

    if (action === 'create') {
      const staff = payload.staff && typeof payload.staff === 'object'
        ? payload.staff as Record<string, unknown>
        : {};
      const fullName = getString(staff.fullName);
      const role = getString(staff.role);
      const pin = typeof staff.pin === 'string' ? staff.pin : '';
      const employeeCode = getString(staff.employeeCode) || `staff-${crypto.randomUUID().slice(0, 8)}`;
      if (!fullName || fullName.length > 120 || !allowedRoles.has(role) || !/^\d{4}$/.test(pin)) {
        return jsonResponse({ error: 'الاسم والدور وPIN من 4 أرقام مطلوبة' }, 400);
      }
      const { data, error } = await supabase.rpc('create_staff_account', {
        p_full_name: fullName,
        p_employee_code: employeeCode,
        p_role: role,
        p_pin: pin,
      });
      if (error) {
        console.error('staff create failed', { code: error.code, message: error.message });
        const message = error.code === '23505' ? 'رمز الموظف مستخدم مسبقًا' : 'تعذر إنشاء حساب العامل';
        return jsonResponse({ error: message }, 400);
      }
      return jsonResponse({ staff: data }, 201);
    }

    if (action === 'set-active') {
      const staffId = getString(payload.staffId);
      const isActive = typeof payload.isActive === 'boolean' ? payload.isActive : null;
      if (!staffId || isActive === null) return jsonResponse({ error: 'بيانات الحالة غير صحيحة' }, 400);
      const { data, error } = await supabase.rpc('set_staff_account_active', {
        p_staff_id: staffId,
        p_is_active: isActive,
      });
      if (error) {
        console.error('staff status update failed', { code: error.code, message: error.message });
        return jsonResponse({ error: 'تعذر تحديث حالة العامل' }, 400);
      }
      return jsonResponse({ staff: data });
    }

    return jsonResponse({ error: 'العملية غير معروفة' }, 400);
  } catch (error) {
    console.error('manage-staff request failed', error);
    return jsonResponse({ error: 'طلب غير صالح' }, 400);
  }
});

