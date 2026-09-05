export type ExpenseCategory =
  | 'raw_materials' // المواد الأولية واللحوم
  | 'packaging'     // أكياس وعلب التغليف
  | 'bills'         // فواتير (كهرباء، ماء، غاز، إنترنت)
  | 'maintenance'   // صيانة وتجهيزات المطبخ
  | 'marketing'     // إعلانات وترويج
  | 'other';        // مصاريف أخرى

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  supplier?: string;
  date: string;
  paymentMethod: 'cash' | 'baridimob' | 'bank';
  notes?: string;
}

export type EmployeeRole =
  | 'chef'           // شيف رئيسي
  | 'cook_assistant' // مساعد طباخ
  | 'cashier'        // كاشير وصندوق
  | 'waiter'         // نادل صالة
  | 'cleaner'        // عامل نظافة
  | 'delivery';      // سائق توصيل

export interface Employee {
  id: string;
  fullName: string;
  role: EmployeeRole;
  phone: string;
  monthlySalary: number;
  startDate: string;
  status: 'active' | 'on_leave' | 'inactive';
}

export type PayrollType = 'salary' | 'advance' | 'bonus' | 'deduction';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "2026-09"
  type: PayrollType;
  amount: number;
  date: string;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave';
export type ShiftType = 'morning' | 'evening' | 'full_day';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // "YYYY-MM-DD"
  shift: ShiftType;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}
