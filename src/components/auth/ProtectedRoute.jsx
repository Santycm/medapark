import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

import {
  getAuthenticatorAssuranceLevel,
  getSession,
} from "../../services/auth";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const session = await getSession();

        if (!session) {
          return;
        }

        const aal = await getAuthenticatorAssuranceLevel();

        const requiresMfa =
          aal.currentLevel === "aal1" && aal.nextLevel === "aal2";

        if (requiresMfa) {
          return;
        }

        setAuthenticated(true);
      } catch (error) {
        console.error("Error verificando autenticación:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
