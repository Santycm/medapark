import { useState } from "react";
import { Link, useNavigate } from "react-router";

import AuthAlert from "../../components/auth/AuthAlert";
import AuthButton from "../../components/auth/AuthButton";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";

import { login } from "../../services/auth";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await login(email, password);

      if (result.requiresMfa) {
        navigate("/verify-mfa");
        return;
      }

      navigate("/profile");
    } catch (error) {
      setError(error.message || "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Ingresa tus credenciales para acceder al panel administrativo."
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <AuthInput
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          disabled={loading}
        />

        <AuthInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <AuthAlert>{error}</AuthAlert>

        <AuthButton loading={loading}>Iniciar sesión</AuthButton>
      </form>
    </AuthCard>
  );
};

export default Login;
