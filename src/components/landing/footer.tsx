import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="flex flex-col gap-3 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.svg" alt="" className="h-7 w-7" />
              <span className="text-lg font-bold text-white">SmartCOI</span>
            </div>
            <p className="text-sm text-slate-500">
              AI-powered COI compliance tracking for commercial property managers.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/features/coi-tracking" className="text-slate-400 transition-colors hover:text-white">
                COI Tracking
              </Link>
              <Link href="/features/compliance-automation" className="text-slate-400 transition-colors hover:text-white">
                Compliance Automation
              </Link>
              <Link href="/features/vendor-management" className="text-slate-400 transition-colors hover:text-white">
                Vendor Management
              </Link>
              <Link href="/coi-tracking-software" className="text-slate-400 transition-colors hover:text-white">
                COI Tracking Software
              </Link>
              <Link href="/ai-coi-extraction" className="text-slate-400 transition-colors hover:text-white">
                AI COI Extraction
              </Link>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Use Cases</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/certificate-of-insurance-tracking" className="text-slate-400 transition-colors hover:text-white">
                Certificate of Insurance Tracking
              </Link>
              <Link href="/vendor-insurance-compliance" className="text-slate-400 transition-colors hover:text-white">
                Vendor Insurance Compliance
              </Link>
              <Link href="/tenant-insurance-tracking" className="text-slate-400 transition-colors hover:text-white">
                Tenant Insurance Tracking
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/blog" className="text-slate-400 transition-colors hover:text-white">
                Blog
              </Link>
              <Link href="/compare" className="text-slate-400 transition-colors hover:text-white">
                Compare Solutions
              </Link>
              <Link href="/compare/smartcoi-vs-spreadsheets" className="text-slate-400 transition-colors hover:text-white">
                SmartCOI vs Spreadsheets
              </Link>
              <Link href="/compare/smartcoi-vs-jones" className="text-slate-400 transition-colors hover:text-white">
                SmartCOI vs Jones
              </Link>
              <Link href="/compare/smartcoi-vs-bcs" className="text-slate-400 transition-colors hover:text-white">
                SmartCOI vs BCS
              </Link>
              <Link href="/compare/smartcoi-vs-mycoi" className="text-slate-400 transition-colors hover:text-white">
                SmartCOI vs myCOI
              </Link>
              <Link href="/blog/coi-compliance-guide-property-managers" className="text-slate-400 transition-colors hover:text-white">
                COI Compliance Guide
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/login" className="text-slate-400 transition-colors hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="text-slate-400 transition-colors hover:text-white">
                Sign Up
              </Link>
              <Link href="/terms" className="text-slate-400 transition-colors hover:text-white">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-400 transition-colors hover:text-white">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SmartCOI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
