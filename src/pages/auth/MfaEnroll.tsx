import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Copy, ShieldCheck } from 'lucide-react';

import OtpInput from '../../components/auth/OtpInput';
import FieldMessage from '../../components/common/FieldMessage';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { createChallenge, startTotpEnrollment, verifyCode } from '../../services/auth';

type Enrollment = { factorId: string; qrCodeSvg: string; secret: string };

const MfaEnroll = () => {
  const navigate = useNavigate();
  const { refresh, signOut } = useAuth();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const start = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await startTotpEnrollment();
    if (result.ok) {
      setEnrollment(result.data);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Una sola vez aunque StrictMode monte dos veces: evita crear dos factores.
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!enrollment || code.length !== 6 || busy) return;

    setBusy(true);
    setError('');

    const challenge = await createChallenge(enrollment.factorId);
    if (!challenge.ok) {
      setError(challenge.message);
      setBusy(false);
      return;
    }

    const result = await verifyCode(enrollment.factorId, challenge.data.challengeId, code);
    if (!result.ok) {
      setError(result.message);
      setCode('');
      setBusy(false);
      return;
    }

    await refresh();
    navigate('/admin', { replace: true });
  };

  const copySecret = async () => {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const backToLogin = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  if (loading) return <Loader fullScreen={false} />;

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-navy-900 lg:text-[clamp(1.25rem,3.4vh,1.75rem)]">
        Configurar verificación en dos pasos
      </h1>

      {enrollment ? (
        <>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-500 lg:mt-[1.4vh] lg:text-[clamp(0.75rem,1.7vh,0.875rem)]">
            <li>
              Instala una app autenticadora (Google Authenticator, Microsoft Authenticator o
              similar).
            </li>
            <li>Escanea el código QR.</li>
            <li>Ingresa el código de 6 dígitos que muestra la app.</li>
          </ol>

          <div className="mt-5 flex justify-center lg:mt-[2vh]">
            <div className="rounded-xl border border-line bg-white p-3">
              <img
                src={enrollment.qrCodeSvg}
                alt="Código QR para tu app autenticadora"
                className="h-44 w-44 lg:h-[clamp(88px,17vh,176px)] lg:w-[clamp(88px,17vh,176px)]"
              />
            </div>
          </div>

          <div className="mt-4 rounded-[10px] bg-canvas p-3.5 text-sm text-ink-500 lg:mt-[1.6vh] lg:p-[1.4vh] lg:text-[clamp(0.75rem,1.7vh,0.875rem)]">
            <p>¿No puedes escanear? Ingresa esta clave:</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="break-all font-mono text-navy-900">{enrollment.secret}</code>
              <Button variant="secondary" onClick={copySecret} aria-label="Copiar clave">
                <Copy size={14} aria-hidden="true" />
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <form onSubmit={verify} className="mt-5 space-y-4 lg:mt-[2vh] lg:space-y-[1.8vh]">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-navy-900">
                Código de verificación{' '}
                <span className="text-danger-600" aria-hidden="true">
                  *
                </span>
              </label>
              <OtpInput value={code} onChange={setCode} disabled={busy} invalid={Boolean(error)} />
            </div>

            <FieldMessage>{error}</FieldMessage>

            <Button type="submit" fullWidth loading={busy} disabled={code.length !== 6} className="py-3.5 lg:h-[clamp(42px,6vh,52px)] lg:py-0">
              <ShieldCheck size={20} aria-hidden="true" />
              Verificar código
            </Button>
          </form>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <FieldMessage>{error}</FieldMessage>
          <Button fullWidth onClick={start}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="mt-3 lg:mt-[1.4vh]">
        <Button variant="secondary" fullWidth onClick={backToLogin} disabled={busy} className="py-3.5 lg:h-[clamp(42px,6vh,52px)] lg:py-0">
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al inicio de sesión
        </Button>
      </div>
    </>
  );
};

export default MfaEnroll;
