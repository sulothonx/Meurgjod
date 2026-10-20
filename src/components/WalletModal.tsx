import React, { useState } from 'react';
import { X, Eye, EyeOff, RefreshCw, ShieldCheck, Lock, Building2, AlertCircle } from 'lucide-react';
import { Account } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateBalance,
}) => {
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!isOpen) return null;

  const totalBalance = accounts.reduce((sum, a) => sum + a.display_balance, 0);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const handleSaveEdit = (accountId: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateBalance(accountId, val);
    }
    setEditingAccountId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-text/45 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-4xl sm:rounded-3xl p-5 shadow-cute-lg border border-white/80 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👛</span>
            <div>
              <h2 className="text-lg font-bold text-navy-text">กระเป๋าเงิน & บัญชีเชื่อมต่อ</h2>
              <p className="text-xs text-navy-muted">ดูยอดเงินรวมแบบปลอดภัย (Read-Only)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="mt-4 p-4.5 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-cute relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white/90">ยอดรวมทุกบัญชีที่บันทึกไว้</span>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              title={hideBalance ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            {hideBalance
              ? '••••••••'
              : `${totalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`}
          </h3>

          <div className="mt-3 flex items-center justify-between text-[11px] text-white/80 pt-2 border-t border-white/20">
            <span>อัปเดตล่าสุด: เมื่อสักครู่</span>
            <button
              onClick={handleSync}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>ซิงก์ข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Security / Read-Only Warning Notice */}
        <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <b>ระบบ Read-Only ปลอดภัย 100%:</b> แอปพลิเคชันมีไว้เพื่อตรวจสอบยอดรวมเท่านั้น 
            <b> ไม่สามารถทำธุรกรรม โอนเงิน ถอนเงิน หรือชำระเงินใดๆ ได้</b> ข้อมูลยอดเงินที่ไม่ได้เชื่อมต่อ API ธนาคารจะแสดงเป็น "ยอดเงินที่บันทึกเอง"
          </p>
        </div>

        {/* Accounts List */}
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-bold text-navy-text">รายการบัญชี ({accounts.length})</h4>
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100/80 flex items-center justify-center text-sky-700 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-navy-text">{acc.account_name}</h5>
                  <p className="text-[10px] text-navy-muted">
                    {acc.bank_name || 'บัญชีเงินสด'} • {acc.account_number_masked || 'บันทึกเอง'}
                  </p>
                  <span className="inline-block mt-0.5 text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {acc.balance_source === 'manual' ? '📝 ยอดเงินที่บันทึกเอง' : '🔗 API ได้รับอนุญาต'}
                  </span>
                </div>
              </div>

              {/* Balance & Edit */}
              <div className="text-right">
                {editingAccountId === acc.account_id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 text-xs font-bold p-1 rounded border border-sky-400 text-right"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(acc.account_id)}
                      className="px-2 py-1 rounded bg-sky-500 text-white text-[10px] font-bold"
                    >
                      บันทึก
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-navy-text">
                      {hideBalance
                        ? '••••••'
                        : `${acc.display_balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ.`}
                    </p>
                    {acc.balance_source === 'manual' && (
                      <button
                        onClick={() => {
                          setEditingAccountId(acc.account_id);
                          setEditValue(acc.display_balance.toString());
                        }}
                        className="text-[10px] text-sky-600 hover:underline font-bold mt-0.5"
                      >
                        แก้ไขยอด
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
