import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import Badge from '../common/Badge';
import Breadcrumbs from '../common/Breadcrumbs';

type Props = {
  title: string;
  subtitle: string;
  backTo?: string;
  crumbs?: { label: string; to?: string }[];
  status?: boolean;
  children: ReactNode;
};

/** Encabezado común de las pantallas internas: migas, flecha "←", título y subtítulo. */
const FormPage = ({ title, subtitle, backTo = '/admin', crumbs, status, children }: Props) => (
  <div className="space-y-4">
    {crumbs && <Breadcrumbs items={crumbs} />}
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to={backTo}
        aria-label="Volver"
        className="rounded-lg p-1.5 text-navy-900 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
      >
        <ArrowLeft size={26} aria-hidden="true" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold text-navy-900">{title}</h1>
        <p className="text-base text-ink-500">{subtitle}</p>
      </div>
      {status !== undefined && <Badge active={status} />}
    </div>
    {children}
  </div>
);

export default FormPage;
