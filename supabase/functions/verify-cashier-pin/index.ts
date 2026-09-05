import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request ) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { employeeName, pin } = await request.json();

    if (
      typeof employeeName !== 'string' ||
      typeof pin !== 'string' ||
      !/^\d{4}$/.test(pin)
    ) {
      return new Response(
        JSON.stringify({
          error: 'اسم العامل ورمز PIN المكون من 4 أرقام مطلوبان',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.rpc('verify_cashier_pin', {
      p_employee_name: employeeName,
      p_pin: pin,
    });

    if (error) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: 'تعذر التحقق من بيانات العامل' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'اسم العامل أو رمز السر غير صحيح',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const staff = data[0];

    return new Response(
      JSON.stringify({
        staff: {
          id: staff.staff_id,
          fullName: staff.full_name,
          employeeCode: staff.employee_code,
          role: staff.staff_role,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'طلب غير صالح' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
