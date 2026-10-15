import React from "react";
import "./Testimonial.css";
import doubleQuote from "../../assets/double-quote.svg";

const Testimonial = ({ quote, author, organization, resultTag, children }) => {
  return (
    <section className="testimonial">
      <div className="testimonial__container">
        <img className="testimonial__quotes" src={doubleQuote} alt="quote" />

        {resultTag && (
          <div className="testimonial__result-pill">
            <span>{resultTag}</span>
          </div>
        )}

        {quote ? (
          <>
            <h5 className="h5 testimonial__heading">"{quote}"</h5>
            <div className="testimonial__author-section">
              <span className="testimonial__author">{author}</span>
              <span className="testimonial__separator">·</span>
              <span className="testimonial__organization">{organization}</span>
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default Testimonial;
