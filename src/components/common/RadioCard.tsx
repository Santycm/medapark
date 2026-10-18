import { useId, type ReactNode } from 'react';

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

/** Tarjeta seleccionable (radio): Activo/Inactivo, tipo de vehículo, etc. */
const RadioCard = ({ name, value, checked, onChange, title, description, icon, disabled }: Props) => {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] p-3.5 transition focus-within:ring-4 focus-within:ring-brand-600/20 ${
        checked ? 'border-brand-600 bg-brand-50' : 'border-line bg-white hover:bg-canvas'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
      />
      {icon && <span className="text-navy-900">{icon}</span>}
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-navy-900">{title}</span>
        {description && <span className="text-sm text-ink-500">{description}</span>}
      </span>
    </label>
  );
};

export default RadioCard;
