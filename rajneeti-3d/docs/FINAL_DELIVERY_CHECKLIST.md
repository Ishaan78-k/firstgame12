# Final delivery checklist: RAJNEETI 3D

> This is a coverage/status checklist, not a claim that every item below is already implemented. The “major gaps” are intentionally identified as unfinished work in the application. See [`REQUEST_SCOPE_STATUS.md`](REQUEST_SCOPE_STATUS.md) for details on currently implemented systems.

## Implemented PM coalition-minister request

In the PM Office's **Cabinet** tab, partner-held ministry performance and complaints are visible. When performance is below 50 or complaints reach 4, the PM can request the coalition partner to replace its minister. The partner's deterministic decision considers the evidence and coalition trust: approval resets performance to a 55 baseline and eases complaints; refusal lowers coalition trust and approval. The PM cannot dismiss that partner's minister directly, and requests have a 90-day cooldown.

## Major gaps from the full request

- **Photorealistic characters and city:** Photorealistic or licensed human assets, detailed faces/textures, eye blinking/lip sync, and natural sitting/meeting animation remain unfinished. Characters and the city remain stylized low-poly.
- **Vehicles:** Enterable cars, manual driving, AI driver, car-door and exit animations, first-/third-person vehicle cameras, public transport, and realistic traffic remain unfinished. The PM convoy follows existing on-foot movement; it is not a driveable vehicle.
- **Full police dispatch:** Visible police dispatch cars travelling across the city, physical officer arrival animations, and dispatch at the player's arbitrary map position remain unfinished. Current security arrival is a two-day simulation transition and visible follower count is abstracted.
- **Complete smartphone and notifications:** Contacts, driver call, political messages, cabinet notifications, a full government-alert inbox, and fully interactive notifications remain unfinished.
- **Political memory and fairness:** Persistent AI political-party memory, evidence-backed warning investigations, unfair-pressure tracking, and the full connected coalition consequences for unjustified warnings remain unfinished.
- **3D politics and districts:** 3D sitting/gesturing political meetings, animated MPs in the Parliament chamber, votes using every required motion-specific threshold, and full constituency/district development dashboards remain unfinished.
- **Citizen/media consequences:** Broader citizen/media reaction and public petitions tied to every investment or cabinet event remain unfinished. Current project outcomes change modeled economic and government indicators, while existing protests have their own consequences.
- **Career progression:** Full political career progression, constitutional President role/powers, legacy score, and every requested main-menu destination remain unfinished.

## Local setup

Open the extracted `rajneeti-3d` folder in VS Code. In a terminal, run:

```bash
cd frontend
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal (usually `http://localhost:5173`). Node.js 20+ and internet access for the first dependency install are required. No paid API, API key, account, subscription, hosted backend, or cloud inference is required.

## Verification completed

- `npm run lint` passed.
- `npm run build` passed with real dependencies. Vite emits a non-fatal large-bundle advisory due to the Babylon.js bundle.
- `npm run test` passed: 10 files and 145 tests, including investment lifecycle, deterministic outcomes, security dispatch/cost/capacity, offline advisor state, v7 save migration, and partner approval/refusal for minister replacement.
- The repository's dependency installation reports six audit advisories across dependency classes; no dependency changes were needed for this feature work.
