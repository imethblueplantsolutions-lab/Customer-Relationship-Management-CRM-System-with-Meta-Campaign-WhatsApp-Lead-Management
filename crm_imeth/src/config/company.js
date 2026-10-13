/**
 * @file company.js
 * @description Centralized company and compliance contact configuration.
 * Satisfies CAN-SPAM Act (valid physical postal address) and DMCA Designated Agent disclosures.
 */

const COMPANY_CONFIG = {
  name: process.env.COMPANY_NAME || 'Blue Planet Solutions',
  // CAN-SPAM mandatory physical postal address
  postalAddress:
    process.env.COMPANY_POSTAL_ADDRESS ||
    'No. 58, Ideal Shopping Complex, Bauddhaloka Mawatha, Gampaha, Sri Lanka.',
  supportEmail: process.env.SUPPORT_EMAIL || 'info@blueplanet.lk',
  privacyEmail: process.env.PRIVACY_EMAIL || 'info@blueplanet.lk',
  dmcaEmail: process.env.DMCA_EMAIL || 'info@blueplanet.lk',
  dmcaAgentName: process.env.DMCA_AGENT_NAME || 'Copyright Compliance Officer',
  dmcaPhone: process.env.DMCA_PHONE || '(+94) 77 8651 776',
  website: process.env.COMPANY_WEBSITE || 'https://blueplanet.lk/branding/',
  dmcaRegistrationNumber: process.env.DMCA_REGISTRATION_NUMBER || '[PENDING_COPYRIGHT_GOV_REGISTRATION]',
};

module.exports = COMPANY_CONFIG;
