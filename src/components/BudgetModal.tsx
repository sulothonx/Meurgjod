import React, { useState } from 'react';
import { X, Target, Plus, AlertTriangle, CheckCircle2, ChevronRight, Edit2 } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categories,
  transactions,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [budgetAmount, setBudgetAmount] = useState<string>('5000');
  const [alertPercentage, setAlertPercentage] = useState<number>(80);

  if (!isOpen) return null;

  // Calculate current month's expenses for each budget
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = transactions.filter((t) =>
    t.transaction_type === 'expense' && t.transaction_date.startsWith(currentMonthStr)
  );

  const budgetStatuses = budgets.map((b) => {
    let spent = 0;
    if (b.category_id === 'all') {
      spent = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    } else {
      spent = currentMonthExpenses
        .filter((t) => t.category === b.category_name)
        .reduce((sum, t) => sum + t.amount, 0);
    }
    const percent = b.budget_amount > 0 ? Math.round((spent / b.budget_amount) * 100) : 0;
    const remaining = b.budget_amount - spent;
    return {
      ...b,
      spent,
      remaining,
      percent,
    };
  });

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    let catName = 'งบประมาณรวมรายเดือน';
    if (selectedCategory !== 'all') {
      const found = categories.find((c) => c.category_id === selectedCategory);
      if (found) catName = found.category_name;
    }

    const newBudget: Budget = {
      budget_id: `b-${Date.now()}`,
      couple_id: 'couple-1',
      category_id: selectedCategory,
      category_name: catName,
      budget_amount: amount,
      start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      end_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`,
      alert_percentage: alertPercentage,
    };

    onSaveBudget(newBudget);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-text/45 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-4xl sm:rounded-3xl p-5 shadow-cute-lg border border-white/80 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-lg font-bold text-navy-text">ระบบตั้งงบประมาณเงินคู่</h2>
              <p className="text-xs text-navy-muted">ควบคุมรายจ่ายและเตือนเมื่อใกล้ถึงวงเงิน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Budget Toggle Button */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mt-4 py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ ตั้งงบประมาณใหม่</span>
          </button>
        ) : (
          <form onSubmit={handleAddBudget} className="mt-4 p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-navy-text flex items-center gap-1.5">
                <Target className="w-4 h-4 text-sky-600" />
                <span>เพิ่มเป้าหมายงบประมาณ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-navy-text mb-1">
                  เลือกหมวดหมู่
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 font-semibold"
                >
                  <option value="all">🎯 รวมทุกหมวดหมู่</option>
                  {categories
                    .filter((c) => c.transaction_type === 'expense')
                    .map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-navy-text mb-1">
                  วงเงินงบประมาณ (บาท)
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 font-bold text-navy-text"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-navy-text mb-1">
                แจ้งเตือนเมื่อใช้ถึง: {alertPercentage}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={alertPercentage}
                onChange={(e) => setAlertPercentage(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-cute active:scale-98 transition-all"
            >
              บันทึกงบประมาณ
            </button>
          </form>
        )}

        {/* Budget Cards List */}
        <div className="mt-4 space-y-3">
          {budgetStatuses.map((b) => {
            const isNear = b.percent >= b.alert_percentage && b.percent < 100;
            const isOver = b.percent >= 100;

            let progressBg = 'bg-emerald-500';
            if (isOver) progressBg = 'bg-rose-500';
            else if (isNear) progressBg = 'bg-amber-500';

            return (
              <div
                key={b.budget_id}
                className={`p-4 rounded-3xl border transition-all ${
                  isOver
                    ? 'bg-rose-50/70 border-rose-200'
                    : isNear
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sm">
                      {b.category_id === 'all' ? '🎯' : '📦'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-text">{b.category_name}</h4>
                      <p className="text-[10px] text-navy-muted">
                        งบ {b.budget_amount.toLocaleString()} บาท/เดือน
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isOver ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      <AlertTriangle className="w-3 h-3" />
                      <span>เกินงบ!</span>
                    </span>
                  ) : isNear ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      <span>ใกล้เต็ม ({b.percent}%)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ปกติ</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden my-2 shadow-inner">
                  <div
                    className={`h-full ${progressBg} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(b.percent, 100)}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-600">
                    ใช้แล้ว: <b className="text-navy-text">{b.spent.toLocaleString()}</b> บาท
                  </span>
                  <span className={b.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                    {b.remaining >= 0 ? `เหลือ: ${b.remaining.toLocaleString()} บ.` : `เกินงบ: ${Math.abs(b.remaining).toLocaleString()} บ.`} ({b.percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
