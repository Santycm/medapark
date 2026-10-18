type LogoProps = { variant?: 'horizontal' | 'vertical'; className?: string };

const SOURCES = {
  horizontal: '/img/logo-horizontal.png',
  vertical: '/img/logo-vertical.png',
} as const;

const Logo = ({ variant = 'horizontal', className = 'h-10' }: LogoProps) => (
  <img src={SOURCES[variant]} alt="MedaPark" className={`w-auto ${className}`} />
);

export default Logo;
