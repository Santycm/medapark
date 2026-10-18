import { Navigate, Outlet } from 'react-router';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { homeFor } from './stageRoutes';

type Props = { expected: 'requiere_enrolamiento' | 'requiere_verificacion' };

const RequirePendingMfa = ({ expected }: Props) => {
  const { stage } = useAuth();

  if (stage === 'cargando') return <Loader />;
  if (stage !== expected) return <Navigate to={homeFor(stage)} replace />;
  return <Outlet />;
};

export default RequirePendingMfa;
