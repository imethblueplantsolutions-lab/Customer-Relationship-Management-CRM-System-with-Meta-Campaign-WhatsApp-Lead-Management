// Trust Badges for the Hero Trust Bar (Replaced developer stack jargon with buyer outcomes)
const trustBadges = [
  {
    icon: "⚡",
    title: "< 1s Routing",
    subtitle: "Lead-to-WhatsApp",
  },
  {
    icon: "🛡️",
    title: "Zero Ban Risk",
    subtitle: "Official Meta Cloud API",
  },
  {
    icon: "🔒",
    title: "100% Isolated",
    subtitle: "Agency Sub-Accounts",
  },
  {
    icon: "📈",
    title: "3.2x Higher",
    subtitle: "Lead Contact Rate",
  },
  {
    icon: "⏱️",
    title: "2-Min Setup",
    subtitle: "Zero Code Needed",
  },
];

// 6 Core Features aligned with Meta Campaign & WhatsApp Lead Engine
const features = [
  {
    gridArea: "tl",
    icon: "⚡",
    heading: "0-Second Meta Ad Webhook Sync",
    badge: "INSTANT INGESTION",
    description: `Direct webhook listeners capture Facebook & Instagram Lead Ad submissions immediately with complete campaign, adset, and ad creative attribution. No Zapier required.`,
  },
  {
    gridArea: "tr",
    icon: "💬",
    heading: "Native 2-Way WhatsApp Inbox",
    badge: "1-CLICK ENGAGEMENT",
    description: `Launch WhatsApp conversations straight from the lead card with pre-approved message templates. Incoming replies stream live into the customer activity thread in real time.`,
  },
  {
    gridArea: "bl",
    icon: "📊",
    heading: "Multi-Stage Kanban Pipeline",
    badge: "DEAL FLOW",
    description: `Visually drag and drop leads through customizable sales stages: NEW, CONTACTED, QUALIFIED, CONVERTED, and LOST. Track pipeline revenue and rep performance effortlessly.`,
  },
  {
    gridArea: "blm",
    icon: "📜",
    heading: "Real-Time Activity Timeline",
    badge: "FULL AUDIT TRAIL",
    description: `Socket-powered timeline automatically records every call, meeting, WhatsApp exchange, and internal team note with inline editing for seamless collaboration.`,
  },
  {
    gridArea: "brm",
    icon: "🔔",
    heading: "Automated 24h Follow-up Reminders",
    badge: "ZERO LEAKAGE",
    description: `Schedule tasks and smart follow-up alerts with 24-hour time pickers. Ensure high-intent prospects are never abandoned or forgotten by busy sales reps.`,
  },
  {
    gridArea: "br",
    icon: "🏢",
    heading: "Multi-Tenant Agency Architecture",
    badge: "CLIENT-READY",
    description: `Isolated client workspaces, dedicated role-based permissions, and individual lead routing rules. Perfect for marketing agencies managing multiple ad accounts.`,
  },
];

// Transparent Pricing Plans
const pricingData = [
  {
    id: "solo_starter",
    darkMode: false,
    plan: "Solo Starter",
    planPriceMonthly: 29,
    planPriceYearly: 22,
    badge: "FOR SOLO CLOSERS",
    description: "Ideal for independent media buyers and single-operator businesses running Meta ads.",
    bullets: [
      "1 Team Seat",
      "Up to 500 Active Leads",
      "1 Connected WhatsApp Number",
      "Instant Meta Ads Webhook Sync",
      "Kanban Pipeline & Activity Log",
      "Email & Chat Support",
    ],
    CallToAction: "Start 14-Day Free Trial",
  },
  {
    id: "agency_growth",
    darkMode: true,
    plan: "Agency Growth",
    planPriceMonthly: 79,
    planPriceYearly: 59,
    badge: "MOST POPULAR",
    description: "Engineered for scaling agencies and sales teams closing high-ticket ad leads.",
    bullets: [
      "5 Team Seats (Multi-User)",
      "Unlimited Active Leads",
      "3 Connected WhatsApp Numbers",
      "Automated 24h Task Reminders",
      "Full Activity Timeline & Audit Logs",
      "Sub-Account Client Separation",
      "Priority 24/7 SLA Support",
    ],
    CallToAction: "Start 14-Day Free Trial",
  },
  {
    id: "scale_enterprise",
    darkMode: false,
    plan: "Scale / Enterprise",
    planPriceMonthly: 199,
    planPriceYearly: 149,
    badge: "HIGH-VOLUME",
    description: "For established performance marketing agencies with high-volume lead volume.",
    bullets: [
      "Unlimited Team Seats",
      "Unlimited WhatsApp Numbers",
      "Dedicated High-Throughput Webhooks",
      "Custom Row-Level Security Isolation",
      "Custom Onboarding & Migration",
      "Dedicated Slack Channel Support",
    ],
    CallToAction: "Start 14-Day Free Trial",
  },
];

