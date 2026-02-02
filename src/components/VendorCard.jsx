import React from 'react';
import {
  CheckCircle, XCircle, AlertCircle, Clock,
  Mail, Phone, Send, Calendar, Loader2
} from 'lucide-react';
import { formatDate, formatRelativeDate, formatCurrency, getStatusConfig } from '../utils/complianceUtils';

/**
 * Status icon component
 */
function StatusIcon({ status }) {
  const config = getStatusConfig(status);
  const icons = { CheckCircle, XCircle, AlertCircle, Clock };
  const Icon = icons[config.icon] || Clock;

  return (
    <div
      className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center`}
      role="img"
      aria-label={config.label}
    >
      <Icon size={20} className={config.iconColor} aria-hidden="true" />
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status, daysOverdue }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      role="status"
    >
      {status === 'expired' && daysOverdue
        ? `Expired (${daysOverdue} days)`
        : config.label}
    </span>
  );
}

/**
 * VendorCard - Individual vendor card component
 *
 * @param {Object} vendor - The vendor data
 * @param {Function} onSelect - Callback when vendor is selected
 * @param {Function} onRequestCOI - Callback when COI request is initiated
 * @param {boolean} sendingRequest - Whether a request is being sent
 * @param {string|null} requestSuccess - ID of vendor with successful request
 */
export function VendorCard({
  vendor,
  onSelect,
  onRequestCOI,
  sendingRequest,
  requestSuccess
}) {
  const needsAttention = ['expired', 'non-compliant', 'expiring'].includes(vendor.status);
  const hasEmail = vendor.email || vendor.contactEmail;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(vendor);
    }
  };

  return (
    <article
      className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onSelect?.(vendor)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${vendor.name}, ${getStatusConfig(vendor.status).label}. Press enter for details.`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
        {/* Main Info */}
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            <StatusIcon status={vendor.status} />
          </div>
          <div className="flex-1 min-w-0">
            {/* Name and Status */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {vendor.name}
              </h3>
              <StatusBadge status={vendor.status} daysOverdue={vendor.daysOverdue} />
            </div>

            {/* DBA */}
            {vendor.dba && (
              <p className="text-sm text-gray-500 mb-2">
                DBA: {vendor.dba}
              </p>
            )}

            {/* Issues */}
            {vendor.issues && vendor.issues.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {vendor.issues.slice(0, 2).map((issue, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-sm text-orange-700">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="break-words">
                      {typeof issue === 'string' ? issue : issue.message}
                    </span>
                  </div>
                ))}
                {vendor.issues.length > 2 && (
                  <p className="text-xs text-gray-500 ml-5">
                    +{vendor.issues.length - 2} more issues
                  </p>
                )}
              </div>
            )}

            {/* Coverage Summary */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              {vendor.coverage?.generalLiability && (
                <div className="bg-gray-100 px-2 py-1 rounded-lg">
                  <span className="font-medium">GL:</span>{' '}
                  {formatCurrency(vendor.coverage.generalLiability.amount)}
                </div>
              )}
              {vendor.coverage?.autoLiability && (
                <div className="bg-gray-100 px-2 py-1 rounded-lg">
                  <span className="font-medium">Auto:</span>{' '}
                  {formatCurrency(vendor.coverage.autoLiability.amount)}
                </div>
              )}
              {vendor.coverage?.workersComp && (
                <div className="bg-gray-100 px-2 py-1 rounded-lg">
                  <span className="font-medium">WC:</span>{' '}
                  {formatCurrency(vendor.coverage.workersComp.amount)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 sm:gap-3 ml-0 sm:ml-4 text-right">
          {/* Expiration */}
          <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
            <Calendar size={14} className="mr-1.5" aria-hidden="true" />
            <span>{formatDate(vendor.expirationDate)}</span>
          </div>

          {/* Last Contacted */}
          {vendor.lastContactedAt && (
            <div
              className="flex items-center text-xs text-gray-500"
              title={`Last contacted: ${formatDate(vendor.lastContactedAt)}`}
            >
              <Mail size={12} className="mr-1" aria-hidden="true" />
              <span>Contacted {formatRelativeDate(vendor.lastContactedAt)}</span>
            </div>
          )}

          {/* Contact Info */}
          {(vendor.email || vendor.contactEmail || vendor.phone || vendor.contactPhone) && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {(vendor.email || vendor.contactEmail) && (
                <Mail size={12} aria-hidden="true" />
              )}
              {(vendor.phone || vendor.contactPhone) && (
                <Phone size={12} aria-hidden="true" />
              )}
            </div>
          )}

          {/* Request COI Button */}
          {needsAttention && hasEmail && (
            requestSuccess === vendor.id ? (
              <span className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center space-x-1.5">
                <CheckCircle size={12} aria-hidden="true" />
                <span>Sent!</span>
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestCOI?.(vendor);
                }}
                disabled={sendingRequest === vendor.id}
                className="text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-lg hover:shadow-md font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all disabled:opacity-50"
                aria-label={`Request certificate of insurance from ${vendor.name}`}
              >
                {sendingRequest === vendor.id ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send size={12} aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Request COI</span>
                <span className="sm:hidden">Request</span>
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export default VendorCard;
