import React, { useState, useEffect } from "react";
import { redirectToCrmSignup } from "../utils/authRedirect";

export default function MobileStickyBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show bar after scrolling past the hero fold (450px)
      setIsVisible(window.scrollY > 450);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`mobile-sticky-cta ${isVisible ? "mobile-sticky-cta--visible" : ""}`}
      aria-hidden={!isVisible}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#F8FAFC" }}>
          14-Day Free Trial
        </span>
        <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
          No credit card required
        </span>
      </div>
      <button
        type="button"
        onClick={() => redirectToCrmSignup()}
        className="hero__submit-btn"
        style={{ width: "auto", height: "2.5rem", padding: "0 1.125rem", fontSize: "0.85rem" }}
      >
        Start Free →
      </button>
    </div>
  );
}
