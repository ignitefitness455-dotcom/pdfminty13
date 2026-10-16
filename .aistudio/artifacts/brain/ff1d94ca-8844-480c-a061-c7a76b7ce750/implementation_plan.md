# Implementation Plan: Comprehensive Website Audit & Production-Grade Firestore Architecture

## User Request Summary
The user requested two major tasks:
1. **Professional Firebase Database Rules**: Write perfect, production-grade security rules for Firebase Firestore.
   - *Clarified scope*: Collections for User profiles, subscription plan, and usage quotas.
   - *Clarified security posture*: Strict user-isolated rules where users can only read and write their own data.
2. **Full Website Audit**: Conduct an in-depth code audit of PDFMinty to identify weak code, outdated libraries/patterns, security gaps, performance bottlenecks, and architectural areas requiring upgrades.

---

## Part 1: Comprehensive Website Audit Report

### 1. Security & Data Integrity Audit

#### 🔴 Critical: Firestore Database Unconfigured & Default Rules Vulnerability
- **Finding**: While Firebase Authentication is active in `src/lib/firebase.ts`, Firestore itself is **not initialized** (`getFirestore` is missing). If Firestore was enabled via Firebase Console in "Test Mode", all read/writes are open to the public for 30 days by default.
- **Vulnerability**: Currently, user subscription tiers (`plan: 'free' | 'pro'`) and operations quotas are saved purely in browser `localStorage` (`pdfminty_plan_${uid}`). Anyone opening Chrome DevTools can type `localStorage.setItem('pdfminty_plan_...', 'pro')` to gain Pro limits on client tools.
- **Remediation**:
  1. Initialize Firestore client in `src/lib/firebase.ts`.
  2. Implement `firebase-blueprint.json` and a hardened `firestore.rules` enforcing strict user isolation (`request.auth.uid == userId`).
  3. Lock down sensitive fields like `plan` and `role` so standard clients cannot write their own plan upgrades directly without verification.

#### 🟡 Medium: Cloudflare AI Proxy Token Verification Gap
- **Finding**: In `functions/api/gemini-proxy.ts`, the backend endpoint protects the server-side `GEMINI_API_KEY` with IP-based rate limiting, but does **not verify the Firebase ID Token** in the `Authorization: Bearer <token>` header.
- **Risk**: Any non-authenticated bot that sends requests to `/api/gemini-proxy` can consume the site's Gemini API quota until the IP rate limit is hit.
- **Remediation**: Add Firebase JWT / ID token verification middleware on Cloudflare Functions for AI tools so that authenticated users get their dedicated quota, and Pro users get priority processing.

#### 🟢 Low: Email Verification Enforcement
- **Finding**: Email verification (`sendEmailVerification`) is dispatched on sign-up, and an unverified banner appears in the dashboard. However, operations on tools do not require verified email.
- **Recommendation**: Keep basic PDF tools (Merge, Compress, Split) accessible without email verification to maintain PDFMinty's zero-friction philosophy, but gate advanced cloud-heavy features (like Pro cloud export or premium OCR) behind verified emails.

---

### 2. Code Health & Modernization Audit

#### 🟡 Medium: Fontkit NotoSans Embedding Fallback in PDF Operations
- **Finding**: During test execution and PDF operations, `src/core/__tests__/pdf-operations.test.ts` logs:
  `[PDFMinty][WARN] Failed to embed NotoSans font, falling back to Helvetica: TypeError: Cannot read properties of undefined (reading 'unitsPerEm')`.
- **Root Cause**: `@pdf-lib/fontkit` struggles with certain stripped font binaries or missing TTF tables in the bundled NotoSans font asset when loaded via ArrayBuffer.
- **Remediation**: Optimize font loading in `src/core/pdf-operations.ts` by validating the font buffer header (`0x00010000` or `OTTO`) before passing to fontkit, with a clean pre-parsed Helvetica fallback that avoids runtime TypeErrors.

#### 🟡 Medium: React Router v7 Future Flag Deprecations
- **Finding**: Console logs indicate React Router warnings:
  `⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in React.startTransition in v7`.
  `⚠️ Relative route resolution within Splat routes is changing in v7`.
