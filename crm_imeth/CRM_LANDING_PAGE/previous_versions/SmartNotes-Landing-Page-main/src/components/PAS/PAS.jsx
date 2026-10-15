import React from "react";
import "./PAS.css";
import RoiCalculator from "./RoiCalculator";

export default function PAS() {
  return (
    <section className="pas-section" id="solution">
      <div className="pas-container">
        {/* Header: Problem & Agitation */}
        <div className="pas-header">
          <span className="pas-tag">THE PROBLEM YOU FACE EVERY DAY</span>
          <h2 className="h2 pas-title">
            You Spend Thousands on Meta Ads.
            <br />
            <span className="pas-title-highlight">70% of Leads Vanish</span> Before Your Team Calls.
          </h2>
          <p className="text-reg pas-desc">
            Lead generation isn't broken. Your follow-up speed is. When a prospect submits a Facebook or
            Instagram form, their buying intent peaks in the first 5 minutes. Every minute of delay cuts
            conversion rates in half.
          </p>
        </div>

        {/* 3 Pain Points Grid */}
        <div className="pas-grid">
          <div className="pas-card">
            <div className="pas-card__icon">⏳</div>
            <h3 className="pas-card__heading">The 4-Hour Response Delay</h3>
            <p className="text-reg pas-card__text">
              Leads sit trapped in Facebook Ads Manager or delayed spreadsheet zaps. By the time your
              rep dials, the prospect doesn't even remember filling out the form.
            </p>
          </div>

          <div className="pas-card">
            <div className="pas-card__icon">📵</div>
            <h3 className="pas-card__heading">Spam Filters & Voicemail Graveyards</h3>
            <p className="text-reg pas-card__text">
              Cold calls get auto-blocked by iPhone spam screens. Follow-up emails land in the Promotions
              folder with a dismal 12% open rate. Ad budgets evaporate with zero ROI.
            </p>
          </div>

          <div className="pas-card pas-card--solution">
            <div className="pas-card__icon">⚡</div>
            <h3 className="pas-card__heading">The MyCRM WhatsApp Cure</h3>
            <p className="text-reg pas-card__text">
              Zero-second webhook routing pings your sales team instantly. Open a verified 2-way WhatsApp
              chat in 1-click and get a 94% open rate and 3.2x higher conversion rate.
            </p>
          </div>
        </div>

        {/* Interactive Ad Spend Leak Calculator */}
        <div className="pas-calculator-wrapper">
          <RoiCalculator />
        </div>
      </div>
    </section>
  );
}
