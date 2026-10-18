import { Navigate, Outlet } from 'react-router';
import Loader from '../../components/common/Loader';
import { useMyParking } from '../../hooks/useMyParking';
import ParkingLoadError from './ParkingLoadError';

/** Exige que el administrador ya tenga un parqueadero registrado. */
const RequireParking = () => {
  const my = useMyParking();

  if (my.state === 'cargando') return <Loader fullScreen={false} />;
  if (my.state === 'error') return <ParkingLoadError message={my.message} onRetry={my.reload} />;
  if (my.state === 'sin_parqueadero') return <Navigate to="/admin" replace />;
  return <Outlet />;
};

export default RequireParking;
