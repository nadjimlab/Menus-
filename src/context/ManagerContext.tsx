import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ExpenseRecord,
  Employee,
  PayrollRecord,
  AttendanceRecord,
} from '../types/manager';

interface ManagerContextType {
  // Authentication
  isManagerAuthenticated: boolean;
  setIsManagerAuthenticated: (auth: boolean) => void;
  managerPin: string;
  staffPin: string;
  verifyManagerPin: (pin: string) => boolean;
  verifyStaffPin: (pin: string) => boolean;
  updateManagerPin: (newPin: string) => void;
  updateStaffPin: (newPin: string) => void;

  // Expenses & Purchases
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  updateExpense: (id: string, updated: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;

  // Employees & HR
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updated: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Payroll & Advances
  payrollRecords: PayrollRecord[];
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => void;
  deletePayrollRecord: (id: string) => void;

  // Attendance & Shift Tracking
  attendanceRecords: AttendanceRecord[];
  recordAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendance: (id: string, updated: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;
}

const MANAGER_AUTH_KEY = 'cheneb_manager_auth_session';
const MANAGER_PIN_KEY = 'cheneb_manager_pin_code';
const STAFF_PIN_KEY = 'cheneb_staff_pin_code';
const EXPENSES_KEY = 'cheneb_manager_expenses_v1';
const EMPLOYEES_KEY = 'cheneb_manager_employees_v1';
const PAYROLL_KEY = 'cheneb_manager_payroll_v1';
const ATTENDANCE_KEY = 'cheneb_manager_attendance_v1';

// Initial realistic data for Cheneb Tacos Restaurant in El Oued
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    fullName: 'مراد خذير (Chef Mourad)',
    role: 'chef',
    phone: '0661 24 55 89',
    monthlySalary: 75000,
    startDate: '2025-01-15',
    status: 'active',
  },
  {
    id: 'emp-2',
    fullName: 'يوسف بن سالم (Youssef Caisse)',
    role: 'cashier',
    phone: '0552 10 33 44',
    monthlySalary: 52000,
    startDate: '2025-03-01',
    status: 'active',
  },
  {
    id: 'emp-3',
    fullName: 'أمين العوفي (Amine Cuisine)',
    role: 'cook_assistant',
    phone: '0770 88 12 90',
    monthlySalary: 44000,
    startDate: '2025-04-10',
    status: 'active',
  },
  {
    id: 'emp-4',
    fullName: 'بلال التونسي (Bilel Livreur)',
    role: 'delivery',
    phone: '0663 99 77 11',
    monthlySalary: 46000,
    startDate: '2025-05-20',
    status: 'active',
  },
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'دجاج متبل طازج ومفروم لحم (مذبح الإحسان)',
    category: 'raw_materials',
    amount: 32000,
    supplier: 'مذبح الإحسان الوادي',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: 'فاتورة لحوم ودواجن الأسبوع',
  },
  {
    id: 'exp-2',
    title: 'أكياس وورق تغليف وعلب تاكوس كرافت مطبوعة',
    category: 'packaging',
    amount: 14500,
    supplier: 'مؤسسة التغليف الذهبي',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: 'شراء 1500 علبة تاكوس + 2000 كيس',
  },
  {
    id: 'exp-3',
    title: 'بطاطا ديانا للقلي وزيت نباتي 5 لتر (4 كراتين)',
    category: 'raw_materials',
    amount: 18000,
    supplier: 'تاجر الجملة الشط',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: 'مخزون القلي للأسبوع',
  },
  {
    id: 'exp-4',
    title: 'تعبئة قوارير غاز البوتان + تنظيف المداخن',
    category: 'bills',
    amount: 4800,
    supplier: 'نفطال فرع الرمال',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
  },
  {
    id: 'exp-5',
    title: 'أجبان شيدر مبشور وصلصات فرنسية خاصة',
    category: 'raw_materials',
    amount: 16500,
    supplier: 'شركة ألبان التل',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'baridimob',
    notes: 'تحويل BaridiMob للمورد',
  },
];

