import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable SEO-friendly Breadcrumb Component
 * 
 * @param {Array<{ label: string, path?: string, isCurrent?: boolean }>} items - Breadcrumb trail items
 */
const Breadcrumbs = ({ items = [], className = '' }) => {
  if (!items || items.length === 0) return null;

  // JSON-LD Breadcrumb Schema
  const breadcrumbListSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.path ? { item: `https://www.s2ccrackers.com${item.path.startsWith('/') ? item.path : '/' + item.path}` } : {}),
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-1.5 text-xs text-slate-400 ${className}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListSchema) }}
      />
      {items.map((item, index) => {
        const isLast = index === items.length - 1 || item.isCurrent;

        return (
          <React.Fragment key={index}>
            {index === 0 ? (
              <Link
                to={item.path || '/'}
                className="flex items-center gap-1 hover:text-amber-400 transition-colors py-0.5"
                title="Home"
              >
                <Home className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400" />
                <span>{item.label}</span>
              </Link>
            ) : isLast ? (
              <span className="text-amber-300 font-semibold truncate max-w-[220px] sm:max-w-[320px] py-0.5">
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="hover:text-amber-400 transition-colors truncate max-w-[180px] py-0.5"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-300 py-0.5">{item.label}</span>
            )}

            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
