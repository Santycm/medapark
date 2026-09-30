import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";

import {
  getCurrentUser,
  getVerifiedTotpFactor,
  logout,
} from "../../services/auth";

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await getCurrentUser();

        const factor = await getVerifiedTotpFactor();

        setUser(currentUser);
        setMfaEnabled(Boolean(factor));
      } catch (error) {
        setError(
          error.message || "No fue posible cargar la información del usuario.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");

    try {
      await logout();

      navigate("/login");
    } catch (error) {
      setError(error.message || "No fue posible cerrar la sesión.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">Cargando información...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">MedaPark</h1>

            <p className="text-sm text-slate-500">Panel administrativo</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="
                            rounded-xl border border-slate-200
                            px-4 py-2 text-sm font-semibold
                            text-slate-700 transition
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
          >
            {loggingOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Mi perfil</h2>

          <p className="mt-1 text-sm text-slate-500">
            Administra tu información y configuración de seguridad.
          </p>
        </div>

        <AuthAlert>{error}</AuthAlert>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Información de cuenta
            </h3>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Correo electrónico
                </p>

                <p className="mt-1 text-sm text-slate-700">{user?.email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ID de usuario
                </p>

                <p className="mt-1 break-all text-sm text-slate-700">
                  {user?.id}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Autenticación MFA
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Protege tu cuenta con un código adicional.
                </p>
              </div>

              <span
                className={`
                                    rounded-full px-3 py-1
                                    text-xs font-semibold
                                    ${
                                      mfaEnabled
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }
                                `}
              >
                {mfaEnabled ? "Activo" : "No configurado"}
              </span>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate("/setup-mfa")}
                className="
                                    w-full rounded-xl
                                    bg-slate-900 px-4 py-3
                                    text-sm font-semibold text-white
                                    transition hover:bg-slate-800
                                "
              >
                {mfaEnabled ? "Administrar MFA" : "Configurar MFA"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Profile;
