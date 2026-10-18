import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600/30',
  secondary:
    'border border-line bg-white text-navy-900 hover:bg-canvas focus-visible:ring-navy-900/15',
  accent: 'bg-accent-600 text-white hover:bg-accent-600/90 focus-visible:ring-accent-600/30',
  danger: 'bg-danger-600 text-white hover:bg-danger-600/90 focus-visible:ring-danger-600/30',
  ghost: 'text-ink-500 hover:bg-canvas hover:text-navy-900 focus-visible:ring-navy-900/15',
};

const SIZES = { md: 'px-4 py-2.5 text-sm', lg: 'h-[clamp(46px,7vh,64px)] px-6 text-[clamp(1rem,2.6vh,1.25rem)]' } as const;

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
      SIZES[size]
    } ${fullWidth ? 'w-full' : ''} ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export default Button;
