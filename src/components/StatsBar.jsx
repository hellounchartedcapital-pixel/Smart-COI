import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Users } from 'lucide-react';

/**
 * StatsBar - Reusable statistics cards for vendors/tenants views
 *
 * @param {Object} stats - The statistics object { total, compliant, expired, nonCompliant, expiring, pending }
 * @param {string} activeFilter - The currently active status filter
 * @param {Function} onFilterChange - Callback when filter is clicked
 * @param {string} entityName - Name of the entity (e.g., "Vendors", "Tenants")
 */
export function StatsBar({
  stats = {},
  activeFilter = 'all',
  onFilterChange,
  entityName = 'Items'
}) {
  const cards = [
    {
      key: 'all',
      label: `Total ${entityName}`,
      value: stats.total || 0,
      color: 'gray',
      icon: Users,
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-900',
      iconClass: 'text-gray-500',
      activeRing: 'border-gray-900 ring-2 ring-gray-900'
    },
    {
      key: 'expired',
      label: 'Expired',
      value: stats.expired || 0,
      color: 'red',
      icon: XCircle,
      bgClass: 'bg-red-100',
      textClass: 'text-red-600',
      iconClass: 'text-red-500',
      activeRing: 'border-red-500 ring-2 ring-red-500'
    },
    {
      key: 'non-compliant',
      label: 'Non-Compliant',
      value: stats.nonCompliant || 0,
      color: 'orange',
      icon: AlertCircle,
      bgClass: 'bg-orange-100',
      textClass: 'text-orange-600',
      iconClass: 'text-orange-500',
      activeRing: 'border-orange-500 ring-2 ring-orange-500'
    },
    {
      key: 'expiring',
      label: 'Expiring Soon',
      value: stats.expiring || 0,
      color: 'amber',
      icon: Clock,
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-600',
      iconClass: 'text-amber-500',
      activeRing: 'border-amber-500 ring-2 ring-amber-500'
    },
    {
      key: 'compliant',
      label: 'Compliant',
      value: stats.compliant || 0,
      color: 'emerald',
      icon: CheckCircle,
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-600',
      iconClass: 'text-emerald-500',
      activeRing: 'border-emerald-500 ring-2 ring-emerald-500'
    }
  ];

  // Add pending card for tenants
  if (stats.pending !== undefined) {
    cards.splice(4, 0, {
      key: 'pending',
      label: 'Pending',
      value: stats.pending || 0,
      color: 'gray',
      icon: Clock,
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-600',
      iconClass: 'text-gray-400',
      activeRing: 'border-gray-500 ring-2 ring-gray-500'
    });
  }

  return (
    <section aria-label={`${entityName} Statistics`}>
      <h2 className="sr-only">{entityName} Statistics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" role="list">
        {cards.map(card => {
          const Icon = card.icon;
          const isActive = activeFilter === card.key;

          return (
            <button
              key={card.key}
              onClick={() => onFilterChange?.(card.key)}
              className={`bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-all text-left ${
                isActive ? card.activeRing : 'border-gray-200'
              }`}
              role="listitem"
              aria-pressed={isActive}
              aria-label={`${card.label}: ${card.value}. ${isActive ? 'Currently filtered.' : 'Click to filter.'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.textClass} mt-1`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.bgClass} rounded-xl flex items-center justify-center`} aria-hidden="true">
                  <Icon className={card.iconClass} size={24} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default StatsBar;
