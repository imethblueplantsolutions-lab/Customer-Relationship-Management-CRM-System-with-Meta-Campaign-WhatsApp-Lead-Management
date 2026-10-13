import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, MapPin, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | MyCRM",
  description: "Enterprise privacy policy, COPPA compliance disclosures, GDPR rights, CAN-SPAM marketing disclosures, and DMCA copyright policies.",
};

export default function PrivacyPolicyPage() {
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
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Privacy Policy & Legal Disclosures
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Last updated: October 2026 &bull; Effective Date: Immediately
              </p>
            </div>
          </div>
        </div>

        {/* Overview Box */}
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-5 mb-10 text-sm text-blue-900 leading-relaxed">
          <p className="font-semibold mb-1">Enterprise Privacy Commitment</p>
          This Privacy Policy governs your use of <strong>MyCRM</strong> (&quot;the Service&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;). 
          We are committed to transparent data practices, rigorous tenant isolation, and strict compliance with global privacy regulations, 
          including COPPA, GDPR, CIPA, CAN-SPAM, the California Automatic Renewal Law (ARL), and the Digital Millennium Copyright Act (DMCA).
        </div>

        <div className="space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          {/* 1. COPPA Disclosures */}
          <section id="coppa" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                1
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Children&apos;s Online Privacy Protection (COPPA Compliance)
              </h2>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 mb-3 text-amber-900 text-sm">
              <strong className="block mb-1 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Strict Age Prohibition &mdash; The Service is Not for Children Under 13
              </strong>
              MyCRM is an enterprise B2B Customer Relationship Management tool designed solely for business professionals. 
              Under no circumstances is this service directed to or intended for use by children under the age of 13.
            </div>
            <p className="mb-2 text-sm text-slate-600">
              We do not knowingly collect, solicit, or maintain personal information from individuals under the age of 13. 
              Our registration procedures feature mandatory age-verification confirmations. If we become aware that we have collected personal data 
              from a child under 13 without verified parental consent, we will take immediate steps to delete such data from our database 
              and permanently terminate the account.
            </p>
            <p className="text-sm text-slate-600">
              Parents or legal guardians who suspect that a minor has submitted personal information may contact our Privacy Officer at{" "}
              <a href="mailto:info@blueplanet.lk" className="text-blue-600 underline font-medium">
                info@blueplanet.lk
              </a> for immediate review and deletion.
            </p>
          </section>

          {/* 2. GDPR & Third-Party Data Transfers */}
          <section id="gdpr" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                European Privacy Rights (GDPR) &amp; Third-Party Services
              </h2>
            </div>
            <p className="mb-3 text-sm text-slate-600">
              If you reside in the European Economic Area (EEA), United Kingdom, or Switzerland, you have rights under GDPR, including 
              the right to access, rectify, port, restrict, or erase your personal data.
            </p>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs sm:text-sm">
              <p className="font-semibold text-slate-800">Third-Party Data Processors &amp; Requests:</p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                <li>
                  <strong>Typography &amp; Fonts:</strong> All fonts (such as Inter) are automatically self-hosted locally on our application bundle via Next.js. No visitor IP addresses are transmitted to Google Fonts servers at runtime.
                </li>
                <li>
                  <strong>Google Identity Services (OAuth):</strong> Optional Google sign-in scripts are loaded only after your explicit consent or upon clicking &quot;Sign in with Google&quot; (Click-to-Load).
                </li>
                <li>
                  <strong>Meta WhatsApp Cloud API:</strong> When sending or receiving customer messages, customer phone numbers and templated messages are processed through Meta Platforms Ireland Ltd. pursuant to Meta Business Terms.
                </li>
                <li>
                  <strong>Transactional Email Delivery:</strong> System emails (OTP, account invitations, notices) are processed through verified SMTP / Resend servers with TLS encryption.
                </li>
              </ul>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              You can adjust or revoke your cookie choices at any time via the cookie settings on our website.
            </p>
          </section>

          {/* 3. CIPA & Wiretapping Compliance */}
          <section id="cipa" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Communications &amp; Recording Privacy (CIPA Compliance)
              </h2>
            </div>
            <p className="mb-2 text-sm text-slate-600">
              Pursuant to the California Invasion of Privacy Act (Cal. Penal Code &sect; 631) and related state wiretapping statutes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 mb-3">
              <li>
                <strong>Sensitive Input Masking:</strong> All passwords, tokens, and credentials in our forms feature automated privacy masking (<code>data-private=&quot;true&quot;</code>) to prevent third-party capture.
              </li>
              <li>
                <strong>No Unauthorized Keystroke Recording:</strong> We do not deploy third-party keyloggers, unconsented session-replay trackers, or unauthorized pen-register tools.
              </li>
              <li>
                <strong>Business Records:</strong> Inbound and outbound WhatsApp communications and agent activity logs are recorded solely for legitimate business communications, audit trails, and contract fulfillment.
              </li>
            </ul>
          </section>

          {/* 4. CAN-SPAM Compliance */}
          <section id="can-spam" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                4
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Marketing Communications &amp; Opt-Out (CAN-SPAM Act)
              </h2>
            </div>
            <p className="mb-3 text-sm text-slate-600">
              We strictly comply with the Controlling the Assault of Non-Schenectady and Marketing Act (15 U.S.C. 7701 et seq.):
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Clear Sender Identity:</strong> All marketing emails accurately identify our sender name and domain without misleading subject lines.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Physical Postal Address:</strong> Every commercial message includes our valid postal address: <code className="bg-white px-1.5 py-0.5 border rounded text-slate-700">No. 58, Ideal Shopping Complex, Bauddhaloka Mawatha, Gampaha, Sri Lanka.</code></span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Immediate Unsubscribe:</strong> Every commercial email contains a functioning one-click unsubscribe link. All opt-out requests are processed immediately and enforced across all outreach workers.</span>
              </div>
            </div>
          </section>

          {/* 5. California ARL (Recurring Subscriptions) */}
          <section id="california-arl" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                5
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Recurring Subscriptions &amp; Automatic Renewal Terms (California ARL)
              </h2>
            </div>
            <p className="mb-2 text-sm text-slate-600">
              Pursuant to the California Automatic Renewal Law (Cal. Bus. &amp; Prof. Code &sect;&sect; 17600&ndash;17606):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 mb-3">
              <li>
                <strong>Clear Recurring Terms:</strong> Before ordering, we prominently disclose the recurring fee, billing frequency, and next scheduled billing date in visual proximity to the payment button.
              </li>
              <li>
                <strong>Renews Until Cancelled:</strong> Paid subscriptions automatically renew each monthly or annual billing cycle until cancelled by you.
              </li>
              <li>
                <strong>Straightforward Online Cancellation:</strong> You can cancel your subscription at any time online with zero hassle by navigating to <strong>Settings &gt; Billing &gt; Cancel Subscription</strong>. We do not require you to call a phone number or speak with a representative.
              </li>
              <li>
                <strong>Acknowledgment Notice:</strong> Immediately upon subscription or renewal, we send an email confirmation detailing your plan terms and cancellation link.
              </li>
            </ul>
          </section>

          {/* 6. DMCA Safe Harbor */}
          <section id="dmca" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                6
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                User Content, DMCA Safe Harbor &amp; Repeat Infringer Policy
              </h2>
            </div>
            <p className="mb-2 text-sm text-slate-600">
              Users may upload files, attachments, and profile avatars to the platform. We operate in full compliance with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512).
            </p>
            <p className="mb-3 text-sm text-slate-600">
              If you believe material hosted on our service infringes your copyright, please consult our designated{" "}
              <Link href="/dmca" className="text-blue-600 underline font-semibold">
                DMCA Copyright Policy &amp; Takedown Instructions
              </Link>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm">
              <strong className="block text-slate-800 mb-1">Repeat Infringer Policy:</strong>
              We will promptly terminate the accounts of users who are found to be repeat copyright infringers (3 verified infringement strikes), revoking all access tokens.
            </div>
          </section>

          {/* Contact Information */}
          <section className="pt-6 border-t border-slate-200 text-xs sm:text-sm text-slate-600 space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Contact Our Privacy Office</h3>
            <p>For any privacy inquiries, data subject access requests, or COPPA deletion notices:</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href="mailto:info@blueplanet.lk" className="text-blue-600 font-medium hover:underline">
                  info@blueplanet.lk
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>No. 58, Ideal Shopping Complex, Bauddhaloka Mawatha, Gampaha, Sri Lanka.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
