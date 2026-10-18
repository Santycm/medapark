import { Navigate, Outlet } from 'react-router';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { homeFor } from './stageRoutes';

const RedirectIfAuthenticated = () => {
  const { stage } = useAuth();

  if (stage === 'cargando') return <Loader />;
  if (stage !== 'anonimo') return <Navigate to={homeFor(stage)} replace />;
  return <Outlet />;
};

export default RedirectIfAuthenticated;
