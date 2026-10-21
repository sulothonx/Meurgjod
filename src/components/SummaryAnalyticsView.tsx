import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart as BarIcon, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Transaction, Budget, AccountFilterType, isCoupleTransaction } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface SummaryAnalyticsViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  onBackToHome: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

type PeriodFilter = 'today' | '7days' | 'this-month' | 'last-month' | '3months' | '6months' | 'this-year' | 'all';

export const SummaryAnalyticsView: React.FC<SummaryAnalyticsViewProps> = ({
  transactions,
  budgets,
  onBackToHome,
  onSelectTransaction,
}) => {
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>('couple');
  const [period, setPeriod] = useState<PeriodFilter>('this-month');
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'bar' | 'line'>('donut');

  // Filter transactions by account and period
  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      // Account filter
      if (accountFilter === 'couple' && !isCoupleTransaction(t)) return false;
      if (accountFilter === 'personal' && isCoupleTransaction(t)) return false;

      // Period filter
      if (period === 'all') return true;
      const tDate = new Date(t.transaction_date);

      if (period === 'today') {
        return tDate.toDateString() === now.toDateString();
      }
      if (period === '7days') {
        const diff = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (period === 'this-month') {
        return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
      }
      if (period === 'last-month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return tDate.getFullYear() === year && tDate.getMonth() === lastMonth;
      }
      if (period === '3months') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 90;
      }
      if (period === '6months') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 180;
      }
      if (period === 'this-year') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate totals
  const totalIncome = useMemo(() => {
    return filtered
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return filtered
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filtered]);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown for Donut Chart
  const categoryBreakdown = useMemo(() => {
    const expenses = filtered.filter((t) => t.transaction_type === 'expense');
    const map: { [key: string]: number } = {};
    for (const t of expenses) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    const sorted = Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [filtered]);

  // Donut Chart Data
  const donutData = {
    labels: categoryBreakdown.slice(0, 7).map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.slice(0, 7).map((c) => c.amount),
        backgroundColor: [
          '#FF6475',
          '#FBBF24',
          '#38BDF8',
          '#A78BFA',
          '#34D399',
          '#F472B6',
          '#94A3B8',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Bar Chart Data (Income vs Expense)
  const barData = {
    labels: ['ภาพรวมช่วงเวลานี้'],
    datasets: [
      {
        label: 'รายรับ (Income)',
        data: [totalIncome],
        backgroundColor: '#10B981',
        borderRadius: 12,
      },
      {
        label: 'รายจ่าย (Expense)',
        data: [totalExpense],
        backgroundColor: '#FF6475',
        borderRadius: 12,
      },
    ],
  };

  // Line Chart Data (Trend of Balance over sorted transactions)
  const lineData = useMemo(() => {
    const sortedChronological = [...filtered].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    let running = 0;
    const labels: string[] = [];
    const balances: number[] = [];

    sortedChronological.forEach((t) => {
      running += t.transaction_type === 'income' ? t.amount : -t.amount;
      const d = new Date(t.transaction_date);
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      balances.push(running);
    });

    return {
      labels: labels.slice(-15),
      datasets: [
        {
          label: 'ยอดเงินคงเหลือสะสม (บาท)',
          data: balances.slice(-15),
          borderColor: '#0284C7',
          backgroundColor: 'rgba(125, 211, 252, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#0284C7',
        },
      ],
    };
  }, [filtered]);

  // Export CSV
  const exportToCSV = () => {
    const headers = ['ID', 'วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'ผู้บันทึก', 'บัญชี', 'จำนวนเงิน (บาท)'];
    const rows = filtered.map((t) => [
      t.transaction_id,
      t.transaction_date,
      t.transaction_type === 'income' ? 'รายรับ' : 'รายจ่าย',
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.user_name || 'โจ',
      t.account_id,
      t.amount.toString(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `จดให้ไว_รายงาน_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 px-4 pb-28">
      {/* Title & Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-navy-text flex items-center gap-2">
              <span>📊 สรุปยอดเงินและแนวโน้ม</span>
            </h2>
            <p className="text-xs text-navy-muted">วิเคราะห์สัดส่วนรายรับ-รายจ่ายเงินคู่</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-cute active:scale-95 transition-all"
            title="ดาวน์โหลดไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Account Filter Pills: เงินคู่ (Default) | ส่วนตัว | รวมทั้งหมด */}
        <div className="flex items-center gap-1.5 p-1 bg-white/75 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-xs mb-3">
          <button
            type="button"
            onClick={() => setAccountFilter('couple')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'couple'
                ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xs scale-[1.01]'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>💕 เงินคู่</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountFilter('personal')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'personal'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xs scale-[1.01]'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>👤 ส่วนตัว</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountFilter('all')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs scale-[1.01]'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>🌐 รวมทั้งหมด</span>
          </button>
        </div>

        {/* Time Period Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'today', label: 'วันนี้' },
            { key: '7days', label: '7 วัน' },
            { key: 'this-month', label: 'เดือนนี้' },
            { key: 'last-month', label: 'เดือนก่อน' },
            { key: '3months', label: '3 เดือน' },
            { key: '6months', label: '6 เดือน' },
            { key: 'this-year', label: 'ปีนี้' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodFilter)}
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                period === item.key
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-sky-50 text-slate-700 hover:bg-sky-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white border border-sky-100 shadow-sm text-center">
          <span className="text-[10px] font-semibold text-navy-muted">เงินคงเหลือ</span>
          <p className="text-sm sm:text-base font-black text-navy-text truncate">
            {netBalance.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[9px] text-navy-muted">บาท</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-emerald-800">รายรับรวม</span>
          <p className="text-sm sm:text-base font-extrabold text-emerald-600 truncate">
            +{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[9px] text-emerald-700">บาท</span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-rose-800">รายจ่ายรวม</span>
          <p className="text-sm sm:text-base font-extrabold text-rose-600 truncate">
            -{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[9px] text-rose-700">บาท</span>
        </div>
      </div>

      {/* Chart Section with Tabs */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80">
        {/* Chart Sub Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <span className="text-xs font-bold text-navy-text">กราฟแสดงผล</span>
          <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-xl">
            <button
              onClick={() => setActiveChartTab('donut')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'donut' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="สัดส่วนรายจ่าย"
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveChartTab('bar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'bar' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="เปรียบเทียบรายรับ-จ่าย"
            >
              <BarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveChartTab('line')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'line' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="แนวโน้มเงินสะสม"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chart Render */}
        <div className="py-4 flex items-center justify-center min-h-[220px]">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400">ไม่มีข้อมูลในช่วงเวลานี้</p>
          ) : activeChartTab === 'donut' ? (
            categoryBreakdown.length > 0 ? (
              <div className="w-56 h-56">
                <Doughnut
                  data={donutData}
                  options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400">ยังไม่มีรายการรายจ่ายในช่วงเวลานี้</p>
            )
          ) : activeChartTab === 'bar' ? (
            <div className="w-full h-56">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          ) : (
            <div className="w-full h-56">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Spending Categories List */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80">
        <h3 className="text-xs font-bold text-navy-text mb-3">
          🏆 หมวดหมู่ที่ใช้จ่ายสูงสุด ({categoryBreakdown.length} หมวด)
        </h3>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">ไม่มีข้อมูลรายจ่าย</p>
        ) : (
          <div className="space-y-2">
            {categoryBreakdown.slice(0, 6).map((cat, idx) => {
              const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-navy-text">
                      <span className="text-slate-400 font-bold mr-1.5">{idx + 1}.</span>
                      {cat.name}
                    </span>
                    <span className="font-extrabold text-rose-600">
                      {cat.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ. ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
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
