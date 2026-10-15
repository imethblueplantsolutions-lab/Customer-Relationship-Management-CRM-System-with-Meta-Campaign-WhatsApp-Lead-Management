const CRM_APP_URL =
  import.meta.env.VITE_CRM_APP_URL ||
  "https://customer-relationship-management-cr-eight.vercel.app";

/**
 * Redirects user from the static Vite marketing page directly into the Next.js signup flow
 * with pre-populated query parameters, eliminating double-entry friction.
 *
 * @param {Object} options
 * @param {string} [options.email=""] - Optional prefilled work email
 * @param {string} [options.plan="agency_growth"] - Target pricing tier
 */
export function redirectToCrmSignup({ email = "", plan = "agency_growth" } = {}) {
  const targetUrl = new URL("/login", CRM_APP_URL);
  targetUrl.searchParams.set("mode", "signup");
  targetUrl.searchParams.set("plan", plan);

  const trimmedEmail = email.trim();
  if (trimmedEmail) {
    targetUrl.searchParams.set("email", trimmedEmail);
  }

  window.location.assign(targetUrl.toString());
}

/**
 * Direct link to login for existing customers
 */
export function redirectToCrmLogin() {
  const targetUrl = new URL("/login", CRM_APP_URL);
  window.location.assign(targetUrl.toString());
}
