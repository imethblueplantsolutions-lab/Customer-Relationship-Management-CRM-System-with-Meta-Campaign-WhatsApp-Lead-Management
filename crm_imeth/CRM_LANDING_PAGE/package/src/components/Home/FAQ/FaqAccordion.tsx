"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does MyCrm stop leads from getting lost or passed around?",
    answer:
      "Instead of forwarding leads across unmonitored spreadsheets, emails, or personal chat groups, MyCrm immediately brings all lead details into a visual command dashboard. Team Leads can instantly assign leads to specific sales reps with clear ownership and real-time status tracking.",
  },
  {
    question: "What are the distinct access permissions for Admins, Team Leads, and Sales Agents?",
    answer:
      "Admins hold full system authority to manage employee accounts, configure tenant settings, and oversee integrations. Team Leads oversee team performance, monitor real-time agent activity, and dynamically assign or reassign leads. Sales Agents focus strictly on their assigned prospects, logging customer notes, and scheduling follow-ups.",
  },
  {
    question: "How does multi-tenant isolation protect our company's confidential customer data?",
    answer:
      "MyCrm enforces strict tenant boundaries at the database layer using cryptographic row-level security. Your customer data, lead notes, and employee details are completely isolated and inaccessible to any other organization or unauthorized role tier.",
  },
  {
    question: "Can multiple team members access MyCrm simultaneously from different devices?",
    answer:
      "Yes! MyCrm natively supports multi-device concurrent logins. Sales reps and managers can access the platform simultaneously from desktop web browsers, iPad/tablets, and mobile applications with zero session conflicts or data overrides.",
  },
  {
    question: "Can Team Leads reassign leads if an agent is overloaded or away?",
    answer:
      "Absolutely. Team Leads have real-time visibility into each agent's active lead count and status. If an agent is in a call or unavailable, a Team Lead can reassign any lead to another rep in a single click.",
  },
  {
    question: "Can I use MyCrm for free without entering a credit card?",
    answer:
      "Yes! You can get started immediately by creating a login account with our Free Access plan. The free plan allows you to add 1 Team Lead and 1 Sales Agent with complete visual dashboard tracking and multi-device access. When your sales team expands, you can upgrade to Professional in one click.",
  },
];

export default function FaqAccordion() {
  return (
    <section id="faq" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 md:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B7BED]/10 text-[#1B7BED] dark:bg-[#18DBF5]/10 dark:text-[#18DBF5] border border-[#1B7BED]/20 dark:border-[#18DBF5]/25 mb-3">
          <Icon icon="solar:question-circle-bold" className="w-4 h-4" />
          Clear Answers
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A2540] dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-[#476685] dark:text-slate-400 text-sm sm:text-base mt-2">
          Everything you need to know about MyCrm, roles, multi-tenancy, and team access.
        </p>
      </div>

      <div className="space-y-3.5">
        {FAQS.map((item, idx) => (
          <details
            key={item.question}
            open={idx === 0}
            className="group bg-[#DEEEFD]/70 dark:bg-slate-900/90 border border-[#C8E0F8] dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-xs"
          >
            <summary className="w-full py-4.5 px-5 sm:px-6 flex items-center justify-between gap-4 text-left cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden focus:outline-none">
              <span className="text-sm sm:text-base font-bold text-[#0A2540] dark:text-white group-hover:text-[#1B7BED] dark:group-hover:text-[#18DBF5] transition-colors">
                {item.question}
              </span>
              <span className="w-8 h-8 rounded-xl bg-white/70 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-[#C8E0F8] dark:border-slate-700/80 transition-transform duration-300 group-open:rotate-180">
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#1B7BED] dark:text-[#18DBF5]"
                />
              </span>
            </summary>

            <div className="px-5 sm:px-6 pb-5 pt-2 text-xs sm:text-sm text-[#476685] dark:text-slate-400 leading-relaxed border-t border-[#C8E0F8]/80 dark:border-slate-800/80 animate-fade-in">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
