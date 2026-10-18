import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import FieldMessage from './FieldMessage';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  /** Elemento al final del campo (por ejemplo, el ojo de la contraseña). */
  trailing?: ReactNode;
  /** `lg` = campos grandes de la pantalla de inicio de sesión. */
  fieldSize?: 'md' | 'lg';
};

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, icon, trailing, required, id, fieldSize = 'md', className = '', ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const large = fieldSize === 'lg';

  return (
    <div className={large ? 'space-y-[1.2vh]' : 'space-y-1.5'}>
      <label
        htmlFor={inputId}
        className={`block font-semibold text-navy-900 ${large ? 'text-[clamp(0.9rem,2.2vh,1.125rem)]' : 'text-sm'}`}
      >
        {label}
        {required && (
          <span className="text-danger-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-[10px] border bg-white text-navy-900 outline-none transition placeholder:text-ink-500/50 focus:ring-4 disabled:cursor-not-allowed disabled:bg-canvas ${
            large ? 'h-[clamp(46px,7vh,64px)] text-[clamp(0.9rem,2.2vh,1.125rem)]' : 'h-11 text-sm'
          } ${icon ? 'pl-12' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'} ${
            error
              ? 'border-danger-600 focus:ring-danger-600/20'
              : 'border-line focus:border-brand-600 focus:ring-brand-600/20'
          } ${className}`}
          {...rest}
        />
        {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
      </div>

      {error ? (
        <FieldMessage id={`${inputId}-error`}>{error}</FieldMessage>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default TextField;
