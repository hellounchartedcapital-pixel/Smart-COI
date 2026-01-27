// Pricing.jsx
// Pricing page with subscription tiers

import React, { useState } from 'react';
import { Logo } from './Logo';
import { Check, X, Zap, Building, Building2, ArrowLeft, Loader2 } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 49,
    priceId: '', // Will be filled with Stripe price ID
    description: 'Perfect for small property managers',
    icon: Zap,
    color: 'emerald',
    vendors: 25,
    features: [
      { text: 'Up to 25 vendors', included: true },
      { text: 'AI-powered COI extraction', included: true },
      { text: 'Email COI requests', included: true },
      { text: 'Compliance dashboard', included: true },
      { text: 'Expiration alerts', included: true },
      { text: 'CSV export', included: true },
      { text: 'Analytics & reports', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Professional',
    price: 99,
    priceId: '', // Will be filled with Stripe price ID
    description: 'For growing property management companies',
    icon: Building,
    color: 'blue',
    vendors: 100,
    popular: true,
    features: [
      { text: 'Up to 100 vendors', included: true },
      { text: 'AI-powered COI extraction', included: true },
      { text: 'Email COI requests', included: true },
      { text: 'Compliance dashboard', included: true },
      { text: 'Expiration alerts', included: true },
      { text: 'CSV export', included: true },
      { text: 'Analytics & reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Business',
    price: 199,
    priceId: '', // Will be filled with Stripe price ID
    description: 'For large-scale operations',
    icon: Building2,
    color: 'purple',
    vendors: 500,
    features: [
      { text: 'Up to 500 vendors', included: true },
      { text: 'AI-powered COI extraction', included: true },
      { text: 'Email COI requests', included: true },
      { text: 'Compliance dashboard', included: true },
      { text: 'Expiration alerts', included: true },
      { text: 'CSV export', included: true },
      { text: 'Analytics & reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
  },
];

export function Pricing({ onBack, onSelectPlan, currentPlan, user }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(null);

  const handleSelectPlan = async (plan) => {
    if (!user) {
      // Redirect to signup if not logged in
      onSelectPlan?.(plan, 'signup');
      return;
    }

    setLoading(plan.name);
    try {
      // This will call the Stripe checkout
      await onSelectPlan?.(plan, 'checkout');
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getAnnualPrice = (monthlyPrice) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  };

  const getDisplayPrice = (plan) => {
    if (billingCycle === 'annual') {
      return Math.round(getAnnualPrice(plan.price) / 12);
    }
    return plan.price;
  };

  const getColorClasses = (color, type) => {
    const colors = {
      emerald: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        ring: 'ring-emerald-500',
      },
      blue: {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        button: 'bg-blue-500 hover:bg-blue-600',
        ring: 'ring-blue-500',
      },
      purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        button: 'bg-purple-500 hover:bg-purple-600',
        ring: 'ring-purple-500',
      },
    };
    return colors[color][type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <Logo size="default" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. All plans include our core AI-powered COI tracking features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  billingCycle === 'annual'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Annual</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.name.toLowerCase();

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-md">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(plan.color, 'bgLight')}`}>
                      <Icon className={`w-6 h-6 ${getColorClasses(plan.color, 'text')}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">
                        ${getDisplayPrice(plan)}
                      </span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-emerald-600 mt-1">
                        ${getAnnualPrice(plan.price)}/year (save ${plan.price * 12 - getAnnualPrice(plan.price)})
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loading === plan.name || isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center space-x-2 ${
                      isCurrentPlan
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `${getColorClasses(plan.color, 'button')} hover:shadow-lg`
                    }`}
                  >
                    {loading === plan.name ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : isCurrentPlan ? (
                      <span>Current Plan</span>
                    ) : (
                      <span>Get Started</span>
                    )}
                  </button>

                  {/* Vendor Count */}
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Up to {plan.vendors} vendors
                  </p>
                </div>

                {/* Features */}
                <div className="border-t border-gray-100 p-8 pt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-4">What's included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Need more than 500 vendors?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Contact us for custom enterprise pricing with unlimited vendors, SSO, dedicated support, and custom integrations.
            </p>
            <a
              href="mailto:sales@smartcoi.io"
              className="inline-flex items-center px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* FAQ or Trust */}
        <div className="mt-16 text-center">
          <p className="text-gray-500">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <p className="text-gray-500 mt-2">
            Questions? Email us at{' '}
            <a href="mailto:support@smartcoi.io" className="text-emerald-600 hover:underline">
              support@smartcoi.io
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2026 SmartCOI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
