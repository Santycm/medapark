import { Minus, Plus } from 'lucide-react';

type Props = {
  /** Valor como texto (se mantiene string para permitir el campo vacío mientras se escribe). */
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: number;
  max?: number;
  id?: string;
  disabled?: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** − [valor] +, solo dígitos, con límites. */
const NumberStepper = ({ value, onChange, label, min = 0, max = 9999, id, disabled }: Props) => {
  const current = value === '' ? min : Number(value);
  const atMin = current <= min;
  const atMax = current >= max;

  const step = (delta: number) => onChange(String(clamp(current + delta, min, max)));

  const buttonClass =
    'flex h-12 w-12 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-canvas text-navy-900 transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        aria-label={`Disminuir ${label}`}
        onClick={() => step(-1)}
        disabled={disabled || atMin}
        className={buttonClass}
      >
        <Minus size={20} aria-hidden="true" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, String(max).length);
          onChange(digits === '' ? '' : String(clamp(Number(digits), min, max)));
        }}
        className="h-12 w-28 rounded-[10px] border-[1.5px] border-line bg-white text-center text-xl font-semibold text-navy-900 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/20"
      />
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        onClick={() => step(1)}
        disabled={disabled || atMax}
        className={buttonClass}
      >
        <Plus size={20} aria-hidden="true" />
      </button>
    </div>
  );
};

export default NumberStepper;
