# Work Plan: Phase 6 — PWA Installation & Offline Support

## 0) Orientation
- Read: `tasks/01-product-and-stack.md` §3-4 (PWA requirements, iPhone limitations), `tasks/05-visual-phases-delivery.md` §18-19 (visual design, acceptance criteria for PWA)
- Anchor context: `docs/index.md` → PWA config lives in `src/pwa/manifest.ts` (planned)
- Dependency: **Phase 5 completed** (full app functional: dashboard, operations, plan, import, backup).
- Current state: `vite-plugin-pwa` and `workbox-*` packages are installed (Phase 0) but not configured. No manifest, no service worker registration.

## 1) Outcome
- Goal: App is installable as a PWA on iPhone Safari and works offline after first load.
- Success criteria:
  - App can be added to Home Screen via Safari → Share → Add to Home Screen.
  - App launches in standalone mode (no Safari chrome) from Home Screen icon.
  - Dark splash screen shows during launch.
  - App shell (HTML/CSS/JS) loads from service worker cache when offline.
  - Dashboard renders with last-known data from localStorage when offline.
  - `npm run build` produces valid dist with `manifest.webmanifest` and service worker.
  - `make preflight` passes.

## 2) Scope
- In scope:
  - `vite-plugin-pwa` configuration in `vite.config.ts`:
    - `registerType: 'autoUpdate'`
    - `manifest`: name=Денежка, short_name=Денежка, theme_color=#090d12, background_color=#090d12, display=standalone, icons (192px and 512px PNG)
    - `workbox`: `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`, `runtimeCaching` for Google Fonts (staleWhileRevalidate)
  - App icon: generate a simple SVG-based icon (M letter on dark bg) and export to 192px and 512px PNG. Place in `public/icons/`.
  - Favicon: `public/favicon.svg` and `public/favicon.ico`.
  - `apple-touch-icon` in `index.html`: `<link rel="apple-touch-icon" href="/icons/icon-192.png">`
  - `apple-mobile-web-app-capable` meta tag in `index.html`: `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `apple-mobile-web-app-status-bar-style` meta tag: `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - Test: HTTPS deployment (Netlify/Vercel drop, or local `vite preview --host` with ngrok for iPhone testing).
- Out of scope:
  - Push notifications.
  - Background sync.
  - Periodic background import.
  - iOS-specific splash screen configuration (beyond meta tags).
  - Cache-first strategy for data (app is local-first, data comes from localStorage, service worker only caches app shell).
- Assumptions / open questions:
  - Assumption: `vite-plugin-pwa` v0.19+ works with Vite 6 and generates correct workbox config.
  - Assumption: Testing on iPhone requires HTTPS — use `npx local-ssl-proxy` or ngrok for local dev testing.
  - Open question: Should we use `registerType: 'autoUpdate'` or `'prompt'`? Answer for MVP: `'autoUpdate'` (simpler, no update prompt UI needed for single user).

## 3) Change surface + safety
- Entry points: `vite.config.ts`, `index.html`
- Files/modules:
  - Modify: `vite.config.ts` — add `VitePWA` plugin with manifest and workbox config
  - Modify: `index.html` — add meta tags for iOS PWA, apple-touch-icon, favicon
  - New: `public/icons/icon-192.png`, `public/icons/icon-512.png`
  - New: `public/favicon.svg`, `public/favicon.ico`
  - New: `src/app/App.tsx` — add `useRegisterSW()` hook for update notifications (optional, minimal)
- Invariants/contracts to preserve:
  - App MUST NOT send financial data to any external service. Service worker only caches static assets.
  - Offline mode MUST render dashboard from last-known localStorage state (Zustand persist handles this automatically).
  - App MUST gracefully degrade when cache is empty (first offline visit after clearing Safari data).
  - `npm run build` MUST complete without errors and produce valid `dist/`.
  - `make preflight` MUST pass (typecheck, lint, test).
