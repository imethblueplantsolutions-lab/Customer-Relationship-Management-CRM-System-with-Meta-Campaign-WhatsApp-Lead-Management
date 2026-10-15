import React from "react";
import "./App.css";

// fonts
import "../../fonts/fonts.css";

// components
import Page from "../Page/Page";
import Header from "../Header/Header";
import Navigation from "../Navigation/Navigation";
import Hero from "../Hero/Hero";
import Logos from "../Logos/Logos";
import PAS from "../PAS/PAS";
import Features from "../Features/Features";
import Video from "../Video/Video";
import Pricing from "../Pricing/Pricing";
import FAQ from "../FAQ/FAQ";
import Accordion from "../Accordion/Accordion";
import CTA from "../CTA/CTA";
import Footer from "../Footer/Footer";
import Testimonial from "../Testimonial/Testimonial";
import MobileStickyBar from "../MobileStickyBar";

// data
import { testimonials } from "../../utils/constants";

const App = () => {
  return (
    <Page>
      {/* 1. Header & Navigation + Hero */}
      <Header>
        <Navigation />
        <Hero />
      </Header>

      {/* 2. Trust Bar (Outcome & Compliance Badges) */}
      <Logos />

      {/* 3. Problem, Agitation & Interactive Ad-Spend Leak Calculator */}
      <PAS />

      {/* 4. Testimonial #1: Empirical Proof of Response Time Improvement */}
      <Testimonial {...testimonials[0]} />

      {/* 5. Features Grid (Bento on desktop, horizontal snap carousel on mobile) */}
      <Features />

      {/* 6. Testimonial #2: Replacing Clumsy Zapier Setups */}
      <Testimonial {...testimonials[1]} />

      {/* 7. Visual Proof & Interactive Walkthrough Demo */}
      <Video />

      {/* 8. Testimonial #3: Doubled Sales Closing Velocity */}
      <Testimonial {...testimonials[2]} />

      {/* 9. Transparent Pricing Grid (Monthly/Yearly 25% Off) */}
      <Pricing />

      {/* 10. Testimonial #4: Rapid ROI / Recovered Pipeline */}
      <Testimonial {...testimonials[3]} />

      {/* 11. Objection-Busting FAQ Accordion */}
      <FAQ>
        <Accordion />
      </FAQ>

      {/* 12. Bottom High-Urgency CTA Banner */}
      <CTA />

      {/* 13. Clean Minimal Footer */}
      <Footer />

      {/* 14. Sticky Mobile Thumb-Zone Conversion Bar (< 768px) */}
      <MobileStickyBar />
    </Page>
  );
};

export default App;
