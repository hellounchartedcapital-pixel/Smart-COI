'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function FreeAssessmentPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    vendorCount: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/free-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-0">
        {/* Hero */}
        <section className="bg-white pb-16 pt-16 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
              Free Compliance Assessment
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Get a Free COI Compliance Assessment
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              Send us your certificates of insurance and we&apos;ll identify your biggest compliance
              gaps — coverage shortfalls, expired policies, and missing endorsements. No cost, no
              commitment.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="bg-[#FAFAFA] py-16 sm:py-20">
          <div className="mx-auto max-w-xl px-6">
            {submitted ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8FAF0]">
                  <CheckCircle2 className="h-7 w-7 text-[#4CC78A]" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-950">
                  Thanks!
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-500">
                  We&apos;ll reach out within 24 hours with instructions to submit your COI files.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10"
              >
                <h2 className="text-xl font-bold text-slate-950">
                  Request Your Free Assessment
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </p>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 space-y-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                      placeholder="Acme Properties LLC"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                      placeholder="john@acmeproperties.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                      Phone <span className="text-sm font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Vendor Count */}
                  <div>
                    <label htmlFor="vendorCount" className="block text-sm font-medium text-slate-700">
                      How many vendors/contractors do you manage?
                    </label>
                    <select
                      id="vendorCount"
                      value={formData.vendorCount}
                      onChange={(e) => setFormData({ ...formData, vendorCount: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                    >
                      <option value="">Select...</option>
                      <option value="1-10">1-10</option>
                      <option value="11-25">11-25</option>
                      <option value="26-50">26-50</option>
                      <option value="50+">50+</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                      Message / Notes <span className="text-sm font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#73E2A7] focus:outline-none focus:ring-1 focus:ring-[#73E2A7]"
                      placeholder="Any details about your compliance needs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 flex w-full items-center justify-center rounded-lg bg-[#73E2A7] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4CC78A] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Request Free Assessment'
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Upsell */}
        <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg font-semibold text-slate-950">
              Need results faster?
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              Get a comprehensive audit with a full branded report delivered in 48 hours — including
              coverage gap analysis, risk prioritization, and actionable recommendations.
            </p>
            <Link
              href="/audit"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#4CC78A] transition-colors hover:text-[#3aae72]"
            >
              Learn About Our Full Audit — $299
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
