import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';

import OtpInput from '../../components/auth/OtpInput';
import FieldMessage from '../../components/common/FieldMessage';
import Button from '../../components/common/Button';
import { MAX_MFA_ATTEMPTS, registerFailure, resetFailures } from '../../domain/mfaAttempts';
import { useAuth } from '../../hooks/useAuth';
import { MSG } from '../../lib/messages';
import { createChallenge, getVerifiedTotpFactor, verifyCode } from '../../services/auth';

const VerifyMfa = () => {
  const navigate = useNavigate();
  const { user, refresh, signOut } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const factorId = useRef<string | null>(null);
  const challengeId = useRef<string | null>(null);

  const newChallenge = useCallback(async (): Promise<boolean> => {
    if (!factorId.current) {
      const factor = await getVerifiedTotpFactor().catch(() => null);
      factorId.current = factor?.id ?? null;
    }
    if (!factorId.current) {
      setError(MSG.general.red);
      return false;
    }

    const result = await createChallenge(factorId.current);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    challengeId.current = result.data.challengeId;
    return true;
  }, []);

  useEffect(() => {
    // Un challenge por montaje (en StrictMode se crea dos veces, el último es el vigente).
    void newChallenge();
  }, [newChallenge]);

  const backToLogin = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (code.length !== 6 || busy) return;

    setBusy(true);
    setError('');

    if (!challengeId.current && !(await newChallenge())) {
      setBusy(false);
      return;
    }

    const result = await verifyCode(factorId.current!, challengeId.current!, code);

    if (result.ok) {
      if (user) resetFailures(user.id);
      await refresh();
      navigate('/admin', { replace: true });
      return;
    }

    setCode('');

    if (result.code === 'codigo_expirado') {
      // El vencimiento no cuenta como fallo: se renueva el challenge.
      setError(result.message);
      await newChallenge();
    } else if (result.code === 'codigo_incorrecto') {
      const failures = user ? registerFailure(user.id) : 1;
      if (failures >= MAX_MFA_ATTEMPTS) {
        if (user) resetFailures(user.id);
        await signOut();
        navigate('/admin/login', {
          replace: true,
          state: { notice: MSG.mfa.demasiadosIntentos },
        });
        return;
      }
      setError(result.message);
    } else {
      setError(result.message);
    }

    setBusy(false);
  };

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 lg:h-[clamp(56px,9vh,80px)] lg:w-[clamp(56px,9vh,80px)]">
          <ShieldCheck size={40} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-bold text-navy-900 lg:mt-[1.6vh] lg:text-[clamp(1.4rem,3.8vh,1.875rem)]">Verificación en dos pasos</h1>
        <p className="mt-2 text-base text-ink-500 lg:text-[clamp(0.85rem,1.9vh,1rem)]">
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </p>
      </div>

      <form onSubmit={verify} className="mt-6 space-y-5 lg:mt-[2.4vh] lg:space-y-[2.2vh]">
        <div className="space-y-2">
          <p className="text-base font-semibold text-navy-900">
            Código de verificación{' '}
            <span className="text-danger-600" aria-hidden="true">
              *
            </span>
          </p>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={busy}
            invalid={Boolean(error)}
            describedBy="mfa-help"
          />
          <p id="mfa-help" className="flex items-center justify-center gap-2 text-sm text-ink-500">
            <Smartphone size={16} aria-hidden="true" />
            {MSG.mfa.ayudaCodigoNuevo}
          </p>
        </div>

        <FieldMessage>{error}</FieldMessage>

        <Button type="submit" fullWidth loading={busy} disabled={code.length !== 6} className="py-3.5 lg:h-[clamp(42px,6vh,52px)] lg:py-0">
          <ShieldCheck size={20} aria-hidden="true" />
          Verificar código
        </Button>
        <Button variant="secondary" fullWidth onClick={backToLogin} disabled={busy} className="py-3.5 lg:h-[clamp(42px,6vh,52px)] lg:py-0">
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al inicio de sesión
        </Button>
      </form>
    </>
  );
};

export default VerifyMfa;
