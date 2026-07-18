import { ALL_TABS } from "../tabsConfig.js";
import { NavIcon } from "./NavIcon.jsx";
import { Logo } from "./Logo.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { SettingsPanel } from "./SettingsPanel.jsx";

export function MobileNav({ activeTab, onSelect }) {
  return (
    <div className="lg:hidden sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => onSelect("home")} className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-[13px] font-semibold text-ink">Context Toolkit</span>
        </button>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          <SettingsPanel compact />
        </div>
      </div>
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {ALL_TABS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                isActive ? "bg-gauge/12 text-gauge" : "text-mute hover:text-ink"
              }`}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
