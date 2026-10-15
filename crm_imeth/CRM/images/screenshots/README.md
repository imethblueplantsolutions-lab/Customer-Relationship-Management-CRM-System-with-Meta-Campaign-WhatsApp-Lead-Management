# App Screenshots Directory

Place your high-resolution PNG or JPEG application screenshots in this directory.

### Recommended Dimensions:
- Resolution: `1600x1000` or `1920x1080` (16:10 or 16:9 aspect ratio)
- Format: `.png` or `.webp`

### How to use in `AppScreenshots/index.tsx`:
In `src/components/Home/AppScreenshots/index.tsx`, update the `APP_SCREENSHOTS` array:
```ts
{
  id: "admin-overview",
  title: "Centralized Visual Command Dashboard",
  badge: "Super Admin View",
  role: "System Authority & Governance",
  description: "...",
  imageSrc: "/images/screenshots/admin-dashboard.png", // <--- Add your image here
}
```
If `imageSrc` is set, the carousel will render your real screenshot image with crisp scaling and zoom. If omitted, it displays the built-in high-fidelity UI preview!
