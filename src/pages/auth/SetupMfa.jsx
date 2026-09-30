import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";
import AuthButton from "../../components/auth/AuthButton";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";
import AuthMessage from "../../components/auth/AuthMessage";

import {
  createMfaChallenge,
  enrollMfa,
  getVerifiedTotpFactor,
  unenrollMfa,
  verifyMfa,
} from "../../services/auth";

const SetupMfa = () => {
  const navigate = useNavigate();

  const [factor, setFactor] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadMfa = async () => {
      try {
        const verifiedFactor = await getVerifiedTotpFactor();

        setFactor(verifiedFactor);
      } catch (error) {
        setError(
          error.message || "No fue posible consultar la configuración MFA.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadMfa();
  }, []);

  const handleEnroll = async () => {
    setProcessing(true);
    setError("");
    setMessage("");

    try {
      const data = await enrollMfa();

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactor(data);
    } catch (error) {
      setError(error.message || "No fue posible iniciar la configuración MFA.");
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      if (!factor?.id) {
        throw new Error("No se encontró el factor MFA.");
      }

      const challenge = await createMfaChallenge(factor.id);

      await verifyMfa(factor.id, challenge.id, code);

      const verifiedFactor = await getVerifiedTotpFactor();

      setFactor(verifiedFactor);
      setQrCode("");
      setSecret("");
      setCode("");

      setMessage("La autenticación MFA se configuró correctamente.");
    } catch (error) {
      setError(error.message || "No fue posible verificar el código MFA.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!factor?.id) {
      return;
    }

    const confirmed = window.confirm(
      "¿Deseas desactivar la autenticación MFA?",
    );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      await unenrollMfa(factor.id);

      setFactor(null);

      setMessage("La autenticación MFA fue desactivada.");
    } catch (error) {
      setError(error.message || "No fue posible desactivar MFA.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 flex items-center justify-center">
        <p className="text-sm text-slate-500">Cargando configuración...</p>
      </main>
    );
  }

  if (factor && !qrCode) {
    return (
      <AuthCard
        title="Autenticación MFA"
        description="Tu cuenta ya tiene configurada la autenticación multifactor."
        footer={
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Volver al perfil
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">
              MFA está activo
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              Tu cuenta requiere un código adicional al iniciar sesión.
            </p>
          </div>

          <AuthAlert>{error}</AuthAlert>

          <AuthMessage>{message}</AuthMessage>

          <button
            type="button"
            onClick={handleDisable}
            disabled={processing}
            className="
                            w-full rounded-xl border
                            border-red-200 px-4 py-3
                            text-sm font-semibold text-red-600
                            transition hover:bg-red-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
          >
            {processing ? "Procesando..." : "Desactivar MFA"}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Configurar MFA"
      description="Agrega una capa adicional de seguridad utilizando una aplicación autenticadora."
      footer={
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Volver al perfil
          </button>
        </div>
      }
    >
      {!qrCode ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">
              Aplicación autenticadora
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Utiliza Google Authenticator, Microsoft Authenticator, Authy u
              otra aplicación compatible con códigos TOTP.
            </p>
          </div>

          <AuthAlert>{error}</AuthAlert>

          <AuthButton type="button" loading={processing} onClick={handleEnroll}>
            Generar código QR
          </AuthButton>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Escanea este código QR con tu aplicación autenticadora.
            </p>

            <div className="mt-5 flex justify-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <img
                  src={qrCode}
                  alt="Código QR para configurar MFA"
                  className="h-52 w-52"
                />
              </div>
            </div>
          </div>

          {secret && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Código manual
              </p>

              <p className="mt-2 break-all rounded-xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-700">
                {secret}
              </p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <AuthInput
              label="Código de verificación"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={processing}
            />

            <AuthAlert>{error}</AuthAlert>

            <AuthMessage>{message}</AuthMessage>

            <AuthButton loading={processing}>Activar MFA</AuthButton>
          </form>
        </div>
      )}
    </AuthCard>
  );
};

export default SetupMfa;
