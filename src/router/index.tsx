import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import Loader from "../components/common/Loader";
import AdminLayout from "../components/layout/AdminLayout";
import AuthLayout from "../components/layout/AuthLayout";
import MfaLayout from "../components/layout/MfaLayout";
import RedirectIfAuthenticated from "./guards/RedirectIfAuthenticated";
import RequireAal2 from "./guards/RequireAal2";
import RequirePendingMfa from "./guards/RequirePendingMfa";

const Home = lazy(() => import("../pages/public/Home"));
const ParkingDetail = lazy(() => import("../pages/public/ParkingDetail"));
const Login = lazy(() => import("../pages/auth/Login"));
const MfaEnroll = lazy(() => import("../pages/auth/MfaEnroll"));
const VerifyMfa = lazy(() => import("../pages/auth/VerifyMfa"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("../pages/auth/UpdatePassword"));
const SetupMfa = lazy(() => import("../pages/auth/SetupMfa"));
const Profile = lazy(() => import("../pages/app/Profile"));
const Panel = lazy(() => import("../pages/app/Panel"));
const NotFound = lazy(() => import("../pages/NotFound"));

const AppRouter = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parking/:id" element={<ParkingDetail />} />

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