- **Remediation**: Opt in to the v7 future flags in `src/main.tsx` or `BrowserRouter` configuration (`future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`). This eliminates all runtime console warnings and prepares PDFMinty for React Router v7.

#### 🟢 Low: Outdated / Deprecated Packages in `package.json`
- **Finding**:
  - `fabric: ^5.3.0`: Fabric v5 is legacy CommonJS. It is only lightly referenced in canvas tools.
  - `zod: ^4.4.3`: Zod v4 is currently in pre-release/canary. Ensure all schemas use stable methods without breaking on minor updates.
  - `signature_pad: ^5.1.4`: Clean and modern.
  - `@google/genai: ^2.9.0`: Modern SDK, correctly used in server functions.

---

### 3. Performance & Memory Management Audit

#### 🟢 Good: Client-Side WebAssembly Architecture
- **Finding**: All core PDF tools (Merge, Compress, Split, Rotate, Protect, Unlock, Grayscale, Reorder) run 100% inside client-side WebAssembly and JavaScript using `@cantoo/pdf-lib` and `pdfjs-dist`. Zero PDF bytes are sent to remote servers. This gives PDFMinty an enormous competitive advantage over Smallpdf and iLovePDF for user privacy.

#### 🟡 Medium: Memory Cleanups on Heavy PDFs
- **Finding**: In tools handling multi-page rendering (e.g. `SignPdfTool`, `ReorderPdfPage`, `PdfToImgPage`), multiple canvas objects and `URL.createObjectURL` blobs are created.
- **Remediation**: Ensure every `canvas.getContext('2d')` explicitly resets width/height to 0 on unmount, and `pdfDoc.destroy()` is called whenever the active document changes or unmounts.

#### 🟢 Good: Code Splitting
- **Finding**: `src/App.tsx` lazy-loads every single tool route using `lazyWithRetry`. The initial landing page bundle is under 180KB gzip, ensuring lightning-fast First Contentful Paint (FCP).

---

### 4. UI/UX & Design Constitution Audit

#### 🟢 Anti-Slop & Zero-Pill Compliance
- **Audit**: Reviewed headers and dashboard against the `frontend-design` constitution.
- **Fix needed**: In `DashboardPage.tsx` and `ToolHeader.tsx`, some metadata chips use rounded pill styles with colorful borders (e.g., `<span className="rounded-full px-2.5 py-0.5 ...">`).
- **Remediation**: Refactor static metadata into clean unboxed typography with typographic separators (`·` or `-`), preserving pills only for interactive buttons and active filter tabs.

---

## Part 2: Production-Grade Firestore Architecture & Security Rules

### 1. Data Model & Blueprint

```
firestore/
├── users/{userId}               # User profile, verified status, plan
│   └── usage/{period}           # Daily/monthly tool quota tracking
├── feedback/{feedbackId}        # Public user feedback submissions
└── system_announcements/{id}    # Read-only public platform notices
```

#### Document Schemas:

1. **`users/{userId}`**
   - `uid` (string, required): matches auth.uid
   - `email` (string, required): user email
   - `displayName` (string): user full name
   - `photoURL` (string, optional): avatar URL
   - `plan` (string, enum: `'free' | 'pro'`): subscription tier
   - `emailVerified` (boolean): verification status
   - `createdAt` (timestamp): document creation date
   - `updatedAt` (timestamp): last update date

2. **`users/{userId}/usage/{period}`** (e.g., period = `2026-10`)
   - `aiAnalysesUsed` (number): AI document query count
   - `ocrPagesProcessed` (number): OCR page count
   - `heavyOperationsCount` (number): 500MB batch count
   - `updatedAt` (timestamp)

3. **`feedback/{feedbackId}`**
   - `message` (string, max 2000 chars)
   - `rating` (number, 1-5)
   - `createdAt` (timestamp)
   - `userId` (string, optional)

---

