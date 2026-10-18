import { Fragment } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; to?: string };

const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Migas de pan">
    <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={item.label}>
            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
            <li aria-current={last ? 'page' : undefined}>
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-navy-900 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'font-semibold text-navy-900' : undefined}>{item.label}</span>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumbs;
