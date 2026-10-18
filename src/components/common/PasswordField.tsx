import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import TextField, { type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing' | 'icon'>;

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      icon={<Lock size={20} aria-hidden="true" />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="rounded-md p-2 text-ink-500 hover:text-navy-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      }
    />
  );
});

export default PasswordField;
