import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Kind = 'error' | 'info' | 'success' | 'warning';

const STYLES: Record<Kind, { box: string; icon: ReactNode }> = {
  error: {
    box: 'border-danger-600/30 bg-danger-50 text-danger-600',
    icon: <XCircle size={18} aria-hidden="true" />,
  },
  info: {
    box: 'border-accent-600/30 bg-accent-50 text-accent-600',
    icon: <Info size={18} aria-hidden="true" />,
  },
  success: {
    box: 'border-brand-600/30 bg-brand-50 text-brand-700',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  warning: {
    box: 'border-amber-300 bg-amber-50 text-amber-800',
    icon: <AlertTriangle size={18} aria-hidden="true" />,
  },
};

const Alert = ({ kind = 'error', children }: { kind?: Kind; children?: ReactNode }) => {
  if (!children) return null;
  const { box, icon } = STYLES[kind];

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${box}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
};

export default Alert;
