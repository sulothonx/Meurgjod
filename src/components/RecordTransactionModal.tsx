import React, { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, TransactionType, Category, Account } from '../types';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  currentUser: string;
  onSave: (tx: Partial<Transaction>) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
  onOpenBudget?: () => void;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  currentUser,
  onSave,
  onDelete,
  editingTransaction,
  initialType = 'expense',
  onOpenBudget,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('เงินคู่รายเดือน');
  const [recordedBy, setRecordedBy] = useState<string>(currentUser);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.transaction_type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.account_id || 'เงินคู่รายเดือน');
      setRecordedBy(editingTransaction.user_name || currentUser);
      
      const d = new Date(editingTransaction.transaction_date);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
      setDescription(editingTransaction.description || '');
      setNote(editingTransaction.note || '');
      setReceiptImage(editingTransaction.receipt_image);
    } else {
      setType(initialType);
      setAmount('');
      setCategory('');
      setAccountId('เงินคู่รายเดือน');
      setRecordedBy(currentUser);
      
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setDescription('');
      setNote('');
      setReceiptImage(undefined);
    }
    setErrorMsg(null);
  }, [editingTransaction, initialType, isOpen, currentUser]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.transaction_type === type);

  // Quick Amount helper
  const addQuickAmount = (val: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + val).toString());
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!category) {
      setErrorMsg('กรุณาเลือกหมวดหมู่');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fullDate = `${date}T${time}:00`;
      await onSave({
        transaction_id: editingTransaction ? editingTransaction.transaction_id : undefined,
        transaction_type: type,
        amount: numAmount,
        category: category,
        account_id: accountId,
        user_name: recordedBy,
        user_id: recordedBy === 'ตาล' ? 'user-tanz' : 'user-jo',
        couple_id: 'couple-1',
        transaction_date: fullDate,
        description: description || category,
        note: note,
        receipt_image: receiptImage
      });

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-text/45 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-4xl sm:rounded-3xl p-5 shadow-cute-lg border border-white/80 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h2 className="text-lg font-bold text-navy-text">
              {editingTransaction ? 'แก้ไขรายการเงินคู่' : 'บันทึกรายการเงินคู่'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBudget && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBudget();
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold border border-amber-300 shadow-sm active:scale-95 transition-all"
                title="ตั้งงบประมาณ"
              >
                <span>🎯</span>
                <span>ตั้งงบ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: รายจ่าย vs รายรับ */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-sky-50 border border-sky-100">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-cute'
                  : 'text-navy-muted hover:text-navy-text'
              }`}
            >
              💸 รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-cute'
                  : 'text-navy-muted hover:text-navy-text'
              }`}
            >
              💰 รายรับ (Income)
            </button>
          </div>

          {/* Amount Input & Quick Buttons */}
          <div>
            <label className="block text-xs font-bold text-navy-text mb-1">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-2xl font-black text-navy-text pl-4 pr-12 py-3 rounded-2xl bg-sky-50/50 border-2 border-sky-200 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-300"
                required
                autoFocus={!editingTransaction}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-navy-muted">
                บาท
              </span>
            </div>

            {/* Quick amount additions */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {[50, 100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-100 text-[11px] font-bold text-navy-text border border-slate-200 active:scale-95 transition-all shrink-0"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-navy-text mb-1.5">
              หมวดหมู่ *
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
              {availableCategories.map((c) => {
                const isSelected = category === c.category_name;
                return (
                  <button
                    key={c.category_id}
                    type="button"
                    onClick={() => setCategory(c.category_name)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-14 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-100/80 font-bold shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base truncate">
                      {c.icon === 'Utensils' ? '🍽️' :
                       c.icon === 'Store' ? '🏪' :
                       c.icon === 'ShoppingCart' ? '🛒' :
                       c.icon === 'Car' ? '🚗' :
                       c.icon === 'Shield' || c.category_name.includes('ประกัน') ? '🛡️' :
                       c.icon === 'Activity' || c.category_name.includes('สุขภาพ') ? '🏃' :
                       c.icon === 'HeartPulse' || c.category_name.includes('ยา') ? '💊' :
                       c.icon === 'Shirt' ? '👕' :
                       c.icon === 'Coffee' ? '☕' :
                       c.icon === 'Zap' ? '⚡' :
                       c.icon === 'Coins' ? '🪙' :
                       c.icon === 'HeartHandshake' ? '🤝' :
                       c.icon === 'Gift' ? '🎁' :
                       '📌'}
                    </span>
                    <span className="text-[10px] leading-tight truncate">{c.category_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-bold text-navy-text mb-1">
              บัญชี / กระเป๋า
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none"
            >
              <option value="เงินคู่รายเดือน">เงินคู่รายเดือน (หลัก)</option>
              <option value="บัญชีส่วนตัว (โจ)">บัญชีส่วนตัว (โจ)</option>
              <option value="บัญชีส่วนตัว (ตาล)">บัญชีส่วนตัว (ตาล)</option>
              <option value="เงินออมคู่">เงินออมคู่เพื่ออนาคต</option>
              <option value="เงินสด">เงินสด</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-text mb-1">
                วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-text mb-1">
                เวลา
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none font-medium"
                required
              />
            </div>
          </div>

          {/* Description & Note */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-bold text-navy-text mb-1">
                ชื่อรายการ / รายละเอียด
              </label>
              <input
                type="text"
                placeholder="เช่น ข้าวหมูกรอบ, ซื้อของเข้าบ้าน CJ, เติมน้ำมัน"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-text mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="โน้ตช่วยจำ เช่น หารสอง, สั่งไลน์แมน"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Attach Slip Image */}
          <div>
            <label className="block text-xs font-bold text-navy-text mb-1">
              แนบภาพสลิป / ใบเสร็จ
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer text-xs font-bold text-navy-text border border-slate-200 active:scale-95 transition-all">
                <ImageIcon className="w-4 h-4 text-sky-500" />
                <span>{receiptImage ? 'เปลี่ยนรูปสลิป' : 'อัปโหลดสลิป'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {receiptImage && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                  <img src={receiptImage} alt="slip" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReceiptImage(undefined)}
                    className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
                    await onDelete(editingTransaction.transaction_id);
                    onClose();
                  }
                }}
                className="p-3 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold active:scale-95 transition-all"
                title="ลบรายการ"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-cute flex items-center justify-center gap-2 active:scale-98 transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
