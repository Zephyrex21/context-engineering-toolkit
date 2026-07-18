export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="ambient-orb absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full opacity-[0.10] dark:opacity-[0.14] blur-[110px]"
        style={{ background: "rgb(var(--color-accent))" }}
      />
      <div
        className="ambient-orb-slow absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full opacity-[0.08] dark:opacity-[0.12] blur-[110px]"
        style={{ background: "rgb(var(--color-safe))" }}
      />
      <div
        className="ambient-orb absolute -bottom-40 left-1/4 w-[420px] h-[420px] rounded-full opacity-[0.06] dark:opacity-[0.10] blur-[110px]"
        style={{ background: "rgb(var(--color-accent))" }}
      />
    </div>
  );
}
