import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Terms of Service | MyCRM",
  description: "Enterprise Terms of Service, eligibility criteria, automatic renewal provisions, acceptable use, and intellectual property terms.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 md:p-14">
        {/* Navigation & Header */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Last updated: October 2026 &bull; Enterprise SaaS Agreement
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Eligibility & COPPA */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              1. Eligibility &amp; Age Gate (COPPA Compliance)
            </h2>
            <p className="text-sm text-slate-600 mb-2">
              By accessing or creating an account on MyCRM, you affirm and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>You are at least 18 years of age (or have reached the age of majority in your jurisdiction).</li>
              <li>You are acting on behalf of a legitimate business entity or commercial enterprise.</li>
              <li><strong>You are not under 13 years of age.</strong> In compliance with COPPA, children under 13 are strictly prohibited from creating accounts, submitting personal information, or utilizing the platform.</li>
            </ul>
          </section>

          {/* Subscriptions & Auto-Renewal */}
          <section className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-blue-950 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              2. Subscriptions, Automatic Renewal &amp; Cancellation (California ARL)
            </h2>
            <p className="text-xs sm:text-sm text-blue-900 mb-3">
              If you purchase a paid subscription tier:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li>
                <strong>Automatic Renewal:</strong> Your subscription renews automatically on a recurring monthly or annual basis until you cancel.
              </li>
              <li>
                <strong>Recurring Charge:</strong> You authorize recurring charges to your payment method at the agreed rate until cancelled.
              </li>
              <li>
                <strong>Immediate Online Cancellation:</strong> You may cancel your subscription at any time online without speaking to a representative by visiting <strong>Settings &gt; Billing &gt; Cancel Subscription</strong>.
              </li>
              <li>
                <strong>No Cancellation Fees:</strong> Cancellation takes effect at the end of the current billing cycle, and no further recurring charges will be made.
              </li>
            </ul>
          </section>

          {/* User Content & Intellectual Property */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              3. User Content &amp; Copyright Compliance (DMCA)
            </h2>
            <p className="text-sm text-slate-600 mb-2">
              You retain ownership of documents, lead files, and data uploaded to your tenant. However, you represent and warrant that 
              your content does not infringe third-party copyrights, trademarks, or proprietary rights.
            </p>
            <p className="text-sm text-slate-600 mb-2">
              We respond expeditiously to notices of claimed copyright infringement under the Digital Millennium Copyright Act. 
              We enforce a strict <strong>Repeat Infringer Termination Policy</strong>; users who repeatedly infringe intellectual property rights 
              will have their accounts permanently terminated.
            </p>
          </section>

          {/* Commercial Messages */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              4. Marketing Communications &amp; WhatsApp Messaging
            </h2>
            <p className="text-sm text-slate-600 mb-2">
              When utilizing MyCRM to send bulk messages or emails to your leads, you agree to comply with all applicable telecommunications 
              and anti-spam regulations (including CAN-SPAM, TCPA, and Meta WhatsApp Business Policies). 
              You must honor all opt-out/STOP requests immediately.
            </p>
          </section>

          {/* Governing Law */}
          <section className="pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of California and applicable federal laws of the United States. 
              For questions regarding these terms, contact <a href="mailto:info@blueplanet.lk" className="text-blue-600 underline">info@blueplanet.lk</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
