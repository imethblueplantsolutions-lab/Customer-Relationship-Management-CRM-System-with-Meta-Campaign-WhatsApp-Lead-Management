"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Do I need an approved Meta WhatsApp Business API account to start?",
    answer:
      "No. You can launch immediately using 1-click WhatsApp Web/App redirection on the Starter plan, or connect your official Meta WhatsApp Cloud API credentials for automated 0-second background drip sequences.",
  },
  {
    question: "Does BluePlanet CRM completely replace Zapier or Make.com?",
    answer:
      "Yes. BluePlanet CRM provides native, zero-latency Meta Lead Ads webhook endpoints out of the box. You eliminate third-party automation subscription fees and avoid webhook task limits.",
  },
  {
    question: "How does multi-agent routing and data isolation work for agencies?",
    answer:
      "Every workspace is protected by strict PostgreSQL tenant isolation and Role-Based Access Control (RBAC). Agency owners can manage multiple client sub-accounts and restrict sales reps to only their assigned leads.",
  },
  {
    question: "What happens after the 14-day free trial ends?",
    answer:
      "You can start your 14-day trial without entering a credit card. At the end of 14 days, you can pick a monthly or annual plan to keep your webhooks active, or export your lead data in one click.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 md:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 mb-3">
          Objection-Busting FAQ
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3.5">
        {FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.question}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                aria-expanded={isOpen}
                className="w-full min-h-[56px] px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm sm:text-base font-bold text-white">
                  {item.question}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              <div className="accordion-content" data-open={isOpen}>
                <div className="accordion-inner px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
