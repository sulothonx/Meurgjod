import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Check, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { VoiceService, VoiceParsedResult } from '../services/voiceService';
import { Transaction, HealthRecord } from '../types';
import confetti from 'canvas-confetti';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onSaveTransaction: (tx: Partial<Transaction>) => Promise<void>;
  onSaveHealthRecord: (record: HealthRecord) => Promise<void>;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveTransaction,
  onSaveHealthRecord,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<VoiceParsedResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          if (event.results[0].isFinal) {
            const parsed = VoiceService.parseThaiTranscript(currentTranscript);
            setParsedResult(parsed);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMessage('เบราว์เซอร์ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตสิทธิ์ หรือคลิกเลือกตัวอย่างข้อความด้านล่าง');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับ Web Speech API คุณสามารถคลิกตัวอย่างประโยคเพื่อทดสอบได้ค่ะ');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setParsedResult(null);
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSimulateSpeech = (text: string) => {
    setTranscript(text);
    const parsed = VoiceService.parseThaiTranscript(text);
    setParsedResult(parsed);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (!parsedResult) return;
    setIsSubmitting(true);
    try {
      if (parsedResult.intent === 'health') {
        const h = currentUser === 'โจ' ? 175 : 160;
        const w = parsedResult.weight_kg || 70;
        const bmi = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));

        await onSaveHealthRecord({
          health_id: `WT${Date.now()}`,
          user_id: currentUser === 'ตาล' ? 'user-tanz' : 'user-jo',
          user_name: currentUser,
          record_date: parsedResult.date,
          weight_kg: w,
          height_cm: parsedResult.height_cm || h,
          bmi: bmi,
          note: parsedResult.rawTranscript,
          created_at: new Date().toISOString()
        });
      } else {
        await onSaveTransaction({
          transaction_type: parsedResult.type || 'expense',
          amount: parsedResult.amount || 0,
          category: parsedResult.category || 'อาหารและเครื่องดื่ม',
          description: parsedResult.description || parsedResult.rawTranscript,
          account_id: 'เงินคู่รายเดือน',
          user_name: currentUser,
          user_id: currentUser === 'ตาล' ? 'user-tanz' : 'user-jo',
          couple_id: 'couple-1',
          transaction_date: `${parsedResult.date}T${new Date().toTimeString().slice(0, 5)}:00`,
        });
      }

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
            <span className="text-2xl">🎙️</span>
            <div>
              <h2 className="text-lg font-bold text-navy-text">จดด้วยเสียงภาษาไทย</h2>
              <p className="text-xs text-navy-muted">พูดปุ๊บ AI ช่วยแยกฟิลด์และเตรียมบันทึกทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Central Animation */}
        <div className="py-6 flex flex-col items-center justify-center">
          <button
            onClick={toggleListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg scale-110 animate-pulse ring-8 ring-rose-200'
                : 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-cute hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            {isListening && (
              <span className="absolute -bottom-7 text-[11px] font-extrabold text-rose-600 animate-bounce">
                กำลังฟังเสียงคุณอยู่...
              </span>
            )}
          </button>
          {!isListening && (
            <p className="text-xs font-bold text-navy-text mt-4">
              กดที่ไมโครโฟน แล้วพูดประโยคภาษาไทยได้เลยค่ะ
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Transcript Box */}
        {transcript && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 mb-3">
            <span className="text-[10px] font-bold text-purple-700">ข้อความที่ได้ยิน:</span>
            <p className="text-sm font-black text-navy-text mt-0.5">"{transcript}"</p>
          </div>
        )}

        {/* AI Parsed Result & Confirmation */}
        {parsedResult && (
          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI แยกข้อมูลให้เรียบร้อยแล้ว:</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                {parsedResult.intent === 'health' ? '⚖️ ข้อมูลสุขภาพ' : parsedResult.type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-emerald-100 text-xs space-y-1.5">
              {parsedResult.intent === 'health' ? (
                <>
                  <p><b>บันทึกสุขภาพ:</b> คุณ{currentUser}</p>
                  <p><b>น้ำหนัก:</b> <span className="text-sm font-black text-navy-text">{parsedResult.weight_kg} กิโลกรัม</span></p>
                  <p><b>วันที่:</b> {parsedResult.date}</p>
                </>
              ) : (
                <>
                  <p><b>ประเภท:</b> {parsedResult.type === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)'}</p>
                  <p><b>ยอดเงิน:</b> <span className="text-base font-black text-navy-text">{parsedResult.amount?.toLocaleString()} บาท</span></p>
                  <p><b>หมวดหมู่:</b> {parsedResult.category}</p>
                  <p><b>รายละเอียด:</b> {parsedResult.description}</p>
                  <p><b>วันที่:</b> {parsedResult.date}</p>
                </>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={isSubmitting || (parsedResult.intent === 'transaction' && !parsedResult.amount)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-cute flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึกข้อมูลนี้'}</span>
            </button>
          </div>
        )}

        {/* Quick Sample Prompts to click and try */}
        <div className="mt-2">
          <p className="text-[11px] font-bold text-navy-muted mb-1.5 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span>ตัวอย่างคำพูด (คลิกเพื่อทดสอบ):</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'วันนี้ซื้อข้าว 120 บาท',
              'เมื่อวานเติมน้ำมัน 900 บาท',
              'ได้เงินเดือน 25,000 บาท',
              'ซื้อของ 7-11 185 บาท',
              'วันนี้น้ำหนัก 68.5 กิโลกรัม'
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSimulateSpeech(sample)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-100 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all border border-slate-200"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
