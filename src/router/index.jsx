import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import Loader from "../components/common/Loader";

const Home = lazy(() => import("../pages/public/Home"));
const ParkingDetail = lazy(() => import("../pages/public/ParkingDetail"));
const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("../pages/auth/UpdatePassword"));
const SetupMfa = lazy(() => import("../pages/auth/SetupMfa"));
const VerifyMfa = lazy(() => import("../pages/auth/VerifyMfa"));
const Profile = lazy(() => import("../pages/app/Profile"));

const AppRouter = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parking/:id" element={<ParkingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/verify-mfa" element={<VerifyMfa />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/setup-mfa" element={<SetupMfa />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
