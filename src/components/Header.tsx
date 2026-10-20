import React from 'react';
import { Palette, Heart } from 'lucide-react';

interface HeaderProps {
  onOpenThemeModal: () => void;
  currentUser: string;
  onToggleUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenThemeModal, currentUser, onToggleUser }) => {
  return (
    <header className="relative pt-3 pb-2 px-4 flex items-center justify-between select-none">
      {/* App Title & Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(18,53,107,0.45)]">
            มรึงจด
          </h1>
          {/* Active Couple User Switcher Chip */}
          <button
            onClick={onToggleUser}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-navy-text border border-white/80 shadow-sm active:scale-95 transition-all"
            title="กดเพื่อสลับผู้ใช้งานระหว่าง โจ กับ ตาล"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentUser === 'โจ' ? '👦 โจ' : '👧 ตาล'}</span>
            <span className="text-[10px] text-navy-muted">(สลับ)</span>
          </button>
        </div>
        <p className="text-xs font-medium text-white/95 drop-shadow-[0_1px_2px_rgba(18,53,107,0.35)] flex items-center gap-1 mt-0.5">
          <span>ผู้ช่วยดูแลการเงินคู่ และสุขภาพของคุณ</span>
          <Heart className="w-3.5 h-3.5 text-pink-300 fill-pink-300 inline animate-bounce" />
        </p>
      </div>

      {/* Right side: Couple mascot illustration & Theme button */}
      <div className="flex items-center gap-2">
        {/* Cute Couple Avatar */}
        <div 
          onClick={onToggleUser}
          className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-cute border-2 border-white/80 cursor-pointer active:scale-95 transition-transform bg-white/40"
          title="คู่รัก: โจ & ตาล"
        >
          <img 
            src="/assets/couple-avatar.png" 
            alt="Jo & Tanz" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Theme Button */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-btn-yellow/95 hover:bg-yellow-200 text-navy-text font-bold text-xs shadow-cute border border-amber-200/80 active:scale-95 transition-all duration-200"
        >
          <Palette className="w-3.5 h-3.5 text-amber-600" />
          <span>ธีม</span>
        </button>
      </div>
    </header>
  );
};
