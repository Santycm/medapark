import { useId, useRef, useState, type ChangeEvent } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

const LENGTH = 6;

const sanitizeOtp = (raw: string) => raw.replace(/\D/g, '').slice(0, LENGTH);

/**
 * Seis casillas visuales sobre un único <input> accesible
 * (inputMode numérico, `autocomplete="one-time-code"`).
 */
const OtpInput = ({ value, onChange, onComplete, disabled, invalid, describedBy }: Props) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeOtp(event.target.value);
    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  const activeIndex = Math.min(value.length, LENGTH - 1);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div className="grid grid-cols-6 gap-2.5" aria-hidden="true">
        {Array.from({ length: LENGTH }, (_, index) => {
          const isActive = focused && index === activeIndex && !disabled;
          return (
            <div
              key={index}
              className={`flex h-[clamp(44px,7vh,64px)] items-center justify-center rounded-[10px] border-[1.5px] bg-white text-[clamp(1.25rem,3.2vh,1.5rem)] font-medium text-navy-900 transition ${
                invalid
                  ? 'border-danger-600'
                  : isActive
                    ? 'border-brand-600 ring-4 ring-brand-600/20'
                    : 'border-line'
              } ${disabled ? 'bg-canvas' : ''}`}
            >
              {value[index] ?? ''}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={handle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        aria-label="Código de verificación"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
};

export default OtpInput;