- Main risks + mitigation:
  - Risk: iPhone Safari doesn't respect all PWA manifest fields (e.g., `theme_color`) → mitigation: add both manifest and `<meta>` tags (Apple-specific meta tags override manifest on iOS).
  - Risk: Service worker cache becomes stale and users don't get updates → mitigation: `autoUpdate` handles this; show a toast when new version is available (optional).
  - Risk: `vite-plugin-pwa` breaks build or produces corrupt service worker → mitigation: test `npm run build && npx vite preview` locally, verify `navigator.serviceWorker` is registered.

## 4) Implementation steps
1. Create simple app icon: 192x192 and 512x512 PNG with letter "M" on dark background. Place in `public/icons/`.
2. Create favicon: `public/favicon.svg` (same "M" icon as SVG). Create `public/favicon.ico` via conversion tool or skip (modern browsers use SVG).
3. Update `index.html`:
   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg">
   <link rel="apple-touch-icon" href="/icons/icon-192.png">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="theme-color" content="#090d12">
   ```
4. Update `vite.config.ts`:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa';
   // Add to plugins array:
   VitePWA({
     registerType: 'autoUpdate',
     manifest: {
       name: 'Денежка',
       short_name: 'Денежка',
       description: 'Персональный финмонитор',
       theme_color: '#090d12',
       background_color: '#090d12',
       display: 'standalone',
       orientation: 'portrait',
       icons: [
         { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
         { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
         { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
       ],
     },
     workbox: {
       globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
       runtimeCaching: [{
         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
         handler: 'StaleWhileRevalidate',
         options: { cacheName: 'google-fonts-stylesheets' },
       }, {
         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
         handler: 'CacheFirst',
         options: { cacheName: 'google-fonts-webfonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
       }],
     },
   })
   ```
5. (Optional) Add update toast in `src/app/App.tsx`: `import { useRegisterSW } from 'virtual:pwa-register/react'` → shows "Новая версия доступна" toast.
6. Run `npm run build` → verify `dist/` contains `manifest.webmanifest`, `sw.js`, `workbox-*.js`.
7. Run `npx vite preview` → open in browser, check DevTools → Application → Service Workers (should show registered).
8. (If possible) Test on iPhone: deploy to Netlify/Vercel drop, open in Safari, tap Share → Add to Home Screen, verify standalone launch, toggle Airplane mode, verify offline shell loads.
9. Run `npm run typecheck && npm run lint` → fix errors.
10. Run `npm run test` → verify no regressions.
11. Run `make preflight` → verify all gates pass.

## 5) Validation
- Fast gate: `npm run build` → expected: exit 0, produces `dist/manifest.webmanifest` and `dist/sw.js`.
- Task-specific checks:
  - `npm run typecheck && npm run lint` → expected: exit 0.
  - `npm run test` → expected: all tests pass (no regression).
  - Browser: `npx vite preview` → DevTools → Application → Manifest (manifest loads), Service Workers (registered).
  - Browser: toggle Offline in DevTools → refresh → app shell loads from cache.
  - iPhone: Add to Home Screen → app opens standalone, dark status bar, correct icon.
- Pareto blackbox: after `npm run build`, verify `dist/manifest.webmanifest` has all required fields (name, short_name, icons, display=standalone, theme_color).
- Rollback:
  - Remove `VitePWA` plugin from `vite.config.ts`.
  - Remove meta tags from `index.html`.
  - Delete `public/icons/`.
  - Rollback verification: `npm run build` succeeds, `make preflight` passes, app works as SPA (no PWA features).

## 6) DOD
- App installable on iPhone via Safari → Add to Home Screen.
- Standalone mode works (no browser chrome).
- Offline app shell loads from service worker cache.
- App icon and dark splash screen work.
- `npm run build` produces valid PWA dist.
- `npm run typecheck && npm run lint && npm run test` pass.
- `make preflight` passes.
- All new/modified files committed with message `feat: PWA support (manifest, service worker, offline shell)`.

## 7) Final verdict
- Ready for implementation: **yes**
