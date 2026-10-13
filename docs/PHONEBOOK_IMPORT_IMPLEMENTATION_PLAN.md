# 📱 BluePlanet CRM — Phone Book Contact Import & FAB Quick Actions

**Feature:** Direct Phone Book Contact Import & Mobile Speed Dial Action  
**Target:** Native Android (APK/AAB) & iOS (IPA) via Capacitor + Responsive Mobile Web  
**Status:** Implemented & Verified  

---

## 1. Overview & Visual Architecture

When users tap the Floating Action Button (`+` button) on mobile, the quick-action speed dial expands upwards with two tactile action pills:

```
[ 👤 + Add New Lead          ]  ← Primary: Expands inline manual lead injection form
[ 📒 Add Lead from Phone Book]  ← Directly Under: Opens native phonebook import sheet
[ ✕                           ]  ← Dark circular FAB trigger (toggles open/closed)
```

Additionally, inside the **Manual Lead Injection** form header on the leads page, an **"Add from Phone Book"** button allows quick contact import without returning to the main menu.

---

## 2. Speed Dial UI Integration (`MobileFAB.tsx`)

In [MobileFAB.tsx](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/crm-frontend-next/src/components/layout/MobileFAB.tsx), the speed-dial container stacks both actions smoothly with `+ Add New Lead` on top and `Add Lead from Phone Book` directly underneath:

```tsx
<div className="relative z-40 mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
  {/* Action 1: Add New Lead */}
  <button
    type="button"
    onClick={handleAddLead}
    className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-xl border border-slate-200/80 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer hover:border-brand-primary/40 hover:text-brand-primary"
  >
    <span>+ Add New Lead</span>
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
      <UserPlus className="h-4 w-4" />
    </span>
  </button>

  {/* Action 2: Add Lead from Phone Book (under Add New Lead) */}
  <button
    type="button"
    onClick={handleImportFromPhonebook}
    className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-xl border border-slate-200/80 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer hover:border-emerald-500/40 hover:text-emerald-700"
  >
    <span>Add Lead from Phone Book</span>
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <BookUser className="h-4 w-4" />
    </span>
  </button>
</div>
```

---

## 3. Capacitor Native Bridge & Permissions

### 3.1 Plugin Installation
```bash
cd crm-frontend-next
npm install @capacitor-community/contacts
npx cap sync
```

### 3.2 Android Permission Declaration (`AndroidManifest.xml`)
```xml
<!-- Phone Book / Contact Import -->
<uses-permission android:name="android.permission.READ_CONTACTS" />
```
*Note: We strictly omit `WRITE_CONTACTS` to avoid unnecessary Play Store audit triggers.*

### 3.3 iOS Usage Description (`Info.plist`)
```xml
<!-- Contacts Usage Justification -->
<key>NSContactsUsageDescription</key>
<string>BluePlanet CRM requires read access to your device contacts to allow importing prospects directly into your leads pipeline.</string>
```

---

## 4. Backend Bulk Import API (`leads.js`)

**Route:** `POST /api/leads/bulk-import`  
**Auth:** Bearer JWT (`ADMIN`, `TEAM_LEAD`, `AGENT`) + `x-tenant-id`  
**Payload:**
```json
{
  "contacts": [
    {
      "name": "Nimal Perera",
      "phoneNumber": "0770660647",
      "email": "nimal@example.com",
      "companyName": "Blue Planet"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "created": 1,
    "skipped": 0,
    "invalid": 0,
    "createdLeads": [...],
    "skippedDuplicates": [],
    "invalidContacts": []
  }
}
```

---

## 5. App Store & Privacy Compliance Checklist

- [x] **Google Play Data Safety:** Declare "Contacts — Contact info" collected for App Functionality.
- [x] **Apple Privacy Nutrition Label:** Declare "Contacts" data type linked to user account.
- [x] **Tenant Scoping:** All imports are isolated to the active tenant (`tenantId`) and assigned to the importing agent.
- [x] **Safe Fallback:** Works on desktop web, mobile web browsers, and native Capacitor APK/IPA wrappers.