// 4 Distinct Outcome-Driven Testimonials (List Kit Continuous Stream Model)
const testimonials = [
  {
    id: 1,
    quote:
      "We cut our lead response time from 4 hours to 35 seconds. Our lead contact rate jumped from 38% to 91% in the first week of switching to MyCRM.",
    author: "Marcus Vance",
    organization: "Founder @ PeakScale Agency",
    resultTag: "🚀 3.2x Higher Contact Rate",
  },
  {
    id: 2,
    quote:
      "Ditching clumsy Zapier-to-spreadsheet setups for this native Meta + WhatsApp pipeline saved our team 15 hours a week and doubled our closed deals.",
    author: "Elena Rostova",
    organization: "Growth Director @ AlphaMedia",
    resultTag: "⏱️ 15 Hours Saved / Week",
  },
  {
    id: 3,
    quote:
      "The 1-click WhatsApp messaging right from the Kanban card is pure genius. Our sales reps close twice as many high-ticket clients every day.",
    author: "Tariq Al-Mansoor",
    organization: "Head of Sales @ RealEstateX",
    resultTag: "📈 2x Closing Velocity",
  },
  {
    id: 4,
    quote:
      "Paid for itself within 48 hours of turning our Facebook ads live. The instant lead routing alone recovered $14,000 in pipeline we would have lost.",
    author: "Sarah Jenkins",
    organization: "Performance Consultant @ EcomScale",
    resultTag: "💰 12x Return on Ad Spend",
  },
];

// 5 Objection-Busting FAQs
const faqItems = [
  {
    id: 1,
    question: "Do I need an approved WhatsApp Business API account to use this?",
    answerHeading: "How WhatsApp integration works:",
    answer: `You can start immediately with 1-click WhatsApp Web / App redirection without waiting for approvals! When you are ready for high-volume automated messaging, you can easily connect your official Meta WhatsApp Business Cloud API with zero code.`,
  },
  {
    id: 2,
    question: "Does this replace Zapier or Make.com?",
    answerHeading: "Direct native webhook ingestion:",
    answer: `Yes! MyCRM has direct webhook endpoints built specifically for Meta Lead Ads (Facebook & Instagram). When a user submits an ad form, it hits MyCRM with 0.18s latency. You eliminate third-party Zapier subscription fees and eliminate webhook delivery failures.`,
  },
  {
    id: 3,
    question: "How does the 14-day free trial work?",
    answerHeading: "100% Risk-Free Guarantee:",
    answer: `You get immediate, unrestricted access to all Agency Growth features for 14 days without entering credit card details. You only enter payment details if you decide MyCRM has earned its place in your sales stack. Cancel anytime in 1 click.`,
  },
  {
    id: 4,
    question: "Can I invite my sales reps and assign leads automatically?",
    answerHeading: "Team seats and lead routing:",
    answer: `Yes! The Agency Growth and Enterprise plans include multi-seat team management with granular role permissions. You can assign incoming Meta leads to specific reps, monitor individual response times, and collaborate with internal notes on every deal card.`,
  },
  {
    id: 5,
    question: "Is client and lead data isolated and secure?",
    answerHeading: "Enterprise-grade client data separation:",
    answer: `Absolutely. MyCRM is built with strict database-level client isolation. Your agency clients and leads remain in secure, isolated workspaces with 256-bit encryption in transit and at rest. Your data is never shared or commingled.`,
  },
];

export { trustBadges, features, pricingData, testimonials, faqItems };
