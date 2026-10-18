import type { HTMLAttributes } from 'react';

const Card = ({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-2xl border border-line bg-white p-6 shadow-sm ${className}`} {...rest} />
);

export default Card;
