const STROKE = "currentColor";

function Scissors() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-4 h-4">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5L20 19M8 16.5L20 5" strokeLinecap="round" />
    </svg>
  );
}

function Funnel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 4h16l-6 8v7l-4 2v-9L4 4z" strokeLinejoin="round" />
    </svg>
  );
}

function Gear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-4 h-4">
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
    <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 16a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M12 16L16 9" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.3" fill={STROKE} stroke="none" />
    </svg>
  );
}

const ICONS = { scissors: Scissors, funnel: Funnel, gear: Gear, gauge: Gauge };

export function StageIcon({ type }) {
  const Icon = ICONS[type];
  return Icon ? <Icon /> : null;
}
