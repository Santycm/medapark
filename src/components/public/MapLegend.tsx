import { MSG } from '../../lib/messages';

/** Leyenda del mapa: verde con celdas disponibles, gris sin celdas. */
const MapLegend = () => (
  <ul className="pointer-events-none absolute bottom-3 left-3 z-500 space-y-2 rounded-[10px] bg-white px-3.5 py-3 text-sm text-ink-500 shadow-md">
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-brand-600" />
      {MSG.publico.leyendaDisponible}
    </li>
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-ink-500/70" />
      {MSG.publico.leyendaLleno}
    </li>
  </ul>
);

export default MapLegend;
