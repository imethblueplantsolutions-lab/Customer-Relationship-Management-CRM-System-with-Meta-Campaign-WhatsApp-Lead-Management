import React from "react";
import "./FAQ.css";

const FAQ = ({ children }) => {
  return (
    <section className="faq" id="faq">
      <div className="faq__heading-section">
        <span className="faq__badge">OBJECTION HANDLING</span>
        <h2 className="h2 faq__heading">Got Questions? We Have Answers.</h2>
        <p className="text-reg faq__description">
          Everything you need to know about Meta ad webhook routing, WhatsApp Cloud API approvals, multi-tenant security, and our risk-free trial.
        </p>
      </div>
      {children}
    </section>
  );
};

export default FAQ;
