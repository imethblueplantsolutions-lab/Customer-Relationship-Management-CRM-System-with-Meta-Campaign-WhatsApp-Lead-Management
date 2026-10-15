import React from "react";
import "./Features.css";
import { features } from "../../utils/constants";

const Features = () => {
  return (
    <section className="features" id="features">
      <div className="features__heading-container">
        <span className="features__badge">ENGINEERED FOR CLOSERS</span>
        <h2 className="h2 features__heading">
          Turn Ad Spend Into Revenue With{" "}
          <span className="features__text-gradient">MyCRM</span>
        </h2>
        <p className="text-reg features__subheading">
          Everything your sales reps and media buyers need to convert cold Meta ad traffic into booked consultations and paid invoices on WhatsApp.
        </p>
      </div>

      <div className="features__feature-container mobile-snap-carousel">
        {features.map((obj, i) => {
          return (
            <div className={`feature ${obj.gridArea} mobile-snap-card`} key={i}>
              <div className="feature__top">
                <span className="feature__icon-badge">{obj.icon}</span>
                {obj.badge && <span className="feature__pill">{obj.badge}</span>}
              </div>
              <h3 className="feature__heading">{obj.heading}</h3>
              <p className="text-reg feature__description">{obj.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Features;
