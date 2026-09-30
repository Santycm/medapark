import { useState } from "react";
import { Link, useNavigate } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";
import AuthButton from "../../components/auth/AuthButton";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";

import {
  createMfaChallenge,
  getVerifiedTotpFactor,
  verifyMfa,
} from "../../services/auth";

const VerifyMfa = () => {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const factor = await getVerifiedTotpFactor();

      if (!factor) {
        throw new Error("No hay un factor MFA configurado.");
      }

      const challenge = await createMfaChallenge(factor.id);

      await verifyMfa(factor.id, challenge.id, code);

      navigate("/profile");
    } catch (error) {
      setError(error.message || "El código MFA no es válido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Verificación MFA"
      description="Ingresa el código de 6 dígitos generado por tu aplicación autenticadora."
      footer={
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      }
    >
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
          disabled={loading}
        />

        <AuthAlert>{error}</AuthAlert>

        <AuthButton loading={loading}>Verificar código</AuthButton>
      </form>
    </AuthCard>
  );
};

export default VerifyMfa;
