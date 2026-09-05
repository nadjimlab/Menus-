import React, { useState } from 'react';

interface CashierPinLoginProps {
  onAuthenticated: (staff: {
    id: string;
    fullName: string;
    role: string;
  }) => void;
}

export const CashierPinLogin: React.FC<CashierPinLoginProps> = ({
  onAuthenticated,
}) => {
  const [employeeName, setEmployeeName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!employeeName.trim()) {
      setError('اكتب اسم العامل');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('رمز الدخول يجب أن يتكون من 4 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-cashier-pin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            employeeName: employeeName.trim(),
            pin,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'بيانات الدخول غير صحيحة');
        return;
      }

      onAuthenticated(result.staff);
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-[#141416] border border-white/10 p-6 shadow-2xl"
      >
        <h2 className="text-xl font-black text-white text-center mb-6">
          دخول الكاشير
        </h2>

        <label className="block text-sm font-bold text-gray-300 mb-2">
          اسم العامل
        </label>

        <input
          type="text"
          value={employeeName}
          onChange={(event) => setEmployeeName(event.target.value)}
          placeholder="مثال: يوسف بن سالم"
          className="w-full rounded-xl bg-[#0A0A0B] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF6321] mb-4"
        />

        <label className="block text-sm font-bold text-gray-300 mb-2">
          رمز السر — 4 أرقام
        </label>

        <input
          type="password"
          value={pin}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, '').slice(0, 4))
          }
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          className="w-full rounded-xl bg-[#0A0A0B] border border-white/10 px-4 py-3 text-white text-center tracking-[0.6em] outline-none focus:border-[#FF6321] mb-4"
        />

        {error && (
          <p className="text-sm text-red-400 font-bold mb-4 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#FF6321] text-black font-black py-3 disabled:opacity-50"
        >
          {loading ? 'جارٍ التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
};
