# AustRC Website — Contributor Guide

Everything you need to know to build new pages and components that automatically support **dark mode**, **light mode**, and **GPU-friendly performance** — without hardcoding a single color.

---

## Table of Contents

1. [How the Theme System Works](#1-how-the-theme-system-works)
2. [Token Reference](#2-token-reference)
3. [Do and Don't](#3-do-and-dont)
4. [New Page Template](#4-new-page-template)
5. [Registering a New Route](#5-registering-a-new-route)
6. [Adding a New Token](#6-adding-a-new-token)
7. [Fixing Existing Hardcoded Colors — Global Approach](#7-fixing-existing-hardcoded-colors--global-approach)
8. [Performance Rules](#8-performance-rules)
9. [Pre-submit Checklist](#9-pre-submit-checklist)
10. [Admin Panel](#10-admin-panel)

---

## 10. Admin Panel

The admin panel lives at **`/admin`** and is protected by Firebase Authentication. It allows authorized administrators to manage all Firestore data without touching the database directly.

### Accessing the Admin Panel

1. Go to `http://localhost:3001/admin` (local) or `https://austrc.com/admin` (production)
2. Enter the admin password (set in `.env` → `VITE_ADMIN_PASSWORD`)
3. The session is stored in `sessionStorage` — it expires when you close the browser tab

> **Local:** Edit [`.env`](file://.env) in the project root:
> ```
> VITE_ADMIN_PASSWORD=your_password_here
> ```

> **Production (Vercel):** `.env` is git-ignored and NOT deployed. You must add the env var manually:
> 1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**
> 2. Add `VITE_ADMIN_PASSWORD` = your password
> 3. Redeploy the project

### Image Upload in Admin Editors

Every image field in the admin panel supports **two modes**:

1. **Upload from device** — Uploads directly to Firebase Storage (max 5MB). Requires Firebase Storage rules to allow writes.
2. **Paste image URL** — Paste any direct link from:
   - [ImageKit](https://imagekit.io) — `https://ik.imagekit.io/…`
   - [Cloudinary](https://cloudinary.com) — `https://res.cloudinary.com/…`
   - Any publicly accessible CDN or direct image URL

> **Recommended:** Upload images to **ImageKit** (the existing CDN already used by this project) and paste the URL. This is faster, doesn't require Firebase Storage rules, and images are automatically optimized.

### Firestore Security Rules (Required)

For the admin panel to write data, your Firestore Security Rules **must** allow writes. Paste this in **Firebase Console → Firestore → Rules → Edit Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ **Important:** Without these rules, the admin panel will show a "Permission Denied" error when trying to add, update, or delete records.

### Admin Panel Structure

```
src/components/admin/
├── AdminPage.tsx            ← Main layout, auth guard, sidebar navigation
├── DashboardHome.tsx        ← Overview stats page
├── ImageUpload.tsx          ← Firebase Storage image upload helper
├── NoticesEditor.tsx        ← Notice Board CRUD
├── EventsEditor.tsx         ← Events + Headlines + Gallery CRUD
├── AchievementsEditor.tsx   ← Trophies & Awards CRUD
├── ProjectsEditor.tsx       ← Research Projects + Owners CRUD
├── GoverningPanelEditor.tsx ← Semester + Panel Member CRUD
├── SponsorsEditor.tsx       ← Sponsors CRUD
├── CollaborationsEditor.tsx ← Collaborations CRUD
└── TestimonialsEditor.tsx   ← Testimonial images update
```

### Adding a New Admin Editor

**Step 1** — Create `src/components/admin/MyDataEditor.tsx` using this template:

```tsx
import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MyData {
  id: string;
  Field_Name: string; // ← Use EXACT Firestore field names, no renaming!
}

export function MyDataEditor() {
  const [items, setItems] = useState<MyData[]>([]);
  const [loading, setLoading] = useState(true);

  // IMPORTANT: Use the exact Firestore collection path
  const col = collection(db, 'All_Data', 'My_Collection', 'documents');

  const fetchItems = async () => {
    setLoading(true);
    const snap = await getDocs(col);
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MyData)));
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">My Data</h2>
      {/* Add your CRUD UI here */}
    </div>
  );
}
```

**Step 2** — Register it in `AdminPage.tsx`:

```tsx
// 1. Import
import { MyDataEditor } from './MyDataEditor';

// 2. Add to menuItems array
{ id: 'my-data', label: 'My Data', icon: SomeLucideIcon },

// 3. Add to main content area
{activeTab === 'my-data' && <MyDataEditor />}
```

### Database Field Name Rule

> 🚫 **Never rename Firestore fields.** The mobile app and website both depend on the exact same field names. Always use the original field names exactly as they appear in Firestore (e.g., `Event_Name`, `Cover_Picture`, `Owner_1_Name`).

### Image Uploads

Use the built-in `ImageUpload` component which uploads to Firebase Storage and returns a URL:

```tsx
import { ImageUpload } from './ImageUpload';

<ImageUpload
  label="Cover Picture"
  currentUrl={coverUrl}
  onUploadComplete={(url) => setCoverUrl(url)}
  onClear={() => setCoverUrl('')}
/>
```

---

## 1. How the Theme System Works

The theme system is built on a **design token** pattern. Instead of writing `text-white` or `text-gray-400`, you ask the token system *"what is the correct text color right now?"* and it returns the right value for whichever theme is active.

```
ThemeContext.tsx   →  stores 'dark' | 'light', persists to localStorage
       ↓
tokens/theme.ts   →  dark:  { textPrimary: '#ffffff', ... }
                  →  light: { textPrimary: '#0f172a', ... }
       ↓
useTokens.ts      →  returns tokens[currentTheme]
       ↓
Your component    →  const t = useTokens();
                  →  <p style={{ color: t.textPrimary }}>Hello</p>
```

| File | Responsibility |
|---|---|
| `src/context/ThemeContext.tsx` | Stores `'dark' \| 'light'` state. Provides `toggleTheme()`. Persists to `localStorage`. |
| `src/tokens/theme.ts` | **Single source of truth.** Two objects — `dark` and `light` — each holding every color used site-wide. |
| `src/tokens/useTokens.ts` | One-line hook. Reads active theme, returns the matching token object. |

---

## 2. Token Reference

| Token | Use for | Dark value | Light value |
|---|---|---|---|
| `t.pageBg` | `<main>` / page root background | `#000000` | `#f1f5f9` |
| `t.pageBgAlt` | Alternate section background | `#0a0a0a` | `#ffffff` |
| `t.surfaceCard` | Card / panel / modal background | `rgba(255,255,255,0.025)` | `rgba(255,255,255,0.92)` |
| `t.surfaceCardHover` | Card content area / elevated surface | `#111111` | `#ffffff` |
| `t.surfaceOverlay` | Modal scrim / backdrop | `rgba(0,0,0,0.6)` | `rgba(15,23,42,0.5)` |
| `t.surfaceNavbar` | Navbar pill background | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.75)` |
| `t.surfaceDrawer` | Mobile drawer background | `#111111` | `#ffffff` |
| `t.textPrimary` | Headings, titles, prominent labels | `#ffffff` | `#0f172a` |
| `t.textSecondary` | Body text, descriptions, paragraphs | `rgba(255,255,255,0.48)` | `#475569` |
| `t.textMuted` | Timestamps, captions, metadata | `rgba(255,255,255,0.22)` | `#94a3b8` |
| `t.textMutedMid` | Sub-labels, slightly stronger muted | `rgba(255,255,255,0.32)` | `#64748b` |
| `t.textMutedHigh` | Subtle labels, tag text | `rgba(255,255,255,0.35)` | `#475569` |
| `t.borderSubtle` | Hairline dividers, row separators | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.06)` |
| `t.borderDefault` | Default container borders | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.1)` |
| `t.borderFocus` | Focus / hover borders (non-brand) | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.15)` |
| `t.borderBrand` | Green card border — default state | `rgba(46,204,113,0.2)` | `rgba(22,163,74,0.5)` |
| `t.borderBrandHover` | Green card border — hover state | `rgba(46,204,113,0.55)` | `rgba(22,163,74,0.9)` |
| `t.brandGreen` | Primary brand green | `#2ECC71` | `#16a34a` |
| `t.brandGreenDark` | Darker brand green (buttons, accents) | `#27AE60` | `#15803d` |
| `t.brandGreenMid` | Lighter brand green (highlights) | `#3DED97` | `#22c55e` |

> **Brand green is NOT identical in both themes.**  
> Light mode uses darker greens (`#16a34a` / `#15803d` / `#22c55e`) so they remain readable on white/slate backgrounds.  
> Always use `t.brandGreen`, `t.brandGreenDark`, `t.brandGreenMid` for any brand color that appears on text or interactive elements.  
>  
> The only safe place to hardcode `#2ECC71` is inside **SVG decorations** and **glowing UI accents** (buttons, badges, indicator dots) where the slight shade difference between themes is visually acceptable.  
> **Everything else must come from a token.**

---

## 3. Do and Don't

### Colors

```tsx
// ✅ DO — token-based, works in both themes
const t = useTokens();

<h1 style={{ color: t.textPrimary }}>Title</h1>
<p  style={{ color: t.textSecondary }}>Description</p>
<span style={{ color: t.textMuted }}>12 Jan 2025</span>
<div style={{ backgroundColor: t.surfaceCard }}>Card</div>

{/* Brand green on text/headings — always use the token */}
<h2 style={{ color: t.brandGreen }}>Section</h2>

{/* Hardcoded #2ECC71 is only acceptable for SVG fills, glow dots, badge backgrounds */}
<div className="w-3 h-3 bg-[#2ECC71] rounded-full shadow-[0_0_20px_rgba(46,204,113,0.8)]" />
```

```tsx
// ❌ DON'T — hardcoded colors that break in the opposite theme

<h1 className="text-white">Title</h1>              // invisible in light mode
<p  className="text-gray-400">Description</p>      // theme-unaware
<div className="bg-black">Card</div>               // invisible in light mode
<div className="bg-gradient-to-b from-black/60 to-black/80">...</div>  // same problem
<h2 className="text-[#2ECC71]">Section heading</h2> // too faint in light mode
```

### Framer Motion `animate` prop

Framer's animation engine overrides all inline styles and Tailwind classes.  
Always pass the token value **inside** the `animate` object:

```tsx
// ✅ DO
const t = useTokens();
<motion.h3 animate={{ color: isHovered ? t.brandGreen : t.textPrimary }}>
  Card Title
</motion.h3>

// ❌ DON'T
<motion.h3 animate={{ color: isHovered ? '#2ECC71' : '#ffffff' }}>
  Card Title   {/* both values are hardcoded — wrong in light mode */}
</motion.h3>
```

---

## 4. New Page Template

Copy this as your starting point for every new page:

```tsx
// src/components/MyNewPage.tsx

import { motion, useScroll } from 'motion/react';
import { useTokens } from '@/tokens/useTokens';

// Scroll progress bar — paste this in every full page
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r
                 from-[#2ECC71] to-[#27AE60] origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// Page background — paste this in every full page
function PageBackground() {
  const t = useTokens();
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ backgroundColor: t.pageBg }} />

      {/* Decorative orbs — CSS-only, GPU compositor, hidden on mobile */}
      <div className="hidden lg:block absolute inset-0 opacity-30 overflow-hidden">
        <div
          className="absolute top-20 -left-20 w-96 h-96 bg-[#2ECC71]
                     rounded-full gpu-orb gpu-orb-pulse"
          style={{ filter: 'blur(100px)', '--dur': '5s' } as React.CSSProperties}
        />
        <div
          className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-[#27AE60]
                     rounded-full gpu-orb gpu-orb-pulse-reverse"
          style={{ filter: 'blur(100px)', '--dur': '6s' } as React.CSSProperties}
        />
      </div>

      {/* Static fallback for mobile — zero JS animation cost */}
      <div className="lg:hidden absolute inset-0 opacity-20 overflow-hidden">
        <div
          className="absolute top-20 -left-20 w-64 h-64 bg-[#2ECC71] rounded-full"
          style={{ filter: 'blur(60px)' }}
        />
      </div>
    </div>
  );
}

export function MyNewPage() {
  const t = useTokens();

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: t.pageBg }}
    >
      <PageBackground />
      <ScrollProgress />

      <div className="pt-24 pb-24 px-6">
        <div className="container mx-auto">

          {/* Page title */}
          <h1 className="text-5xl font-bold" style={{ color: t.textPrimary }}>
            Page Title
          </h1>

          {/* Section heading — use token so light mode gets #16a34a */}
          <h2 className="text-3xl font-bold" style={{ color: t.brandGreen }}>Section</h2>

          {/* Body text */}
          <p style={{ color: t.textSecondary }}>Description paragraph.</p>

          {/* Muted / caption */}
          <span style={{ color: t.textMuted }}>12 Jan 2025</span>

          {/* Card */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: t.surfaceCard,
              borderColor: t.borderBrand,
            }}
          >
            <h3 style={{ color: t.textPrimary }}>Card Title</h3>
            <p  style={{ color: t.textSecondary }}>Card body</p>
          </div>

        </div>
      </div>

      {/* Decorative glow — desktop only */}
      <div className="hidden lg:block fixed bottom-10 right-10 w-32 h-32
                      bg-[#2ECC71]/20 rounded-full blur-3xl pointer-events-none z-0" />
    </main>
  );
}
```

---

## 5. Registering a New Route

**Step 1** — Import your component at the top of `src/App.tsx`:

```tsx
import { MyNewPage } from './components/MyNewPage';
```

**Step 2** — Add a `<Route>` inside the `<Routes>` block:

```tsx
<Route path="/my-new-page" element={<MyNewPage />} />
```

**Step 3** — Link to it from anywhere using React Router's `Link`:

```tsx
import { Link } from 'react-router-dom';

<Link to="/my-new-page">Go to My Page</Link>
```

> If the page should **not appear in the Navbar**, just don't add it there.  
> The route still works when you navigate to the URL directly.

---

## 6. Adding a New Token

Need a color that doesn't exist yet? Edit **one file** — `src/tokens/theme.ts`.  
TypeScript will error if you forget either the `dark` or `light` value.

```ts
// src/tokens/theme.ts

// 1. Add to the Tokens interface
export interface Tokens {
  myNewColor: string;
}

// 2. Add to the dark object
dark: {
  myNewColor: 'rgba(255,255,255,0.15)',
},

// 3. Add to the light object
light: {
  myNewColor: 'rgba(0,0,0,0.08)',
},
```

Use it immediately in any component:

```tsx
const t = useTokens();
<div style={{ backgroundColor: t.myNewColor }}>...</div>
```

**Optional — Tailwind utility class:** If you also want `className="bg-my-new-color"`, add a CSS variable in `src/styles/globals.css`:

```css
:root { --color-my-new-color: rgba(0,0,0,0.08); }
.dark { --color-my-new-color: rgba(255,255,255,0.15); }
```

---

## 7. Fixing Existing Hardcoded Colors — Global Approach

When you encounter an **existing** component (written by someone else, or before the token system existed) that has hardcoded colors, there are two ways to fix it. Choose based on the scope of the problem.

---

### Option A — Global CSS override in `globals.css` (fastest, zero component edits)

`src/styles/globals.css` already contains a `html:not(.dark)` block that **globally remaps** common hardcoded Tailwind classes to their correct light-mode equivalents. When a class is listed here, **every component that uses it gets fixed automatically** — no JSX changes needed.

**Where it lives:**
```css
/* src/styles/globals.css */
html:not(.dark) {
  .text-white       { color: #0f172a !important; }
  .text-gray-400    { color: #475569 !important; }
  .text-gray-500    { color: #64748b !important; }
  .bg-black         { background-color: #f1f5f9 !important; }
  .from-black       { --tw-gradient-from: #f1f5f9 ... !important; }
  /* ... full list below */
}
```

**When to use Option A:**
- The hardcoded class appears in **many components** across the codebase
- You want a one-line fix that covers everything at once
- The element has no inline `style` prop competing with it (inline styles always beat CSS classes)

**How to add a new override:**

Open `src/styles/globals.css`, find the `html:not(.dark) {` block, and add your mapping:

```css
html:not(.dark) {
  /* existing overrides ... */

  /* add your new one: */
  .text-gray-200    { color: #1e293b !important; }
  .bg-gray-950      { background-color: #f8fafc !important; }
}
```

**Currently mapped classes (already in `globals.css`):**

| Tailwind class | Dark mode result | Light mode result |
|---|---|---|
| `text-white` | white | `#0f172a` (near-black) |
| `text-gray-100/200` | light gray | `#1e293b` |
| `text-gray-300` | gray | `#334155` |
| `text-gray-400` | gray | `#475569` |
| `text-gray-500` | gray | `#64748b` |
| `text-zinc-400/500`, `text-neutral-400/500` | gray | `#64748b` |
| `bg-black` | black | `#f1f5f9` |
| `bg-gray-800`, `bg-gray-900` | dark | `#e2e8f0` / `#f1f5f9` |
| `from-black`, `via-black`, `to-black` | dark gradient | light gradient |
| `from-gray-900`, `via-gray-900`, `to-gray-900` | dark gradient | light gradient |
| `bg-black/40`, `bg-black/60`, `bg-black/80` | dark overlay | light overlay |
| `from-black/60`, `via-black/60`, `to-black/80` | dark overlay | light overlay |
| `border-gray-600`, `border-gray-700` | dark border | `rgba(0,0,0,0.12/0.15)` |

> **Important:** The `!important` flag is intentional — it ensures the override beats Tailwind's generated styles. However, **inline `style` props always win over CSS classes**, so token-based inline styles are never affected.

---

### Option B — Per-component token fix (cleanest, recommended for new code)

For components you are actively editing, replace the hardcoded class with a token-based inline style. This is the preferred approach because it is explicit and self-documenting.

```tsx
// Before — hardcoded, breaks in light mode
<p className="text-gray-400">Description</p>
<h1 className="text-white">Title</h1>
<div className="bg-black">Card</div>
<div className="bg-gradient-to-b from-black/60 to-black/80">Content</div>

// After — token-based, works in both themes
const t = useTokens();

<p style={{ color: t.textSecondary }}>Description</p>
<h1 style={{ color: t.textPrimary }}>Title</h1>
<div style={{ backgroundColor: t.surfaceCard }}>Card</div>
<div style={{ backgroundColor: t.surfaceCardHover }}>Content</div>
```

**When to use Option B:**
- You are already inside the component making other changes
- The element has complex logic where the CSS override might not reach (e.g. inside Framer Motion `animate`)
- You want the fix to be visible and traceable in the component's code

---

### Which option for which situation?

| Situation | Use |
|---|---|
| Found `text-gray-400` in 15 components, touching all of them is too risky | **Option A** — add to `globals.css` once |
| You're already editing a component and spot `text-white` | **Option B** — fix it inline with a token |
| Inside `animate={{ color: '#ffffff' }}` (Framer Motion) | **Option B only** — CSS cannot override Framer's inline style |
| Gradient `from-black via-gray-900` in a component you own | **Option B** — replace the classes with `style={{ backgroundColor: t.pageBg }}` |
| Same gradient class appears in 10+ files you don't own | **Option A** — map it in `globals.css` |

---

## 8. Performance Rules

These rules are already applied site-wide — maintain them in new code.

### Use CSS animations, not JS loops

```tsx
// ✅ DO — CSS-only, runs on GPU compositor thread
<div
  className="gpu-orb gpu-orb-pulse hidden lg:block"
  style={{ '--dur': '5s' } as React.CSSProperties}
/>

// Available CSS classes (defined in src/styles/globals.css):
//   gpu-orb              — will-change: transform, opacity; translateZ(0)
//   gpu-orb-pulse        — scale pulse animation
//   gpu-orb-pulse-reverse — reverse scale pulse
//   particle-dot         — floating upward dot

// ❌ DON'T — runs a JS animation loop on the main thread
<motion.div
  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
  transition={{ duration: 5, repeat: Infinity }}
/>
```

### Hide decorations on mobile

```tsx
// ✅ All decorative animated elements must be hidden on mobile
<div className="hidden lg:block ...">
  {/* orbs, particles, etc. */}
</div>
// globals.css also applies animation: none !important to all gpu-orb* and
// particle-dot classes below 1024px as a safety net.
```

### `useScroll`, not scroll event listeners

```tsx
// ✅ DO — Framer's useScroll uses IntersectionObserver, no React re-renders
import { useScroll } from 'motion/react';
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div style={{ scaleX: scrollYProgress }} />;
}

// ❌ DON'T — fires setState on every scroll frame
useEffect(() => {
  window.addEventListener('scroll', () => setProgress(...));
}, []);
```

### No resize listeners for device detection

```tsx
// ✅ DO — Tailwind handles this with zero JS
<div className="hidden lg:block">desktop only</div>
<div className="block lg:hidden">mobile only</div>

// ❌ DON'T — causes re-renders on every resize
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  window.addEventListener('resize', () => setIsMobile(window.innerWidth < 1024));
}, []);
```

### No base64 image caching

```tsx
// ✅ DO — browser HTTP cache handles repeat visits natively
<img src={project.coverImage} alt={project.title} />

// ❌ DON'T — doubles memory, blocks network, defeats browser cache
useEffect(() => {
  fetch(url).then(r => r.blob()).then(blob => {
    const reader = new FileReader();
    reader.onload = () => setCachedImage(reader.result as string);
    reader.readAsDataURL(blob);
  });
}, []);
```

### Lazy-load large below-fold sections

```tsx
// ✅ DO — separate chunk, loads only when user scrolls near it
const HeavySection = lazy(() =>
  import('./HeavySection').then(m => ({ default: m.HeavySection }))
);

<Suspense fallback={<div className="h-64 animate-pulse" />}>
  <HeavySection />
</Suspense>
```

### Component-scoped CSS keyframes

When a component needs **custom keyframe animations** (e.g. a unique pulse, glow, or SVG stroke animation) that don't belong in `globals.css`, co-locate them in a `<style>` tag inside the component's JSX. This keeps the animation self-contained and avoids polluting the global stylesheet.

```tsx
export function MySection() {
  const t = useTokens();

  return (
    <>
      {/* Co-located keyframes — only loaded when this component renders */}
      <style>{`
        @keyframes my-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
        .my-dot {
          will-change: opacity;
          animation: my-pulse 3s ease-in-out infinite;
        }
        /* Kill on mobile — always pair with a media query */
        @media (max-width: 1023px) {
          .my-dot { animation: none !important; }
        }
      `}</style>

      <section>
        <div className="my-dot w-3 h-3 rounded-full" style={{ backgroundColor: t.brandGreen }} />
      </section>
    </>
  );
}
```

**Rules for co-located styles:**
- Use a unique CSS class prefix (e.g. `my-`, `hs-`, `nb-`) to avoid collisions with other components
- Always include a `@media (max-width: 1023px) { animation: none !important; }` guard
- Only co-locate animations — color tokens belong in `inline style` or the token system, not in `<style>` tags
- For animations shared across multiple components, move them to `globals.css` instead

---

## 9. Pre-submit Checklist

Before opening a PR, confirm every item:

**Theme / Colors**
- [ ] New code uses `useTokens()` — no new `text-white`, `text-gray-*`, `bg-black`, `bg-white` in JSX
- [ ] Brand green on **text or headings** uses `t.brandGreen` (not hardcoded `text-[#2ECC71]`, which is too faint in light mode)
- [ ] Hardcoded `#2ECC71` only appears in SVG fills, glow dots, badge/button backgrounds — never on readable text
- [ ] Framer Motion `animate` objects use `t.textPrimary` / `t.brandGreen`, not `"#ffffff"` or `"#2ECC71"`
- [ ] Any existing hardcoded gray/white/black classes in components you touched are fixed — either via Option A (add to `globals.css`) or Option B (inline token)
- [ ] Page tested visually in **both light mode and dark mode**

**Performance**
- [ ] Decorative animations use `gpu-orb-pulse` / `particle-dot` CSS classes — not `repeat: Infinity` in JS
- [ ] All decorative animated elements are wrapped in `hidden lg:block`
- [ ] No `window.addEventListener("scroll", setState)` — use `useScroll()` from `motion/react`
- [ ] No `window.addEventListener("resize", ...)` for device detection — use Tailwind responsive classes
- [ ] No `fetch → blob → FileReader → base64` image caching — use the URL directly in `src`
- [ ] Large below-fold sections are lazy-loaded with `React.lazy + Suspense`

**Routing**
- [ ] New route added to `src/App.tsx`
