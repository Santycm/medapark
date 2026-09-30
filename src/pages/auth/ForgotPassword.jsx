import { useState } from "react";
import { Link } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";
import AuthButton from "../../components/auth/AuthButton";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";
import AuthMessage from "../../components/auth/AuthMessage";

import { resetPassword } from "../../services/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await resetPassword(email);

      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
    } catch (error) {
      setError(error.message || "No fue posible enviar el enlace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña."
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          disabled={loading}
        />

        <AuthAlert>{error}</AuthAlert>

        <AuthMessage>{message}</AuthMessage>

        <AuthButton loading={loading}>Enviar enlace</AuthButton>
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
