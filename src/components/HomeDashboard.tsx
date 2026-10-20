import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  ChevronRight, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  Utensils,
  ShoppingCart,
  Store,
  Car,
  Shirt,
  Coffee,
  Zap,
  HeartPulse,
  Coins,
  HeartHandshake,
  Gift,
  FileText
} from 'lucide-react';
import { Transaction } from '../types';

interface HomeDashboardProps {
  transactions: Transaction[];
  onOpenRecord: () => void;
  onOpenWallet: () => void;
  onOpenHealth: () => void;
  onOpenOCR: () => void;
  onOpenVoice: () => void;
  onOpenBudget: () => void;
  onNavigateToSummary: () => void;
  onNavigateToHistory: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

// Icon helper
const getCategoryIcon = (categoryName: string) => {
  if (/อาหาร|ก๋วยเตี๋ยว|ข้าว|กิน/.test(categoryName)) return <Utensils className="w-4 h-4 text-rose-500" />;
  if (/เซเว่น|7-11|cj/i.test(categoryName)) return <Store className="w-4 h-4 text-amber-500" />;
  if (/ตลาด|ของใช้|ซื้อของ/i.test(categoryName)) return <ShoppingCart className="w-4 h-4 text-orange-500" />;
  if (/น้ำมัน|เดินทาง|bts|mrt/i.test(categoryName)) return <Car className="w-4 h-4 text-sky-500" />;
  if (/ซัก|อบผ้า/i.test(categoryName)) return <Shirt className="w-4 h-4 text-purple-500" />;
  if (/กาแฟ|คาเฟ่|ขนม/i.test(categoryName)) return <Coffee className="w-4 h-4 text-pink-500" />;
  if (/น้ำ|ไฟ|เน็ต/i.test(categoryName)) return <Zap className="w-4 h-4 text-blue-500" />;
  if (/ยา|หมอ|รักษา/i.test(categoryName)) return <HeartPulse className="w-4 h-4 text-red-500" />;
  if (/เงินเดือน|ค่าจ้าง/i.test(categoryName)) return <Coins className="w-4 h-4 text-emerald-500" />;
  if (/เงินคู่|รับเงินคู่/i.test(categoryName)) return <HeartHandshake className="w-4 h-4 text-teal-500" />;
  if (/โบนัส|ของขวัญ/i.test(categoryName)) return <Gift className="w-4 h-4 text-green-500" />;
  return <FileText className="w-4 h-4 text-slate-500" />;
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  transactions,
  onOpenRecord,
  onOpenWallet,
  onOpenHealth,
  onOpenOCR,
  onOpenVoice,
  onOpenBudget,
  onNavigateToSummary,
  onNavigateToHistory,
  onSelectTransaction,
}) => {
  // Period filter: 'all' | 'current-month' | 'last-month'
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Filter transactions based on period
  const filteredTransactions = transactions.filter((t) => {
    if (selectedPeriod === 'all') return true;
    const tDate = new Date(t.transaction_date);
    const now = new Date();
    if (selectedPeriod === 'current-month') {
      return (
        tDate.getFullYear() === now.getFullYear() &&
        tDate.getMonth() === now.getMonth()
      );
    }
    if (selectedPeriod === 'oct-2026') {
      return tDate.getFullYear() === 2026 && tDate.getMonth() === 9; // Oct is index 9
    }
    return true;
  });

  // Calculate Balance, Income, Expense
  const totalIncome = filteredTransactions
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Format Thai dates
  const formatThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '20', month: 'ต.ค.' };
      const day = d.getDate().toString();
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month = thaiMonths[d.getMonth()];
      return { day, month };
    } catch {
      return { day: '20', month: 'ต.ค.' };
    }
  };

  return (
    <div className="space-y-4 px-4 pb-28">
      {/* SECTION 2: UNIFIED DASHBOARD CARD */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute relative overflow-hidden border border-white/80">
        {/* Soft background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />

        {/* Dashboard Header & Period selector */}
        <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base text-navy-text tracking-wide">
              Dashboard
            </span>
          </div>

          {/* Period Selector Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-sky-50/95 text-navy-text text-xs font-semibold pl-7 pr-7 py-1.5 rounded-full border border-sky-200/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              <option value="all">ทั้งหมด (436+ รายการ)</option>
              <option value="oct-2026">ต.ค. 2569 (ล่าสุด)</option>
              <option value="current-month">เดือนปัจจุบัน</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="text-[10px] text-navy-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Income & Expense at Top (Compact & Small Text) */}
        <div className="grid grid-cols-2 gap-2 mb-2.5 relative z-10">
          {/* Income */}
          <div className="px-3 py-2 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowDownLeft className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold text-emerald-800">รายรับ</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-emerald-600">
                +{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-emerald-700 font-semibold ml-0.5">บ.</span>
            </div>
          </div>

          {/* Expense */}
          <div className="px-3 py-2 rounded-2xl bg-rose-50/90 border border-rose-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold text-rose-800">รายจ่าย</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-rose-600">
                -{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-rose-700 font-semibold ml-0.5">บ.</span>
            </div>
          </div>
        </div>

        {/* Main Balance Display (Prominent & Clear Centerpiece) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-100/95 via-blue-50/95 to-indigo-100/90 border-2 border-sky-200/90 shadow-cute flex items-center justify-between gap-3 mb-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-navy-muted">ยอดเงินคู่คงเหลือ</p>
              <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                <h3 className="text-2xl sm:text-3xl font-black text-navy-text tracking-tight drop-shadow-sm">
                  {netBalance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-sm font-black text-navy-text">บาท</span>
              </div>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/85 border border-sky-200 text-[10px] font-extrabold text-sky-700 shrink-0 shadow-xs">
            ✨ ปัจจุบัน
          </div>
        </div>

        {/* Dashboard Sub-Actions (Summary & History shortcuts) */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-sky-100/90 relative z-10">
          <button
            onClick={onNavigateToSummary}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/80 shadow-sm active:scale-95 transition-all group min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-600 shrink-0">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-navy-text truncate">สรุปยอดเงิน</p>
                <p className="text-[10px] text-navy-muted truncate">ภาพรวมเงินคู่</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-navy-muted group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
          </button>

          <button
            onClick={onNavigateToHistory}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/90 hover:bg-sky-100/90 border border-sky-200/80 shadow-sm active:scale-95 transition-all group min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-400/20 flex items-center justify-center text-sky-600 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-navy-text truncate">ดูย้อนหลัง</p>
                <p className="text-[10px] text-navy-muted truncate">ตรวจประวัติ</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-navy-muted group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* SECTION 3: QUICK FUNCTION BUTTONS GRID */}
      <div className="space-y-3">
        {/* Top 3 Cards Grid (Equal Heights, No Overlapping Badges) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Record Couple Finance */}
          <button
            onClick={onOpenRecord}
            className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-cute hover:shadow-cute-lg border border-white/80 active:scale-95 transition-all relative flex flex-col justify-end p-2 bg-gradient-to-b from-amber-100 to-amber-200 group"
          >
            <img
              src="/assets/card-record.png"
              alt="บันทึกเงินคู่"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>

          {/* 2. Wallet */}
          <button
            onClick={onOpenWallet}
            className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-cute hover:shadow-cute-lg border border-white/80 active:scale-95 transition-all relative flex flex-col justify-end p-2 bg-gradient-to-b from-sky-100 to-sky-200 group"
          >
            <img
              src="/assets/card-wallet.png"
              alt="กระเป๋าเงิน"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>

          {/* 3. Health Tracker */}
          <button
            onClick={onOpenHealth}
            className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-cute hover:shadow-cute-lg border border-white/80 active:scale-95 transition-all relative flex flex-col justify-end p-2 bg-gradient-to-b from-pink-100 to-pink-200 group"
          >
            <img
              src="/assets/card-health.png"
              alt="บันทึกสุขภาพ"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>
        </div>

        {/* Middle 2 Pill Buttons (Scan Slip & Voice Notes) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Scan Slip */}
          <button
            onClick={onOpenOCR}
            className="w-full h-20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-cute hover:shadow-cute-lg border border-white/80 active:scale-95 transition-all relative bg-gradient-to-r from-emerald-100 to-teal-100 group"
          >
            <img
              src="/assets/btn-ocr.png"
              alt="สแกนสลิปอัตโนมัติ"
              className="w-full h-full object-contain group-hover:scale-102 transition-transform"
            />
          </button>

          {/* Voice Notes */}
          <button
            onClick={onOpenVoice}
            className="w-full h-20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-cute hover:shadow-cute-lg border border-white/80 active:scale-95 transition-all relative bg-gradient-to-r from-purple-100 to-indigo-100 group"
          >
            <img
              src="/assets/btn-voice.png"
              alt="จดด้วยเสียง"
              className="w-full h-full object-contain group-hover:scale-102 transition-transform"
            />
          </button>
        </div>

        {/* Dedicated Clean Budget Action Bar (Never Overlaps) */}
        <button
          onClick={onOpenBudget}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-100/90 via-orange-50/90 to-amber-50/90 border border-amber-200/80 shadow-sm flex items-center justify-between hover:shadow-cute active:scale-98 transition-all group"
          title="ตั้งงบประมาณรายเดือน"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg shrink-0">🎯</span>
            <div className="text-left min-w-0">
              <span className="text-xs font-extrabold text-navy-text block truncate">ตั้งงบประมาณรายเดือน</span>
              <span className="text-[10px] text-navy-muted block truncate">วางแผนและควบคุมการใช้จ่ายเงินคู่</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform ml-2">
            <span>จัดการงบ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* SECTION 4: RECENT TRANSACTIONS */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📑</span>
            <h3 className="font-extrabold text-sm text-navy-text">รายการรายรับ–รายจ่ายเงินคู่</h3>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 active:scale-95 transition-all"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-sky-100/80 flex items-center justify-center text-2xl mb-2 animate-bounce">
              🌱
            </div>
            <p className="text-xs font-bold text-navy-text">ยังไม่มีรายการในช่วงเวลานี้</p>
            <p className="text-[11px] text-navy-muted mt-0.5">กดปุ่ม "บันทึกเงินคู่" หรือพูดบันทึกได้เลยค่ะ</p>
            <button
              onClick={onOpenRecord}
              className="mt-3 px-4 py-1.5 rounded-full bg-sky-400 hover:bg-sky-500 text-white font-bold text-xs shadow-cute active:scale-95 transition-all"
            >
              + เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <div className="divide-y divide-sky-100/60">
            {filteredTransactions.slice(0, 5).map((tx) => {
              const { day, month } = formatThaiDate(tx.transaction_date);
              const isIncome = tx.transaction_type === 'income';

              return (
                <div
                  key={tx.transaction_id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-sky-50/50 rounded-2xl px-2 -mx-2 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Date Badge */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/60 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-black text-navy-text leading-none">{day}</span>
                      <span className="text-[9px] font-semibold text-navy-muted leading-tight">{month}</span>
                    </div>

                    {/* Category Icon */}
                    <div className="w-9 h-9 rounded-full bg-sky-100/70 border border-white flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.category)}
                    </div>

                    {/* Details */}
                    <div className="truncate max-w-[130px] sm:max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncome ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                        <p className="text-xs font-bold text-navy-text truncate">
                          {tx.category}
                        </p>
                      </div>
                      <p className="text-[10px] text-navy-muted truncate mt-0.5">
                        {tx.description || tx.account_id}
                        {tx.user_name && ` (${tx.user_name})`}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {tx.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-navy-muted">บาท</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
