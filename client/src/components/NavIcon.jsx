const STROKE = "currentColor";

function Home() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <path d="M4 11.5L12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1v-9" strokeLinejoin="round" />
    </svg>
  );
}

function Pipeline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12h1.5M13.5 7.2L17.3 10.5M13.5 16.8L17.3 13.5M12 8v8" strokeLinecap="round" />
    </svg>
  );
}

function Dashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <rect x="4" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function Tokens() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <path d="M8 4h8M8 20h8M9 4l-4 8 4 8M15 4l4 8-4 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Scissors() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5L20 19M8 16.5L20 5" strokeLinecap="round" />
    </svg>
  );
}

function Funnel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <path d="M4 4h16l-6 8v7l-4 2v-9L4 4z" strokeLinejoin="round" />
    </svg>
  );
}

function Gear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Gauge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-[18px] h-[18px]">
      <path d="M4 16a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M12 16L16 9" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.3" fill={STROKE} stroke="none" />
    </svg>
  );
}

const ICONS = {
  home: Home,
  pipeline: Pipeline,
  dashboard: Dashboard,
  tokens: Tokens,
  context: Scissors,
  compress: Funnel,
  summarize: Gear,
  evaluate: Gauge,
};

export function NavIcon({ type }) {
  const Icon = ICONS[type];
  return Icon ? <Icon /> : null;
}
