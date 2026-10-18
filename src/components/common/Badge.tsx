type Props = { active: boolean; activeLabel?: string; inactiveLabel?: string };

/** Estado del parqueadero: punto verde "Activo" o punto gris "Inactivo". */
const Badge = ({ active, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }: Props) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
      active ? 'bg-brand-50 text-brand-700' : 'bg-canvas text-ink-500'
    }`}
  >
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-brand-600' : 'bg-ink-500/60'}`}
    />
    {active ? activeLabel : inactiveLabel}
  </span>
);

export default Badge;