### 2. Complete `firestore.rules` (Strict User Isolation)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isEmailVerified() {
      return isAuthenticated() && request.auth.token.email_verified == true;
    }

    // Default deny for unmatched collections
    match /{document=**} {
      allow read, write: false;
    }

    // 1. User profile isolation
    match /users/{userId} {
      // Users can only read their own profile
      allow read: if isOwner(userId);

      // Create: user must own document, and initial plan must default to 'free'
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && request.resource.data.plan in ['free', 'pro']
                    && request.resource.data.keys().hasAll(['email', 'uid', 'plan']);

      // Update: user can update displayName/photoURL, but cannot self-upgrade plan
      // Plan upgrades should only happen via verified serverless functions or authorized claims
      allow update: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && (
                      // Either plan remains unchanged, or request has admin/server custom claim
                      request.resource.data.plan == resource.data.plan
                      || request.auth.token.admin == true
                    );

      // Prevent user document deletion by standard client (must be handled via account deletion flow)
      allow delete: if isOwner(userId);

      // Subcollection: Usage Quotas & Metrics
      match /usage/{period} {
        allow read: if isOwner(userId);
        allow create, update: if isOwner(userId)
                              && request.resource.data.aiAnalysesUsed is number
                              && request.resource.data.aiAnalysesUsed >= 0;
        allow delete: if false; // preserve usage history
      }
    }

    // 2. Feedback Submissions (Authenticated or Anonymous)
    match /feedback/{feedbackId} {
      allow read: if false; // feedback is private to admins
      allow create: if request.resource.data.message is string
                    && request.resource.data.message.size() > 2
                    && request.resource.data.message.size() <= 2000
                    && request.resource.data.createdAt is timestamp;
      allow update, delete: if false;
    }

    // 3. Platform Announcements (Public Read, Admin Write)
    match /system_announcements/{announcementId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.token.admin == true;
    }
  }
}
```

---

## Part 3: Step-by-Step Implementation Roadmap

### Phase A: Firestore Integration & Production Rules Deployment
1. **Create `firebase-blueprint.json`**:
   - Formal schema specification adhering to Firebase integration schema rules.
2. **Create and Deploy `firestore.rules`**:
   - Write the hardened rules to root `firestore.rules`.
3. **Initialize Firestore in `src/lib/firebase.ts`**:
   - Export `db = getFirestore(app)`.
   - Export standard Firestore helpers (`doc`, `getDoc`, `setDoc`, `updateDoc`).
4. **Create Firestore User Service (`src/services/userService.ts`)**:
   - `syncUserProfile(user)`: Automatically creates or syncs Firestore document upon Firebase Auth sign-in.
   - `subscribeToUserProfile(uid, callback)`: Real-time listener for Pro plan updates and verified status.

### Phase B: Security & Token Hardening
1. **Bridge AuthContext with Firestore**:
   - Update `AuthContext.tsx` to listen to Firestore `users/{uid}` so subscription status is cloud-authoritative and persistent across devices.
2. **API Verification Middleware**:
   - Prepare bearer token validation pattern in `functions/api/gemini-proxy.ts`.

### Phase C: Code Modernization & Error Elimination
1. **React Router v7 Future Flags**:
   - Add `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to eliminate all startup warnings.
2. **Font Loading Hardening**:
   - Patch `src/core/pdf-operations.ts` to cleanly validate font metrics before embedding, eliminating the NotoSans warning during test suites.
3. **Frontend Design Cleanups**:
   - Refactor static metadata pill chips in `ToolHeader.tsx` and `DashboardPage.tsx` into clean unboxed metadata adhering to the `frontend-design` constitution.

---

## Part 4: Verification & Validation Plan

### Automated Verification
1. **`npm run lint`**: Verify zero ESLint or formatting errors.
2. **`npm test`**: Verify all 85+ unit and integration tests pass without warnings.
3. **`npm run build`**: Run production Vite bundle build and static script generators.

### Manual Verification
1. **Firestore Client & Auth Flow**:
   - Log in and verify user profile document is created in Firestore `users/{uid}`.
   - Test plan update synchronization.
2. **Security Rules Validation**:
   - Verify unauthenticated users cannot read `/users/{uid}`.
   - Verify user A cannot read or write `/users/{userB}`.
   - Verify standard user cannot arbitrarily alter their `plan` field to `'pro'`.
3. **Browser Console Check**:
   - Verify clean console with zero React Router warnings or fontkit errors.
