# SaaS Landing Page Implementation Plan (Next.js 15 App Router) — Version 2.2
**Target Project:** `crm_imeth/CRM_LANDING_PAGE/package`  
**Product Focus:** BluePlanet CRM — Meta Campaign & WhatsApp Multi-Agent CRM System  
**Framework Stack:** Next.js 15.3.2, React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion 11), @iconify/react

---

## 1. Critical Bug Fixes & Architectural Resolutions

| Flaw Identified | Root Cause | Implemented Resolution |
| :--- | :--- | :--- |
| **1.1 Tailwind v4 `.hidden` Class Collision** | Tailwind v4 `.hidden` sets `display: none !important`, killing CSS animations immediately. | Replaced custom `.hidden` with `data-visible="true" / "false"` and `aria-hidden` attributes for [MobileStickyBar.tsx](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/CRM_LANDING_PAGE/package/src/components/MobileStickyBar/MobileStickyBar.tsx). |
| **1.2 CSS Transitions Fighting Framer Motion** | Combining CSS `transition: transform` with Framer Motion `y`/`x` updates causes JS/CSS frame collision (< 20 FPS). | Strictly separated concerns in [BentoFeatures.tsx](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/CRM_LANDING_PAGE/package/src/components/Home/BentoFeatures/BentoFeatures.tsx): outer `<motion.div>` handles scroll-reveal; inner `<div>` handles hover micro-interactions via CSS. |
| **1.3 Permanent `will-change` Layer Allocation** | Static `will-change` on non-composited properties (`box-shadow`, `background-color`) exhausts mobile VRAM. | Removed static declarations in [src/Style/index.css](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/CRM_LANDING_PAGE/package/src/Style/index.css). Scoped `transform` hardware acceleration strictly to `:hover` and `:active` on pointer devices. |
| **1.4 Psychological Funnel Sequence** | Disconnected narrative arc between pain agitation and product capabilities. | Arranged funnel in optimal conversion order: **Hero ➔ Social Proof Metrics ➔ PAS (Agitate Pain) ➔ Interactive Sandbox (Test the Cure) ➔ Bento Features (Architectural Depth) ➔ Sticky ROI Calculator ➔ Segmented Pricing ➔ Zero-Jank FAQ ➔ Bottom Urgency CTA ➔ Mobile Sticky Bar**. |
| **1.5 Server Component Boundary & SEO** | Adding `"use client"` to `page.tsx` breaks static metadata generation and inflates JS payload. | Kept [src/app/page.tsx](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/CRM_LANDING_PAGE/package/src/app/page.tsx) as a pure React Server Component (RSC), hydrating only interactive client islands. |
| **1.6 Fixed Header Anchor Clipping** | Fixed glassmorphic navigation header clips section headings when clicking navbar anchors. | Added `scroll-mt-24` to all section root elements (`#problem`, `#demo`, `#features`, `#roi-calculator`, `#pricing`, `#faq`). |
| **1.7 Mobile Sticky Bar Footer Overlap** | Fixed bottom sticky bar covers bottom content on viewports < 768px. | Added `pb-24 md:pb-0` to the root `<main>` container in `page.tsx`. |
| **1.8 @iconify/react Network Fetch CLS** | Above-the-fold icons dynamically fetched from `api.iconify.design` cause layout shifts and hydration flicker. | Replaced above-the-fold navigation logo, CTA arrow, and demo play button with zero-CLS inline SVGs with explicit pixel constraints (`w-5 h-5 shrink-0`). |
| **1.9 Cross-App URL Handoff & Suspense** | Navigating to `?mode=signup` from landing page buttons can fail static compilation if un-suspended. | Verified [crm-frontend-next/src/app/login/page.tsx](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/crm-frontend-next/src/app/login/page.tsx) parses `modeParam === "signup"` inside `<Suspense fallback={...}>` to automatically activate the Sign Up tab. |
| **1.10 Windows FAT32 Node 24 `readlink` Bug** | Node.js 24 libuv maps FAT32 `ERROR_INVALID_FUNCTION` on non-symlinks to `EISDIR`, crashing Webpack. | Developed [patch-fat32.js](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/CRM_LANDING_PAGE/package/patch-fat32.js) which maps `EISDIR` ➔ `EINVAL`, preloaded into `npm run build` and `npm run dev`. |

---

## 2. Pre-Deployment Build Verification Results

* **TypeScript Compilation (`npx tsc --noEmit`):**  
  `Exit Code: 0` — Zero type mismatches across all React 19 and Next.js 15 components.
* **Production Static Export (`npm run build`):**  
  `Exit Code: 0` — Compiled successfully in 26.0s. All 12 static pages prerendered (`○ /` output size: 5.75 kB, First Load JS: 152 kB).

---

## 3. Sprint Status & Next Milestone

| Module / Epic | Target Repository | Status |
| :--- | :--- | :--- |
| **19-Point Security Audit (Vectors 1–17)** | `crm_imeth` & `crm-frontend-next` | ✅ Completed & Verified |
| **PostgreSQL `bytea` Media Storage** | `crm_imeth` | ✅ Completed & Verified |
| **50/50 Split-Screen Login UI/UX** | `crm-frontend-next` | ✅ Completed & Verified |
| **Next.js 15 Conversion Landing Page** | `CRM_LANDING_PAGE/package` | ✅ **Compiled & Verified (Exit Code: 0)** |
| **24/7 Zero-Cost Backend Deployment** | `crm_imeth` (Express / BullMQ / Socket.IO) | ⏳ **Next Milestone** (Render + Supabase + Upstash) |
