import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';

import Alert from '../../components/common/Alert';
import FieldMessage from '../../components/common/FieldMessage';
import Button from '../../components/common/Button';
import PasswordField from '../../components/common/PasswordField';
import TextField from '../../components/common/TextField';
import { loginSchema, type LoginValues } from '../../domain/schemas/auth';
import { useAuth } from '../../hooks/useAuth';
import { MSG } from '../../lib/messages';
import { signInAdmin } from '../../services/auth';
import { homeFor } from '../../router/guards/stageRoutes';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [submitError, setSubmitError] = useState('');
  const [showRequired, setShowRequired] = useState(false);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError('');
    const result = await signInAdmin(values.email, values.password);

    if (!result.ok) {
      setSubmitError(result.message);
      resetField('password');
      setFocus('password');
      return;
    }

    const stage = await refresh();
    navigate(homeFor(stage), { replace: true });
  };

  // Resumen "Debe completar los campos requeridos": solo cuando falta algún campo (no por formato).
  const onInvalid = (fieldErrors: FieldErrors<LoginValues>) => {
    setShowRequired(
      fieldErrors.email?.message === MSG.login.correoObligatorio ||
        fieldErrors.password?.message === MSG.login.contrasenaObligatoria,
    );
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-navy-900 lg:text-[clamp(1.75rem,5.4vh,3rem)]">Iniciar sesión</h1>

      <form
        noValidate
        onSubmit={(event) => {
          setShowRequired(false);
          return handleSubmit(onSubmit, onInvalid)(event);
        }}
        className="mt-6 space-y-6 lg:mt-[3.5vh] lg:space-y-[3vh]"
      >
        <Alert kind="info">{notice}</Alert>

        <TextField
          label="Correo electrónico"
          type="email"
          required
          placeholder="usuario@dominio"
          autoComplete="username"
          fieldSize="lg"
          icon={<Mail size={20} aria-hidden="true" />}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <PasswordField
          label="Contraseña"
          fieldSize="lg"
          required
          placeholder="Ingresa tu contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        {showRequired && <FieldMessage>{MSG.login.requeridos}</FieldMessage>}

        <div className="space-y-[1.6vh]">
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Ingresar
          </Button>
          <FieldMessage>{submitError}</FieldMessage>
        </div>
      </form>
    </>
  );
};

export default Login;
