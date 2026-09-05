import React, { useState, useMemo } from 'react';
import { useManager } from '../context/ManagerContext';
import { useOrders } from '../context/OrderContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { soundFx } from '../utils/soundEffects';
import { supabase } from '../lib/supabase';
import { MustacheIcon } from './MustacheLogo';
import { StaffAccessManager } from './StaffAccessManager';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  CalendarCheck,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Printer,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  UserPlus,
  Briefcase,
  Layers,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';
import {
  ExpenseRecord,
  ExpenseCategory,
  Employee,
  EmployeeRole,
  PayrollRecord,
  AttendanceRecord,
  AttendanceStatus,
  ShiftType,
} from '../types/manager';

type ManagerDashboardProps = {
  managerAuth?: { name: string; pin: string };
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ managerAuth }) => {
  const {
    isManagerAuthenticated,
    setIsManagerAuthenticated,
    managerPin,
    staffPin,
    verifyManagerPin,
    updateManagerPin,
    updateStaffPin,
    expenses,
    addExpense,
    deleteExpense,
    employees,
    addEmployee,
    deleteEmployee,
    payrollRecords,
    addPayrollRecord,
    deletePayrollRecord,
    attendanceRecords,
    recordAttendance,
    updateAttendance,
  } = useManager();

  const { orders } = useOrders();
  const { config } = useConfig();
  const { isRTL, toggleLanguage } = useLanguage();

  // Navigation subtabs
  const [activeTab, setActiveTab] = useState<'finance' | 'expenses' | 'employees' | 'attendance' | 'security' | 'staff'>('finance');

  // PIN input state for Manager Lock
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Filter & Search states
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddPayrollOpen, setIsAddPayrollOpen] = useState(false);
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<Employee | null>(null);

  // Forms states
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'raw_materials' as ExpenseCategory,
    amount: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'baridimob' | 'bank',
    notes: '',
  });

  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    role: 'chef' as EmployeeRole,
    phone: '',
    monthlySalary: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as const,
  });

  const [newPayroll, setNewPayroll] = useState({
    employeeId: '',
    type: 'advance' as 'salary' | 'advance' | 'bonus' | 'deduction',
    amount: '',
    month: new Date().toISOString().substring(0, 7),
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Security Form
  const [newManagerPinInput, setNewManagerPinInput] = useState('');
  const [newStaffPinInput, setNewStaffPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);

  // Selected date for attendance
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Financial Calculations
  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter((o) => new Date(o.createdAt).toISOString().split('T')[0] === today);
  }, [orders]);

  const totalSalesRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (o.total || 0), 0);
  }, [todayOrders]);

  const totalPaidRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.status !== 'cancelled' && o.isPaid)
      .reduce((acc, o) => acc + (o.total || 0), 0);
  }, [todayOrders]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalPayrollPaid = useMemo(() => {
    return payrollRecords.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [payrollRecords]);

  const netProfit = totalSalesRevenue - (totalExpensesAmount + totalPayrollPaid);

  // Sales by payment methods
  const salesByPaymentMethod = useMemo(() => {
    const methods = { cash: 0, baridimob: 0, carte: 0, unpaid: 0 };
    todayOrders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        if (!o.isPaid) {
          methods.unpaid += o.total;
        } else if (o.paymentMethod === 'baridimob') {
          methods.baridimob += o.total;
        } else if (o.paymentMethod === 'carte') {
          methods.carte += o.total;
        } else {
          methods.cash += o.total;
        }
      });
    return methods;
  }, [todayOrders]);

  // Handle PIN Submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyManagerPin(pinInput)) {
      setIsManagerAuthenticated(true);
      setPinError(false);
      soundFx.playCashRegister();
    } else {
      setPinError(true);
      setPinInput('');
      soundFx.playClick();
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError(false);
      soundFx.playClick();
      if (next.length === 4) {
        if (verifyManagerPin(next)) {
          setIsManagerAuthenticated(true);
          soundFx.playCashRegister();
        } else {
          setPinError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleLogout = () => {
    setIsManagerAuthenticated(false);
    setPinInput('');
    soundFx.playClick();
    void supabase?.auth.signOut();
  };

  // Add Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    addExpense({
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: Number(newExpense.amount),
      supplier: newExpense.supplier.trim() || undefined,
      date: newExpense.date,
      paymentMethod: newExpense.paymentMethod,
      notes: newExpense.notes.trim() || undefined,
    });
    setNewExpense({
      title: '',
      category: 'raw_materials',
      amount: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: '',
    });
    setIsAddExpenseOpen(false);
    soundFx.playCashRegister();
  };

  // Add Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.fullName || !newEmployee.monthlySalary) return;
    addEmployee({
      fullName: newEmployee.fullName.trim(),
      role: newEmployee.role,
      phone: newEmployee.phone.trim(),
      monthlySalary: Number(newEmployee.monthlySalary),
      startDate: newEmployee.startDate,
      status: 'active',
    });
    setNewEmployee({
      fullName: '',
      role: 'chef',
      phone: '',
      monthlySalary: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setIsAddEmployeeOpen(false);
    soundFx.playAddCustomExtra();
  };

  // Add Payroll / Advance
  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayroll.employeeId || !newPayroll.amount) return;
    const emp = employees.find((e) => e.id === newPayroll.employeeId);
    if (!emp) return;

    addPayrollRecord({
      employeeId: emp.id,
      employeeName: emp.fullName,
      month: newPayroll.month,
      type: newPayroll.type,
      amount: Number(newPayroll.amount),
      date: newPayroll.date,
      notes: newPayroll.notes.trim() || undefined,
    });

    setNewPayroll({
      employeeId: '',
      type: 'advance',
      amount: '',
      month: new Date().toISOString().substring(0, 7),
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsAddPayrollOpen(false);
    setSelectedEmployeeForPayroll(null);
    soundFx.playCashRegister();
  };

  // Mark Attendance
  const handleSetAttendanceStatus = (
    employee: Employee,
    status: AttendanceStatus,
    shift: ShiftType = 'full_day'
  ) => {
    const existing = attendanceRecords.find(
      (a) => a.employeeId === employee.id && a.date === selectedAttendanceDate
    );

    const currentTime = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (existing) {
      updateAttendance(existing.id, {
        status,
        shift,
        checkInTime: status === 'present' ? existing.checkInTime || currentTime : undefined,
      });
    } else {
      recordAttendance({
        employeeId: employee.id,
        employeeName: employee.fullName,
        date: selectedAttendanceDate,
        shift,
        status,
        checkInTime: status === 'present' ? currentTime : undefined,
      });
    }
    soundFx.playClick();
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat =
        expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      const q = expenseSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.supplier && e.supplier.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [expenses, expenseCategoryFilter, expenseSearch]);

  // Print Financial Statement
  const handlePrintBilan = () => {
    window.print();
  };

  // Category Labels
  const categoryLabels: Record<ExpenseCategory, { ar: string; fr: string; color: string }> = {
    raw_materials: { ar: 'لحوم ومواد أولية', fr: 'Matières premières', color: 'bg-emerald-500/20 text-emerald-400' },
    packaging: { ar: 'تغليف وأكياس', fr: 'Emballage & Sacs', color: 'bg-amber-500/20 text-amber-400' },
    bills: { ar: 'فواتير وغاز وكهرباء', fr: 'Factures & Énergie', color: 'bg-blue-500/20 text-blue-400' },
    maintenance: { ar: 'صيانة وتجهيزات', fr: 'Entretien & Matériel', color: 'bg-purple-500/20 text-purple-400' },
    marketing: { ar: 'تسويق وإعلانات', fr: 'Marketing & Pub', color: 'bg-pink-500/20 text-pink-400' },
    other: { ar: 'مصاريف عامة أخرى', fr: 'Autres frais', color: 'bg-gray-500/20 text-gray-400' },
  };

  const roleLabels: Record<EmployeeRole, { ar: string; fr: string }> = {
    chef: { ar: 'شيف تاكوس رئيسي', fr: 'Chef de Cuisine' },
    cook_assistant: { ar: 'مساعد طباخ وتجهيز', fr: 'Aide-Cuisinier' },
    cashier: { ar: 'مسؤول الكاشير والصندوق', fr: 'Caissier' },
    waiter: { ar: 'نادل خدمة الصالة', fr: 'Serveur de Salle' },
    cleaner: { ar: 'عامل نظافة وترتيب', fr: 'Agent d\'entretien' },
    delivery: { ar: 'سائق توصيل سريع', fr: 'Livreur' },
  };

  // 1. LOCKED MANAGER SCREEN (If not authenticated)
  if (!isManagerAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[500px]">
        <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-amber-500/30 to-[#FF6321]/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <Shield className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest inline-block mb-2">
            Espace Direction & Finance
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white font-heading mb-1">
            {isRTL ? 'لوحة إدارة المدير العام' : 'Direction Générale & Finance'}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            {isRTL
              ? 'مساحة سرية ومحمية بكلمة سر خاصة بالمدير لتسيير المبيعات، المدخول، المشتريات، الأجور، وتتبع حضور الموظفين.'
              : 'Espace sécurisé par code PIN Manager pour piloter les ventes, dépenses fournisseurs, salaires et suivi du personnel.'}
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="flex justify-center gap-3 mb-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black font-mono transition-all ${
                      pinError
                        ? 'border-red-500 bg-red-950/30 text-red-400 animate-shake'
                        : filled
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 bg-[#1A1A1D] text-gray-600'
                    }`}
                  >
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs text-red-400 font-bold flex items-center justify-center gap-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isRTL ? 'رمز مرور المدير غير صحيح' : 'Code PIN Manager incorrect'}</span>
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="h-12 rounded-2xl bg-[#1A1A1D] hover:bg-[#252528] active:bg-amber-500 active:text-black border border-white/5 text-white font-black text-lg transition-colors cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="h-12 rounded-2xl bg-[#1A1A1D] hover:bg-[#252528] border border-white/5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {isRTL ? 'مسح' : 'Effacer'}
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-12 rounded-2xl bg-[#1A1A1D] hover:bg-[#252528] active:bg-amber-500 active:text-black border border-white/5 text-white font-black text-lg transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="submit"
                className="h-12 rounded-2xl bg-linear-to-r from-amber-500 to-[#FF6321] hover:opacity-90 text-black font-black text-xs uppercase flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                {isRTL ? 'دخول' : 'Entrer'}
              </button>
            </div>

            <div className="pt-4 text-center">
              <span className="text-[11px] text-gray-500">
                {isRTL ? 'الرمز الافتراضي للمدير: 9999 (يمكنك تغييره داخل اللوحة)' : 'Code PIN Manager par défaut : 9999'}
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED MANAGER DASHBOARD
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B]">
      {/* Manager Sub-Navigation Header */}
      <div className="p-3 sm:p-4 border-b border-white/5 bg-[#121214] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)] shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white font-heading">
              {isRTL ? 'لوحة قيادة المدير العام' : 'Dashboard Direction Générale'}
            </h3>
            <p className="text-[10px] text-gray-400">
              {isRTL ? 'المبيعات، المداخيل، المشتريات، الأجور، وتتبع العمال' : 'Finance, Achats, Salaires & Pointage'}
            </p>
          </div>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1 bg-[#1A1A1D] p-1 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isRTL ? 'الحصيلة والمالية' : 'Bilan & Finance'}</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isRTL ? 'المشتريات والمصاريف' : 'Achats & Dépenses'}</span>
            <span className="opacity-75 text-[10px]">({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'employees'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isRTL ? 'الموظفون والأجور' : 'Employés & Paie'}</span>
            <span className="opacity-75 text-[10px]">({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{isRTL ? 'تتبع الورديات والحضور' : 'Pointage & Suivi'}</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isRTL ? 'حسابات العمال' : 'Accès équipe'}</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isRTL ? 'كلمات المرور والأمان' : 'Sécurité PIN'}</span>
          </button>
        </div>

        {/* Language + lock actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLanguage}
            title={isRTL ? 'التبديل إلى الفرنسية' : 'Passer à l’arabe'}
            className="px-3 py-1.5 rounded-xl bg-[#1A1A1D] hover:bg-[#252528] border border-white/10 text-white text-xs font-black transition-all cursor-pointer"
          >
            {isRTL ? 'Français' : 'العربية'}
          </button>
          <button
            onClick={handleLogout}
            title={isRTL ? 'قفل لوحة المدير' : 'Verrouiller la session'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isRTL ? 'قفل الفضاء' : 'Verrouiller'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5">
        {/* ========================================================================= */}
        {/* SUBTAB 1: FINANCIAL OVERVIEW & BALANCE SHEET */}
        {/* ========================================================================= */}
        {activeTab === 'finance' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            {/* Main KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Gross Sales */}
              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">{isRTL ? 'إجمالي المبيعات' : 'Chiffre d\'Affaires'}</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono font-heading">
                  {totalSalesRevenue.toLocaleString()} {config.currency}
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                  <span>{todayOrders.length} {isRTL ? 'طلب اليوم' : 'commandes aujourd’hui'}</span>
                  <span className="text-emerald-400 font-bold">
                    {totalPaidRevenue.toLocaleString()} {config.currency} {isRTL ? 'مقبوض' : 'encaissé'}
                  </span>
                </div>
              </div>

              {/* Expenses / Purchases */}
              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">{isRTL ? 'المشتريات والمصاريف' : 'Dépenses Fournisseurs'}</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono font-heading">
                  {totalExpensesAmount.toLocaleString()} {config.currency}
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                  <span>{expenses.length} {isRTL ? 'عملية شراء' : 'achats'}</span>
                  <span>{isRTL ? 'مواد وتغليف وفواتير' : 'Charges & Stocks'}</span>
                </div>
              </div>

              {/* Salaries Paid / Advances */}
              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">{isRTL ? 'الأجور والتسبيقات' : 'Masse Salariale Versée'}</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono font-heading">
                  {totalPayrollPaid.toLocaleString()} {config.currency}
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                  <span>{employees.length} {isRTL ? 'عمال' : 'employés'}</span>
                  <span>{payrollRecords.length} {isRTL ? 'دفعات وتسبيقات' : 'versements'}</span>
                </div>
              </div>

              {/* Net Profit Card */}
              <div className={`p-4 rounded-3xl border relative overflow-hidden ${
                netProfit >= 0
                  ? 'bg-linear-to-br from-emerald-950/40 via-[#141416] to-[#141416] border-emerald-500/30'
                  : 'bg-linear-to-br from-red-950/40 via-[#141416] to-[#141416] border-red-500/30'
              }`}>
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    {isRTL ? 'صافي الربح الفعلي' : 'Bénéfice Net Réel'}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    netProfit >= 0 ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                  }`}>
                    <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-mono font-heading ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {netProfit.toLocaleString()} {config.currency}
                </div>
                <div className="mt-2 text-[11px] text-gray-400">
                  {isRTL ? 'المبيعات - (المشتريات + الأجور)' : 'Ventes - (Charges + Salaires)'}
                </div>
              </div>
            </div>

            {/* Payment Methods & Cash Register Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>{isRTL ? 'المداخيل نقداً (Espèces)' : 'Espèces en Caisse'}</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {salesByPaymentMethod.cash.toLocaleString()} {config.currency}
                </div>
                <p className="text-[11px] text-gray-500">
                  {isRTL ? 'السيولة النقدية المستلمة في صندوق الكاشير' : 'Cash liquide reçu au comptoir'}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>{isRTL ? 'تحويلات BaridiMob' : 'Virements BaridiMob'}</span>
                </div>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {salesByPaymentMethod.baridimob.toLocaleString()} {config.currency}
                </div>
                <p className="text-[11px] text-gray-500">
                  {isRTL ? 'دفع إلكتروني عبر حساب بريدي موب' : 'Paiements via l\'application BaridiMob'}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>{isRTL ? 'بطاقة CIB والذهبية' : 'Cartes Bancaires / CIB'}</span>
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {salesByPaymentMethod.carte.toLocaleString()} {config.currency}
                </div>
                <p className="text-[11px] text-gray-500">
                  {isRTL ? 'دفع عبر جهاز الدفع الإلكتروني TPE' : 'Terminaux de paiement électronique TPE'}
                </p>
              </div>
            </div>

            {/* Quick Actions & Print */}
            <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white font-heading">
                  {isRTL ? 'تقرير الحصيلة والميزانية المالية للمدير' : 'Rapport & Bilan Comptable'}
                </h4>
                <p className="text-xs text-gray-400">
                  {isRTL
                    ? 'يمكنك طباعة أو حفظ تقرير مالي كامل للمطعم بضغطة واحدة'
                    : 'Imprimez ou exportez le bilan d\'activité complet du restaurant'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBilan}
                  className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#FF6321]" />
                  <span>{isRTL ? 'طباعة تقرير الحصيلة' : 'Imprimer le bilan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: PURCHASES & EXPENSES */}
        {/* ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141416] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث في المصاريف والمشتريات والموردين...' : 'Rechercher dépenses, fournisseurs...'}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1A1A1D] border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">{isRTL ? 'كل الفئات' : 'Toutes les catégories'}</option>
                  <option value="raw_materials">{isRTL ? 'لحوم ومواد أولية' : 'Matières premières'}</option>
                  <option value="packaging">{isRTL ? 'تغليف وعلب' : 'Emballage'}</option>
                  <option value="bills">{isRTL ? 'فواتير وغاز وكهرباء' : 'Factures'}</option>
                  <option value="maintenance">{isRTL ? 'صيانة وتجهيزات' : 'Entretien'}</option>
                  <option value="marketing">{isRTL ? 'تسويق وإعلانات' : 'Marketing'}</option>
                  <option value="other">{isRTL ? 'أخرى' : 'Autres'}</option>
                </select>

                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-500 to-[#FF6321] text-black font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRTL ? 'تسجيل نفقة / شراء جديد' : 'Nouvelle Dépense'}</span>
                </button>
              </div>
            </div>

            {/* Total Expense Summary Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-amber-300">
              <span>
                {isRTL
                  ? `مجموع المصاريف المعروضة: ${filteredExpenses.length} عملية`
                  : `${filteredExpenses.length} dépenses affichées`}
              </span>
              <span className="text-base font-black font-mono">
                {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} {config.currency}
              </span>
            </div>

            {/* Expenses List */}
            <div className="space-y-2">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-[#141416] rounded-2xl border border-white/5">
                  <ShoppingBag className="w-8 h-8 stroke-1 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs">{isRTL ? 'لا توجد مصاريف مطابقة للبحث' : 'Aucune dépense trouvée'}</p>
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-2xl bg-[#141416] hover:bg-[#18181B] border border-white/5 flex flex-wrap items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1F1F23] flex items-center justify-center text-amber-400 shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{exp.title}</h5>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              categoryLabels[exp.category]?.color || 'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            {isRTL ? categoryLabels[exp.category]?.ar : categoryLabels[exp.category]?.fr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          {exp.supplier && <span>المورد: {exp.supplier}</span>}
                          <span>•</span>
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] text-gray-500">
                            {exp.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {exp.amount.toLocaleString()} {config.currency}
                      </span>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="w-7 h-7 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        title={isRTL ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Expense Modal */}
            {isAddExpenseOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                <div className="w-full max-w-md bg-[#141416] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-sm font-black text-white font-heading">
                      {isRTL ? 'تسجيل نفقة أو شراء لمطعم شنب تاكوس' : 'Enregistrer une nouvelle dépense'}
                    </h4>
                    <button
                      onClick={() => setIsAddExpenseOpen(false)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateExpense} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'عنوان النفقة أو المشتريات *' : 'Description de la dépense *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                        placeholder={isRTL ? 'مثال: لحم مفروم طازج، 5 كراتين زيت، غاز...' : 'Ex: Achat viande hachée, cartons frites...'}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'المبلغ (د.ج) *' : 'Montant (DA) *'}
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          placeholder="Ex: 15000"
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'الفئة *' : 'Catégorie *'}
                        </label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="raw_materials">{isRTL ? 'لحوم ومواد أولية' : 'Matières premières'}</option>
                          <option value="packaging">{isRTL ? 'تغليف وأكياس' : 'Emballage'}</option>
                          <option value="bills">{isRTL ? 'فواتير وغاز وكهرباء' : 'Factures & Énergie'}</option>
                          <option value="maintenance">{isRTL ? 'صيانة وتجهيزات' : 'Entretien'}</option>
                          <option value="marketing">{isRTL ? 'تسويق وإعلانات' : 'Marketing'}</option>
                          <option value="other">{isRTL ? 'أخرى' : 'Autres'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'المورد أو المحل' : 'Fournisseur / Lieu'}
                        </label>
                        <input
                          type="text"
                          value={newExpense.supplier}
                          onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
                          placeholder={isRTL ? 'مثال: مذبح الإحسان' : 'Ex: Boucherie El Ihssan'}
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'طريقة الدفع' : 'Paiement'}
                        </label>
                        <select
                          value={newExpense.paymentMethod}
                          onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="cash">{isRTL ? 'نقداً (من الصندوق)' : 'Espèces Caisse'}</option>
                          <option value="baridimob">BaridiMob</option>
                          <option value="bank">{isRTL ? 'تحويل بنكي' : 'Virement'}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-[#FF6321] text-black font-black text-xs uppercase transition-all cursor-pointer shadow-md hover:opacity-95"
                    >
                      {isRTL ? 'تأكيد وحفظ النفقة' : 'Valider la dépense'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: EMPLOYEES & PAYROLL */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141416] p-3 rounded-2xl border border-white/5">
              <div>
                <h4 className="text-sm font-black text-white font-heading">
                  {isRTL ? 'طاقم عمل مطعم شنب تاكوس والأجور' : 'Personnel & Salaires CHENEB'}
                </h4>
                <p className="text-xs text-gray-400">
                  {isRTL ? 'متابعة الرواتب الشهرية، التسبيقات (Avances)، وصافي المستحقات' : 'Gestion des salaires de base et avances'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddEmployeeOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isRTL ? 'إضافة موظف جديد' : 'Ajouter Employé'}</span>
                </button>
              </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {employees.map((emp) => {
                // Calculate advances taken by this employee for the current month
                const currentMonth = new Date().toISOString().substring(0, 7);
                const empAdvancesThisMonth = payrollRecords
                  .filter((p) => p.employeeId === emp.id && p.month === currentMonth && p.type === 'advance')
                  .reduce((sum, p) => sum + p.amount, 0);

                const remainingSalary = emp.monthlySalary - empAdvancesThisMonth;

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-3xl bg-[#141416] border border-white/5 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-base shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-sm font-black text-white">{emp.fullName}</h5>
                          <span className="text-[11px] text-blue-300 font-semibold block">
                            {isRTL ? roleLabels[emp.role]?.ar : roleLabels[emp.role]?.fr}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {emp.phone}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="w-7 h-7 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        title={isRTL ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Financial stats for this employee */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#0F0F10] border border-white/5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 block">{isRTL ? 'الراتب الأساسي' : 'Salaire Base'}</span>
                        <span className="font-bold text-white font-mono">{emp.monthlySalary.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 block">{isRTL ? 'تسبيقات الشهر' : 'Avances Mois'}</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {empAdvancesThisMonth > 0 ? `-${empAdvancesThisMonth.toLocaleString()}` : '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 block">{isRTL ? 'المتبقي للصرف' : 'Reste à Payer'}</span>
                        <span className="font-black text-emerald-400 font-mono">{remainingSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Button: Give Advance / Pay */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedEmployeeForPayroll(emp);
                          setNewPayroll((prev) => ({ ...prev, employeeId: emp.id, type: 'advance' }));
                          setIsAddPayrollOpen(true);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'تسجيل تسبيق (Avance)' : 'Verser Avance'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedEmployeeForPayroll(emp);
                          setNewPayroll((prev) => ({ ...prev, employeeId: emp.id, type: 'salary', amount: String(remainingSalary) }));
                          setIsAddPayrollOpen(true);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'صرف باقي الراتب' : 'Régler Salaire'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payroll History Table */}
            <div className="p-4 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
              <h5 className="text-xs font-black text-white uppercase tracking-wider">
                {isRTL ? 'سجل تسبيقات ومدفوعات الرواتب الأخيرة' : 'Historique des Avances & Salaires'}
              </h5>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead className="bg-[#1A1A1D] text-gray-300 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">{isRTL ? 'الموظف' : 'Employé'}</th>
                      <th className="p-2.5">{isRTL ? 'النوع' : 'Type'}</th>
                      <th className="p-2.5">{isRTL ? 'المبلغ' : 'Montant'}</th>
                      <th className="p-2.5">{isRTL ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5">{isRTL ? 'ملاحظات' : 'Notes'}</th>
                      <th className="p-2.5 rounded-r-lg text-right">{isRTL ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payrollRecords.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/5">
                        <td className="p-2.5 font-bold text-white">{pay.employeeName}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                              pay.type === 'advance'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {pay.type === 'advance' ? (isRTL ? 'تسبيق' : 'Avance') : (isRTL ? 'راتب' : 'Salaire')}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-white">
                          {pay.amount.toLocaleString()} {config.currency}
                        </td>
                        <td className="p-2.5 text-gray-400">{pay.date}</td>
                        <td className="p-2.5 text-gray-500 truncate max-w-xs">{pay.notes || '—'}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => deletePayrollRecord(pay.id)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Add Employee */}
            {isAddEmployeeOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                <div className="w-full max-w-md bg-[#141416] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-sm font-black text-white font-heading">
                      {isRTL ? 'إضافة عامل جديد لطاقم المطعم' : 'Ajouter un nouvel employé'}
                    </h4>
                    <button
                      onClick={() => setIsAddEmployeeOpen(false)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateEmployee} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'الاسم واللقب الكامل *' : 'Nom & Prénom *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newEmployee.fullName}
                        onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                        placeholder="Ex: Mourad Khedir"
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'المهمة / المنصب *' : 'Poste / Rôle *'}
                        </label>
                        <select
                          value={newEmployee.role}
                          onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as EmployeeRole })}
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="chef">{isRTL ? 'شيف تاكوس رئيسي' : 'Chef de cuisine'}</option>
                          <option value="cook_assistant">{isRTL ? 'مساعد طباخ' : 'Aide-cuisinier'}</option>
                          <option value="cashier">{isRTL ? 'مسؤول الكاشير والصندوق' : 'Caissier'}</option>
                          <option value="waiter">{isRTL ? 'نادل صالة' : 'Serveur'}</option>
                          <option value="delivery">{isRTL ? 'سائق توصيل' : 'Livreur'}</option>
                          <option value="cleaner">{isRTL ? 'عامل نظافة' : 'Entretien'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'الراتب الشهري (د.ج) *' : 'Salaire Mensuel (DA) *'}
                        </label>
                        <input
                          type="number"
                          required
                          min="1000"
                          value={newEmployee.monthlySalary}
                          onChange={(e) => setNewEmployee({ ...newEmployee, monthlySalary: e.target.value })}
                          placeholder="Ex: 50000"
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                      </label>
                      <input
                        type="tel"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        placeholder="Ex: 0661 00 00 00"
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white font-black text-xs uppercase transition-all cursor-pointer shadow-md hover:opacity-95"
                    >
                      {isRTL ? 'حفظ وتثبيت الموظف' : 'Enregistrer l\'employé'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Add Payroll / Advance */}
            {isAddPayrollOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                <div className="w-full max-w-md bg-[#141416] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-sm font-black text-white font-heading">
                      {isRTL ? 'تسجيل دفعة أو تسبيق للموظف' : 'Enregistrer une avance ou paiement'}
                    </h4>
                    <button
                      onClick={() => setIsAddPayrollOpen(false)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreatePayroll} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'الموظف *' : 'Employé *'}
                      </label>
                      <select
                        required
                        value={newPayroll.employeeId}
                        onChange={(e) => setNewPayroll({ ...newPayroll, employeeId: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">{isRTL ? 'اختر الموظف...' : 'Sélectionner un employé...'}</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.monthlySalary.toLocaleString()} DA)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'النوع *' : 'Type de paiement *'}
                        </label>
                        <select
                          value={newPayroll.type}
                          onChange={(e) => setNewPayroll({ ...newPayroll, type: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="advance">{isRTL ? 'تسبيق (Avance)' : 'Avance sur salaire'}</option>
                          <option value="salary">{isRTL ? 'راتب كامل / متبقي' : 'Règlement de salaire'}</option>
                          <option value="bonus">{isRTL ? 'مكافأة وتشجيع' : 'Prime / Bonus'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {isRTL ? 'المبلغ (د.ج) *' : 'Montant (DA) *'}
                        </label>
                        <input
                          type="number"
                          required
                          min="100"
                          value={newPayroll.amount}
                          onChange={(e) => setNewPayroll({ ...newPayroll, amount: e.target.value })}
                          placeholder="Ex: 10000"
                          className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {isRTL ? 'ملاحظات وتفاصيل' : 'Notes & Motif'}
                      </label>
                      <input
                        type="text"
                        value={newPayroll.notes}
                        onChange={(e) => setNewPayroll({ ...newPayroll, notes: e.target.value })}
                        placeholder={isRTL ? 'مثال: تسبيق ظرف خاص، مكافأة نهاية أسبوع...' : 'Motif de l\'avance...'}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-[#FF6321] text-black font-black text-xs uppercase transition-all cursor-pointer shadow-md hover:opacity-95"
                    >
                      {isRTL ? 'تأكيد وصرف المبلغ' : 'Confirmer le versement'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: ATTENDANCE & SHIFTS TRACKING */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Date Picker Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141416] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-black text-white font-heading">
                    {isRTL ? 'تتبع حضور وورديات عمال المطعم' : 'Feuille de Pointage Journalière'}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {isRTL ? 'تسجيل الحضور، التأخرات، الورديات الصباحية والمسائية' : 'Pointage des présences, retards et shifts'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{isRTL ? 'تاريخ اليوم:' : 'Date :'}</span>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1A1A1D] border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Attendance Cards for Selected Date */}
            <div className="space-y-2.5">
              {employees.map((emp) => {
                const currentRecord = attendanceRecords.find(
                  (a) => a.employeeId === emp.id && a.date === selectedAttendanceDate
                );
                const currentStatus: AttendanceStatus = currentRecord?.status || 'absent';
                const currentShift: ShiftType = currentRecord?.shift || 'full_day';

                return (
                  <div
                    key={emp.id}
                    className="p-3 sm:p-4 rounded-2xl bg-[#141416] border border-white/5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-white/5 flex items-center justify-center text-amber-400 font-bold">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{emp.fullName}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{isRTL ? roleLabels[emp.role]?.ar : roleLabels[emp.role]?.fr}</span>
                          {currentRecord?.checkInTime && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono">
                                ⏱️ {currentRecord.checkInTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleSetAttendanceStatus(emp, 'present', currentShift)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
                        }`}
                      >
                        {isRTL ? 'حاضر ✅' : 'Présent'}
                      </button>

                      <button
                        onClick={() => handleSetAttendanceStatus(emp, 'late', currentShift)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
                        }`}
                      >
                        {isRTL ? 'متأخر ⏳' : 'En retard'}
                      </button>

                      <button
                        onClick={() => handleSetAttendanceStatus(emp, 'absent', currentShift)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
                        }`}
                      >
                        {isRTL ? 'غائب ❌' : 'Absent'}
                      </button>

                      <button
                        onClick={() => handleSetAttendanceStatus(emp, 'leave', currentShift)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'leave'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
                        }`}
                      >
                        {isRTL ? 'عطلة 🏖️' : 'Congé'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 5: STAFF ACCESS */}
        {/* ========================================================================= */}
        {activeTab === 'staff' && managerAuth && (
          <StaffAccessManager managerName={managerAuth.name} managerPin={managerAuth.pin} isRTL={isRTL} />
        )}
        {/* ========================================================================= */}
        {/* SUBTAB 6: PIN & SECURITY */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="p-5 rounded-3xl bg-[#141416] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-heading">
                    {isRTL ? 'تعديل كلمات المرور (PIN) وإدارة الصلاحيات' : 'Sécurité & Codes PIN'}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {isRTL ? 'تغيير رمز مرور المدير الخاص ورمز مرور طاقم المطبخ والكاشير' : 'Modifier les codes PIN d\'accès'}
                  </p>
                </div>
              </div>

              {pinChangeSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              {/* Change Manager PIN */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="block text-xs font-bold text-gray-300">
                  {isRTL ? 'رمز مرور المدير الجديد (Manager PIN) *' : 'Nouveau code PIN Manager *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newManagerPinInput}
                    onChange={(e) => setNewManagerPinInput(e.target.value)}
                    placeholder="Ex: 9999"
                    className="flex-1 px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (newManagerPinInput.length === 4) {
                        updateManagerPin(newManagerPinInput);
                        setNewManagerPinInput('');
                        setPinChangeSuccess(isRTL ? 'تم تحديث رمز مرور المدير بنجاح !' : 'PIN Manager mis à jour !');
                        soundFx.playAddCustomExtra();
                      }
                    }}
                    disabled={newManagerPinInput.length !== 4}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs transition-colors cursor-pointer"
                  >
                    {isRTL ? 'تحديث' : 'Mettre à jour'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {isRTL ? 'الرمز الحالي للمدير: ' : 'PIN Manager actuel : '}
                  <span className="font-mono text-gray-400 font-bold">{managerPin}</span>
                </p>
              </div>

              {/* Change Staff PIN */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="block text-xs font-bold text-gray-300">
                  {isRTL ? 'رمز مرور طاقم المطبخ والكاشير (Staff PIN) *' : 'Nouveau code PIN Équipe (Staff) *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newStaffPinInput}
                    onChange={(e) => setNewStaffPinInput(e.target.value)}
                    placeholder="Ex: 1234"
                    className="flex-1 px-3 py-2 bg-[#1A1A1D] border border-white/10 rounded-xl text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (newStaffPinInput.length === 4) {
                        updateStaffPin(newStaffPinInput);
                        setNewStaffPinInput('');
                        setPinChangeSuccess(isRTL ? 'تم تحديث رمز مرور طاقم المطبخ والكاشير بنجاح !' : 'PIN Équipe mis à jour !');
                        soundFx.playAddCustomExtra();
                      }
                    }}
                    disabled={newStaffPinInput.length !== 4}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs transition-colors cursor-pointer"
                  >
                    {isRTL ? 'تحديث' : 'Mettre à jour'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {isRTL ? 'الرمز الحالي لطاقم المطبخ: ' : 'PIN Équipe actuel : '}
                  <span className="font-mono text-gray-400 font-bold">{staffPin}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
