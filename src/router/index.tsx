import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";

import Loader from "../components/common/Loader";
import AdminLayout from "../components/layout/AdminLayout";
import AuthLayout from "../components/layout/AuthLayout";
import MfaLayout from "../components/layout/MfaLayout";
import PublicLayout from "../components/layout/PublicLayout";
import RedirectIfAuthenticated from "./guards/RedirectIfAuthenticated";
import RequireNoParking from "./guards/RequireNoParking";
import RequireParking from "./guards/RequireParking";
import RequireAal2 from "./guards/RequireAal2";
import RequirePendingMfa from "./guards/RequirePendingMfa";

const Home = lazy(() => import("../pages/public/Home"));
const Login = lazy(() => import("../pages/auth/Login"));
const MfaEnroll = lazy(() => import("../pages/auth/MfaEnroll"));
const VerifyMfa = lazy(() => import("../pages/auth/VerifyMfa"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("../pages/auth/UpdatePassword"));
const SetupMfa = lazy(() => import("../pages/auth/SetupMfa"));
const Profile = lazy(() => import("../pages/app/Profile"));
const Panel = lazy(() => import("../pages/app/Panel"));
const RegisterParking = lazy(() => import("../pages/app/RegisterParking"));
const EditParking = lazy(() => import("../pages/app/EditParking"));
const ConfigureSpaces = lazy(() => import("../pages/app/ConfigureSpaces"));
const ManageOccupancy = lazy(() => import("../pages/app/ManageOccupancy"));
const NotFound = lazy(() => import("../pages/NotFound"));

/** `/parking/:id` (URL antigua) → el detalle ahora vive en `/?parqueadero=:id`. */
const ParkingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/?parqueadero=${encodeURIComponent(id)}` : "/"} replace />;
};

const AppRouter = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="/parking/:id" element={<ParkingRedirect />} />

        {/* Compatibilidad con URLs ya publicadas */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/verify-mfa" element={<Navigate to="/admin/mfa/verificar" replace />} />

        {/* Acceso del administrador */}
        <Route element={<AuthLayout />}>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/admin/login" element={<Login />} />
          </Route>
        </Route>
        <Route element={<MfaLayout />}>
          <Route element={<RequirePendingMfa expected="requiere_enrolamiento" />}>
            <Route path="/admin/mfa/configurar" element={<MfaEnroll />} />
          </Route>
          <Route element={<RequirePendingMfa expected="requiere_verificacion" />}>
            <Route path="/admin/mfa/verificar" element={<VerifyMfa />} />
          </Route>
        </Route>

        {/* Panel del administrador (aal2) */}
        <Route element={<RequireAal2 />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Panel />} />
            <Route element={<RequireNoParking />}>
              <Route path="/admin/parqueadero/registrar" element={<RegisterParking />} />
            </Route>
            <Route element={<RequireParking />}>
              <Route path="/admin/parqueadero/editar" element={<EditParking />} />
              <Route path="/admin/parqueadero/celdas" element={<ConfigureSpaces />} />
              <Route path="/admin/ocupacion" element={<ManageOccupancy />} />
            </Route>
            <Route path="/admin/*" element={<NotFound />} />
          </Route>

          {/* Rutas latentes: se conservan, sin enlaces desde la UI */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/setup-mfa" element={<SetupMfa />} />
        </Route>

        {/* Rutas latentes públicas (el correo de recuperación de Supabase apunta aquí) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
