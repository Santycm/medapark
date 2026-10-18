import { Navigate, Outlet } from 'react-router';
import Loader from '../../components/common/Loader';
import { useMyParking } from '../../hooks/useMyParking';
import ParkingLoadError from './ParkingLoadError';

/** Solo permite el registro si el administrador todavía no tiene parqueadero. */
const RequireNoParking = () => {
  const my = useMyParking();

  if (my.state === 'cargando') return <Loader fullScreen={false} />;
  if (my.state === 'error') return <ParkingLoadError message={my.message} onRetry={my.reload} />;
  if (my.state === 'con_parqueadero') return <Navigate to="/admin" replace />;
  return <Outlet />;
};

export default RequireNoParking;
