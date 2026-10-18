import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

type Props = { id?: string; children?: ReactNode };

/** Mensaje de error en línea: ícono de alerta + texto rojo (HU01). */
const FieldMessage = ({ id, children }: Props) => {
  if (!children) return null;

  return (
    <p id={id} role="alert" className="flex items-center gap-2 text-sm text-danger-600">
      <CircleAlert size={18} className="shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
};

export default FieldMessage;