const INITIAL_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-1',
    employeeId: 'emp-1',
    employeeName: 'مراد خذير (Chef Mourad)',
    month: new Date().toISOString().substring(0, 7),
    type: 'advance',
    amount: 15000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'تسبيق على حساب راتب هذا الشهر',
  },
  {
    id: 'pay-2',
    employeeId: 'emp-2',
    employeeName: 'يوسف بن سالم (Youssef Caisse)',
    month: new Date().toISOString().substring(0, 7),
    type: 'advance',
    amount: 8000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'تسبيق ظرف عائلي',
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'مراد خذير (Chef Mourad)',
    date: new Date().toISOString().split('T')[0],
    shift: 'full_day',
    status: 'present',
    checkInTime: '09:40',
    notes: 'التزام تام وتحضير المطبخ',
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    employeeName: 'يوسف بن سالم (Youssef Caisse)',
    date: new Date().toISOString().split('T')[0],
    shift: 'full_day',
    status: 'present',
    checkInTime: '10:00',
    notes: 'فتح الصندوق وبدء الوردية',
  },
  {
    id: 'att-3',
    employeeId: 'emp-3',
    employeeName: 'أمين العوفي (Amine Cuisine)',
    date: new Date().toISOString().split('T')[0],
    shift: 'full_day',
    status: 'present',
    checkInTime: '09:55',
  },
  {
    id: 'att-4',
    employeeId: 'emp-4',
    employeeName: 'بلال التونسي (Bilel Livreur)',
    date: new Date().toISOString().split('T')[0],
    shift: 'evening',
    status: 'present',
    checkInTime: '11:15',
    notes: 'جاهز لطلبيات التوصيل',
  },
];

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Session Authentication for Manager
  const [isManagerAuthenticated, setIsManagerAuthenticatedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(MANAGER_AUTH_KEY) === 'true';
    }
    return false;
  });

  const setIsManagerAuthenticated = (auth: boolean) => {
    setIsManagerAuthenticatedState(auth);
    if (typeof window !== 'undefined') {
      if (auth) {
        sessionStorage.setItem(MANAGER_AUTH_KEY, 'true');
      } else {
        sessionStorage.removeItem(MANAGER_AUTH_KEY);
      }
    }
  };

  // Stored PINs
  const [managerPin, setManagerPinState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MANAGER_PIN_KEY) || '9999';
    }
    return '9999';
  });

  const [staffPin, setStaffPinState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STAFF_PIN_KEY) || '1234';
    }
    return '1234';
  });

  // Verify functions
  const verifyManagerPin = (pin: string): boolean => {
    return pin.trim() === managerPin.trim();
  };

  const verifyStaffPin = (pin: string): boolean => {
    return pin.trim() === staffPin.trim();
  };

  const updateManagerPin = (newPin: string) => {
    if (!newPin || newPin.trim().length < 4) return;
    setManagerPinState(newPin.trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem(MANAGER_PIN_KEY, newPin.trim());
    }
  };

  const updateStaffPin = (newPin: string) => {
    if (!newPin || newPin.trim().length < 4) return;
    setStaffPinState(newPin.trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem(STAFF_PIN_KEY, newPin.trim());
    }
  };

  // Expenses
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(EXPENSES_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_EXPENSES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    }
  }, [expenses]);

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newRecord: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setExpenses((prev) => [newRecord, ...prev]);
  };

  const updateExpense = (id: string, updated: Partial<ExpenseRecord>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(EMPLOYEES_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_EMPLOYEES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    }
  }, [employees]);

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updated } : emp))
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  // Payroll
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PAYROLL_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_PAYROLL;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PAYROLL_KEY, JSON.stringify(payrollRecords));
    }
  }, [payrollRecords]);

  const addPayrollRecord = (record: Omit<PayrollRecord, 'id'>) => {
    const newRec: PayrollRecord = {
      ...record,
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setPayrollRecords((prev) => [newRec, ...prev]);
  };

  const deletePayrollRecord = (id: string) => {
    setPayrollRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ATTENDANCE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return INITIAL_ATTENDANCE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceRecords));
    }
  }, [attendanceRecords]);

  const recordAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    const newAtt: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setAttendanceRecords((prev) => [newAtt, ...prev]);
  };

  const updateAttendance = (id: string, updated: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((att) => (att.id === id ? { ...att, ...updated } : att))
    );
  };

  const deleteAttendance = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((att) => att.id !== id));
  };

  return (
    <ManagerContext.Provider
      value={{
        isManagerAuthenticated,
        setIsManagerAuthenticated,
        managerPin,
        staffPin,
        verifyManagerPin,
        verifyStaffPin,
        updateManagerPin,
        updateStaffPin,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        payrollRecords,
        addPayrollRecord,
        deletePayrollRecord,
        attendanceRecords,
        recordAttendance,
        updateAttendance,
        deleteAttendance,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = (): ManagerContextType => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
};
