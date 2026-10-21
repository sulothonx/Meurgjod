import React, { useState } from 'react';
import { X, Camera, Upload, Check, AlertCircle, Scan, ArrowRight } from 'lucide-react';
import { OCRService, OCRSlipResult } from '../services/ocrService';
import { Transaction, Category, Account } from '../types';
import confetti from 'canvas-confetti';

interface SlipScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  existingTransactions: Transaction[];
  currentUser: string;
  onConfirmTransaction: (tx: Partial<Transaction>) => Promise<void>;
}

export const SlipScannerModal: React.FC<SlipScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  existingTransactions,
  currentUser,
  onConfirmTransaction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<OCRSlipResult | null>(null);

  // Editable fields after scan
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('อาหารและเครื่องดื่ม');
  const [accountId, setAccountId] = useState<string>('เงินคู่รายเดือน');
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read image for preview
    const reader = new FileReader();
    reader.onload = async () => {
      setSelectedImage(reader.result as string);
      setIsScanning(true);
      setScanResult(null);

      try {
        const result = await OCRService.scanSlip(file);
        setScanResult(result);

        // Populate form
        const amtStr = result.detectedAmount ? result.detectedAmount.toString() : '';
        setAmount(amtStr);
        setDate(result.detectedDate || new Date().toISOString().split('T')[0]);
        setDescription(result.detectedDescription || 'สแกนสลิปโอนเงิน');
        setCategory(result.detectedCategory || 'อาหารและเครื่องดื่ม');

        // Check for duplicate transaction
        if (result.detectedAmount) {
          const match = existingTransactions.find(
            (t) =>
              t.amount === result.detectedAmount &&
              (t.transaction_date.startsWith(result.detectedDate || '') ||
                t.description === result.detectedDescription)
          );
          setIsDuplicate(!!match);
        }
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmTransaction({
        transaction_type: 'expense',
        amount: numAmount,
        category: category,
        description: description,
        account_id: accountId,
        user_name: currentUser,
        user_id: currentUser === 'ตาล' ? 'user-tanz' : 'user-jo',
        couple_id: 'couple-1',
        transaction_date: `${date}T${new Date().toTimeString().slice(0, 5)}:00`,
        receipt_image: selectedImage || undefined,
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
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
            <span className="text-2xl">📸</span>
            <div>
              <h2 className="text-lg font-bold text-navy-text">สแกนสลิปโอนเงินอัตโนมัติ</h2>
              <p className="text-xs text-navy-muted">อ่านยอดเงิน วันที่ และสร้างรายการเตรียมบันทึก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload / Camera Section */}
        {!selectedImage ? (
          <div className="mt-5 p-8 border-2 border-dashed border-sky-300 rounded-3xl bg-sky-50/50 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
              <Scan className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-navy-text mb-1">
              เลือกรูปภาพสลิป หรือ ถ่ายรูปสลิป
            </h3>
            <p className="text-xs text-navy-muted max-w-xs mb-4">
              รองรับสลิปธนาคารทุกแห่ง เช่น KBank, SCB, PromptPay, TrueMoney
            </p>

            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-cute cursor-pointer active:scale-95 transition-all">
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องถ่ายรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-xs shadow-cute cursor-pointer active:scale-95 transition-all">
                <Upload className="w-4 h-4" />
                <span>เลือกรูปจากเครื่อง</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Image Preview & Scanning Effect */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-sky-200 bg-slate-900 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Slip Preview"
                className="w-full h-full object-contain"
              />

              {isScanning && (
                <div className="absolute inset-0 bg-sky-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-glow-primary animate-pulse absolute top-1/2 -translate-y-1/2" />
                  <span className="bg-navy-text/80 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    🔍 AI กำลังอ่านสลิป...
                  </span>
                </div>
              )}

              {/* Reset image button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setScanResult(null);
                }}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold hover:bg-black/80 transition-all"
              >
                เปลี่ยนรูป
              </button>
            </div>

            {/* Duplicate warning */}
            {isDuplicate && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <b>ตรวจพบรายการที่คล้ายกัน:</b> มีรายการยอด {amount} บาท ในวันที่ {date} อยู่แล้ว กรุณาตรวจสอบว่าซ้ำซ้อนหรือไม่
                </span>
              </div>
            )}

            {/* Editable Review Form */}
            {scanResult && !isScanning && (
              <div className="p-4 rounded-3xl bg-sky-50/70 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-text">
                    ✅ ตรวจสอบและแก้ไขข้อมูลก่อนบันทึก
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ความมั่นใจ {(scanResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-navy-text mb-1">
                      จำนวนเงิน (บาท) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full text-base font-black p-2.5 rounded-xl bg-white border border-sky-300 text-navy-text"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy-text mb-1">
                      วันที่ตามสลิป
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-navy-text mb-1">
                      หมวดหมู่
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200"
                    >
                      {categories
                        .filter((c) => c.transaction_type === 'expense')
                        .map((c) => (
                          <option key={c.category_id} value={c.category_name}>
                            {c.category_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy-text mb-1">
                      บัญชีคู่ที่จ่าย
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200"
                    >
                      <option value="เงินคู่รายเดือน">เงินคู่รายเดือน</option>
                      <option value="บัญชีส่วนตัว (โจ)">บัญชีส่วนตัว (โจ)</option>
                      <option value="บัญชีส่วนตัว (ตาล)">บัญชีส่วนตัว (ตาล)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy-text mb-1">
                    รายละเอียดรายการ
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200"
                  />
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting || !amount}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-cute flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังบันทึกลงระบบ...' : 'ยืนยันบันทึกธุรกรรมนี้'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
