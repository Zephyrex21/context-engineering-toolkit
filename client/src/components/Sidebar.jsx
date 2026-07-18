import { NAV_GROUPS, HOME_ITEM } from "../tabsConfig.js";
import { NavIcon } from "./NavIcon.jsx";
import { Logo } from "./Logo.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { SettingsPanel } from "./SettingsPanel.jsx";

export function Sidebar({ activeTab, onSelect }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0 border-r border-line bg-surface/70 backdrop-blur-xl">
      <div className="px-5 pt-6 pb-5">
        <button
          onClick={() => onSelect("home")}
          className="flex items-center gap-2.5 text-left"
        >
          <Logo size={28} className="shrink-0" />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink">Context Toolkit</div>
            <div className="text-[11px] text-mute">Context engineering</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-5">
        <button
          onClick={() => onSelect(HOME_ITEM.id)}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeTab === HOME_ITEM.id
              ? "bg-gauge/12 text-gauge"
              : "text-ink/75 hover:bg-line/50 hover:text-ink"
          }`}
        >
          <NavIcon type={HOME_ITEM.icon} />
          {HOME_ITEM.label}
        </button>

        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-mute uppercase">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-gauge/12 text-gauge"
                        : "text-ink/75 hover:bg-line/50 hover:text-ink"
                    }`}
                  >
                    <NavIcon type={item.icon} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-line flex flex-col gap-2">
        <ThemeToggle />
        <SettingsPanel />
      </div>
    </aside>
  );
}
