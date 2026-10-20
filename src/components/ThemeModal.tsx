import React from 'react';
import { X, Check } from 'lucide-react';
import { ThemeKey } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeKey;
  onSelectTheme: (theme: ThemeKey) => void;
}

interface ThemeOption {
  key: ThemeKey;
  name: string;
  desc: string;
  bgClass: string;
  circleColor: string;
  icon: string;
}

const THEMES: ThemeOption[] = [
  {
    key: 'sky',
    name: 'Sky Day',
    desc: 'ท้องฟ้าสีฟ้าสว่าง เมฆขาวสดใส',
    bgClass: 'from-sky-400 via-sky-200 to-sky-50',
    circleColor: '#7DD3FC',
    icon: '☁️'
  },
  {
    key: 'pink',
    name: 'Pink Love',
    desc: 'ชมพูพาสเทลหวานละมุน เต็มไปด้วยความรัก',
    bgClass: 'from-pink-400 via-pink-200 to-pink-50',
    circleColor: '#F472B6',
    icon: '💖'
  },
  {
    key: 'lavender',
    name: 'Lavender Dream',
    desc: 'ม่วงอ่อนละมุน ฝันหวานเมฆนุ่ม',
    bgClass: 'from-purple-400 via-purple-200 to-purple-50',
    circleColor: '#C084FC',
    icon: '💜'
  },
  {
    key: 'mint',
    name: 'Mint Fresh',
    desc: 'เขียวมิ้นต์สดชื่น สบายตาเป็นธรรมชาติ',
    bgClass: 'from-emerald-400 via-emerald-200 to-emerald-50',
    circleColor: '#34D399',
    icon: '🌿'
  },
  {
    key: 'sunshine',
    name: 'Sunshine',
    desc: 'เหลืองอบอุ่น แดดอ่อนประกายสดใส',
    bgClass: 'from-amber-400 via-amber-200 to-amber-50',
    circleColor: '#FBBF24',
    icon: '☀️'
  },
  {
    key: 'night',
    name: 'Night Sky',
    desc: 'ค่ำคืนกรมท่า ม่วงลุ่มลึกใต้แสงดวงดาว',
    bgClass: 'from-slate-900 via-indigo-950 to-slate-900',
    circleColor: '#818CF8',
    icon: '🌙'
  }
];

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose, currentTheme, onSelectTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-text/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-cute-lg border border-white/80 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="text-lg font-bold text-navy-text">เลือกธีมแอปพลิเคชัน</h2>
              <p className="text-xs text-navy-muted">เปลี่ยนโทนสีสดใสตามสไตล์ที่คุณชอบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => {
                  onSelectTheme(theme.key);
                }}
                className={`p-3.5 rounded-2xl text-left border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/80 shadow-md scale-[1.02]'
                    : 'border-slate-100 hover:border-sky-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{theme.icon}</span>
                    <span className="font-bold text-sm text-navy-text">{theme.name}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight mb-2.5">{theme.desc}</p>

                {/* Color preview bar */}
                <div
                  className={`w-full h-3 rounded-full bg-gradient-to-r ${theme.bgClass} shadow-inner border border-white/50`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-sm shadow-cute active:scale-98 transition-all"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
};
