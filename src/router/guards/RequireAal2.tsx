import { Navigate, Outlet } from 'react-router';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { homeFor } from './stageRoutes';

const RequireAal2 = () => {
  const { stage } = useAuth();

  if (stage === 'cargando') return <Loader />;
  if (stage !== 'autenticado') return <Navigate to={homeFor(stage)} replace />;
  return <Outlet />;
};

export default RequireAal2;
