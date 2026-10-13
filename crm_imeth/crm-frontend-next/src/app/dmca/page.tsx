import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Mail, MapPin, Phone, AlertCircle, FileCheck, Ban } from "lucide-react";

export const metadata = {
  title: "DMCA Copyright Notice & Takedown Policy | MyCRM",
  description: "Official DMCA designated agent information, copyright infringement notification procedures, counter-notification steps, and repeat infringer termination policy.",
};

export default function DmcaPolicyPage() {
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
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                DMCA Copyright Policy &amp; Takedown Procedure
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Pursuant to the Digital Millennium Copyright Act (17 U.S.C. &sect; 512)
              </p>
            </div>
          </div>
        </div>

        {/* Notice of Safe Harbor */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-sm text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 mb-1">Safe Harbor Statement</p>
          MyCRM respects the intellectual property rights of others and complies with the safe harbor provisions of the Digital Millennium Copyright Act (&quot;DMCA&quot;). 
          As an online service provider, our policy is to expeditiously disable access to or remove user-uploaded material (such as lead attachments, documents, or avatars) 
          that is claimed to be infringing, and to terminate accounts of repeat infringers in accordance with 17 U.S.C. &sect; 512(i).
        </div>

        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Designated DMCA Agent */}
          <section className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-blue-950 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Designated DMCA Agent Contact Information
            </h2>
            <p className="text-xs sm:text-sm text-blue-900 mb-4">
              All notifications of claimed copyright infringement must be sent to our Designated Copyright Agent:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-800 bg-white p-4 rounded-xl border border-blue-100">
              <div>
                <span className="font-semibold text-slate-500 block text-[11px]">Designated Agent Name:</span>
                <span className="font-medium text-slate-900">Copyright Compliance Officer</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[11px]">Organization:</span>
                <span className="font-medium text-slate-900">Blue Planet Solutions</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-500 block text-[11px]">Physical Postal Address:</span>
                  <span>No. 58, Ideal Shopping Complex, Bauddhaloka Mawatha, Gampaha, Sri Lanka.</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="mailto:info@blueplanet.lk" className="text-blue-600 font-medium hover:underline">
                    info@blueplanet.lk
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>(+94) 77 8651 776</span>
                </div>
              </div>
            </div>
          </section>

          {/* Submitting a Takedown Notice */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
              How to Submit a Valid Notice of Claimed Infringement
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              Pursuant to 17 U.S.C. &sect; 512(c)(3), a valid DMCA notification must include substantially the following elements:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>
                <strong>Physical or Electronic Signature</strong> of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </li>
              <li>
                <strong>Identification of the Copyrighted Work</strong> claimed to have been infringed, or if multiple works, a representative list of such works.
              </li>
              <li>
                <strong>Identification of the Allegedly Infringing Material</strong> and information reasonably sufficient to permit us to locate the material (e.g., file name, attachment ID, or specific URL).
              </li>
              <li>
                <strong>Contact Information</strong> reasonably sufficient to permit us to contact you (address, telephone number, and email address).
              </li>
              <li>
                <strong>Good Faith Statement:</strong> &quot;I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.&quot;
              </li>
              <li>
                <strong>Statement Under Penalty of Perjury:</strong> &quot;The information in this notification is accurate, and under penalty of perjury, I am the copyright owner or authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.&quot;
              </li>
            </ol>
          </section>

          {/* Counter-Notification Procedure */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              Counter-Notification Procedure (&sect; 512(g))
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              If an account holder believes their uploaded content was removed or disabled as a result of mistake or misidentification, 
              they may submit a written Counter-Notification to our Designated Agent. The counter-notice must include the user&apos;s physical signature, 
              identification of the removed material, a statement under penalty of perjury that the material was removed by mistake, 
              and consent to federal court jurisdiction.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Upon receipt of a valid counter-notification, we will forward it to the original complaining party. If no federal lawsuit is filed within 
              10 to 14 business days, access to the material may be restored.
            </p>
          </section>

          {/* Repeat Infringer Policy */}
          <section className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5">
            <h2 className="text-base sm:text-lg font-bold text-rose-950 mb-2 flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-600" />
              Repeat Infringer Policy (Mandatory Termination)
            </h2>
            <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
              Pursuant to 17 U.S.C. &sect; 512(i)(1)(A), MyCRM maintains a strict policy to terminate user accounts determined to be repeat infringers. 
              Our system tracks verified infringement strikes against user accounts. A user who accumulates three (3) verified copyright infringement strikes 
              will be permanently banned from the service and all active session credentials will be revoked immediately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
