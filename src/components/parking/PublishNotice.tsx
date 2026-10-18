import { unpublishedReason, type ParkingLot } from '../../domain/parking';
import { MSG } from '../../lib/messages';
import Alert from '../common/Alert';

const MESSAGES = {
  inactivo: MSG.parqueadero.avisoInactivo,
  sin_tipos: MSG.parqueadero.avisoSinTipos,
  sin_celdas: MSG.parqueadero.avisoSinCeldas,
} as const;

/** Aviso cuando el parqueadero no aparece en el mapa público. No renderiza nada si es publicable. */
const PublishNotice = ({ parking }: { parking: ParkingLot }) => {
  const reason = unpublishedReason(parking);
  if (!reason) return null;
  return <Alert kind="warning">{MESSAGES[reason]}</Alert>;
};

export default PublishNotice;
