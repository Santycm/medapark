import { useState } from "react";
import { Link } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";
import AuthButton from "../../components/auth/AuthButton";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";
import AuthMessage from "../../components/auth/AuthMessage";

import { updatePassword } from "../../services/auth";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);

      setMessage("Contraseña actualizada correctamente.");

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message || "No fue posible actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Nueva contraseña"
      description="Ingresa y confirma tu nueva contraseña."
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
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
        />

        <AuthInput
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
        />

        <AuthAlert>{error}</AuthAlert>

        <AuthMessage>{message}</AuthMessage>

        <AuthButton loading={loading}>Cambiar contraseña</AuthButton>
      </form>
    </AuthCard>
  );
};

export default UpdatePassword;
