import React from 'react';
import { Home, BarChart2, Plus, Heart, Settings } from 'lucide-react';

export type TabType = 'home' | 'summary' | 'health' | 'settings';

interface BottomNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenRecord: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenRecord,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-4 pt-1 pointer-events-none">
      <nav className="glass-panel rounded-full px-3 py-2 shadow-cute-lg border border-white/80 flex items-center justify-between pointer-events-auto bg-white/95">
        {/* 1. Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all ${
            currentTab === 'home'
              ? 'text-sky-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'home' ? 'bg-sky-100 text-sky-600' : ''
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">หน้าแรก</span>
        </button>

        {/* 2. Summary */}
        <button
          onClick={() => onSelectTab('summary')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all ${
            currentTab === 'summary'
              ? 'text-sky-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'summary' ? 'bg-sky-100 text-sky-600' : ''
            }`}
          >
            <BarChart2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">สรุป</span>
        </button>

        {/* 3. CENTER ELEVATED RECORD BUTTON (+) */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenRecord}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600 text-white flex items-center justify-center shadow-cute-lg hover:shadow-glow-primary border-4 border-white active:scale-95 transition-all group"
            title="บันทึกรายการเงินคู่"
          >
            <Plus className="w-7 h-7 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          </button>
          <span className="text-[10px] font-bold text-navy-text mt-0.5">บันทึก</span>
        </div>

        {/* 4. Health */}
        <button
          onClick={() => onSelectTab('health')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all ${
            currentTab === 'health'
              ? 'text-pink-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'health' ? 'bg-pink-100 text-pink-600' : ''
            }`}
          >
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">สุขภาพ</span>
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all ${
            currentTab === 'settings'
              ? 'text-sky-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'settings' ? 'bg-sky-100 text-sky-600' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">ตั้งค่า</span>
        </button>
      </nav>
    </div>
  );
};
