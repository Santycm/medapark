import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  icon?: ReactNode;
};

/** Casilla con apariencia propia; el `<input>` real queda accesible por teclado. */
const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, icon, id, className = '', checked, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <label htmlFor={inputId} className={`flex cursor-pointer items-center gap-3 ${className}`}>
      <span className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-line bg-white checked:border-accent-600 checked:bg-accent-600 focus-visible:ring-4 focus-visible:ring-accent-600/30"
          {...rest}
        />
        <Check
          size={15}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none relative hidden text-white peer-checked:block"
        />
      </span>
      {icon && <span className="text-navy-900">{icon}</span>}
      <span className="text-base font-medium text-navy-900">{label}</span>
    </label>
  );
});

export default Checkbox;
