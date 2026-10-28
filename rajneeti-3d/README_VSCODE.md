# RAJNEETI 3D — VS Code quickstart

This folder continues the supplied RAJNEETI 3D project. It is a fictional, single-player browser political simulation built with React, TypeScript, Vite, and Babylon.js. Investment, security, political-advisor, and coalition-minister replacement systems are integrated into the existing game and save state.

## Run locally at zero subscription cost

You need VS Code and Node.js 20 or newer (npm is included). The first dependency install requires internet, but the application does not need a paid API, key, account, subscription, hosted backend, or cloud service.

1. Unzip this project and open the `rajneeti-3d` folder in VS Code.
2. Open **Terminal → New Terminal** and run:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

3. Open the local URL Vite prints, usually `http://localhost:5173`.

After the first install, run `npm run dev` from `frontend` for future sessions. Stop it with `Ctrl+C`.

## Checks

From `frontend`:

```bash
npm run lint   # ESLint
npm run build  # TypeScript check + production bundle
npm run test   # Vitest suite
```

Verified in this environment with the real installed dependencies: lint passed, production build passed, and all 145 tests passed. Vite still prints its large-bundle advisory because the Babylon.js application is bundled together; it does not fail the build.

## Implemented in this update

- **Government investments:** three fictional company proposals; request a deterministic economic review, negotiate lower public support for slightly higher delivery risk, approve or reject, then receive a seeded delayed success/failure outcome affecting jobs, growth, unemployment, government debt, and approval.
- **Police security app:** Prime Ministers can request 5, 10, 15, 20, or a custom number (up to 30) from a 40-officer roster with 10 baseline officers already assigned. The request arrives after two in-game days, changes the following 3D escort group, costs ₹0.08 crore per extra officer per month, and can be dismissed.
- **Offline political advisor:** deterministic advice cards use current coalition, seat, ministry, fiscal, crisis, employment, and investment state. No cloud model or paid AI service is called.
- **Coalition minister replacement:** In the PM Office's Cabinet tab, review partner-held ministry performance and complaints. Below 50 performance or at 4+ complaints, request a replacement; the partner makes a deterministic, trust- and evidence-based accept/refuse decision. Acceptance resets performance to a 55 baseline and eases complaints; refusal lowers coalition trust and approval. Requests have a 90-day cooldown. The PM cannot directly dismiss a partner's minister.
- **Save migration:** v7 campaign saves are accepted and upgraded to v8; new government investment and security fields receive safe defaults, preserving existing campaign progress.

## Existing game and known gaps

The project also includes the fictional 180-seat election, party membership and funded recruitment, coalitions, budgets, ministries, parliamentary bills, crises, opposition, protests, save slots, a low-poly city, a PM convoy, and stylized followers. The full original brief is much broader: photorealistic/licensed characters, enterable/drivable cars and AI driving, dispatch vehicles visibly traveling and exiting, a complete phone/notification suite, persistent AI-party memory, evidence-based ministry-warning consequences, 3D political meetings and chamber voting, and a career/legacy system remain unfinished. Read [`docs/REQUEST_SCOPE_STATUS.md`](docs/REQUEST_SCOPE_STATUS.md) and the [complete delivery checklist](docs/FINAL_DELIVERY_CHECKLIST.md) for coverage and verification details.

## Saves and costs

Game save slots use browser IndexedDB in the browser profile where you play; there is no hosted game backend. Node.js, npm, VS Code, and the open-source project dependencies can be used without subscription fees. `npm ci` downloads the locked dependencies from npm the first time.

## VS Code shortcuts

Use **Terminal → Run Task** for the included install, run, build, test, and lint tasks, or run their npm equivalents from `frontend`.
