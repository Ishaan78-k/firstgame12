# Status against the RAJNEETI 3D specification

This note separates working integrated features from the larger vision still outstanding. It describes the supplied code and this update; it is not a claim that every item in the original brief is complete or play-tested.

## Working and connected systems

- Fictional procedural political setting, player/party creation, a compact stylized city, walking controls, building interactions, day progression, map, and quality settings.
- 300+ party membership and funded recruitment, candidate selection, fictional parties, 180-seat elections, campaigning, pre-election alliances and seat sharing, coalition formation and repeat elections.
- Government budgets, tax/spending, economy, a 12-ministry cabinet, ministry performance metrics, bill voting, coalition satisfaction, confidence votes, crises, opposition actions, protests, police posture choices, and public promises.
- Smartphone news/calendar/popularity/finance/save functions, government alerts, meeting/coalition requests, and a government office UI.
- **Government investments:** three fictional project proposals with review, one round of negotiation, approve/reject actions, public support commitments, seeded delayed outcomes, jobs/growth/unemployment changes on success, and debt/approval impacts on failure.
- **Prime Minister security dispatch:** the phone offers 5/10/15/20/custom additional officers, 40 total roster slots with 10 baseline assigned, capacity limits, two-day in-game arrival, monthly public operating cost, dismissal, and a dynamically scaled group of existing 3D follower agents alongside the PM convoy. The exact headcount is simulated; only up to 12 stylized follower models are rendered. Dispatch vehicles driving to the player, officers exiting vehicles, and the detailed public-policing allocation loop are not implemented.
- **Offline political advisor:** deterministic advice cards reflect seat/coalition risk, low partner satisfaction, crises, weak ministries, inflation, unemployment, fiscal headroom, and available investment proposals. It uses game state and local code only—not a paid API or cloud LLM—and leaves decisions to the player.
- **PM coalition minister replacement request:** the Cabinet tab exposes performance/complaints for partner-held ministries. When performance is below 50 or complaints reach 4, the PM can ask the owning partner to replace its minister; the partner's deterministic decision weighs evidence and trust. Acceptance resets performance to a 55 baseline and eases complaints; refusal lowers coalition trust and approval. Direct PM dismissal is not allowed, and requests have a 90-day cooldown.
- **Save compatibility:** saves written by format v7 are accepted and emitted as v8. Existing player, party, clock, member, election, and campaign progress are preserved; missing new investment/security fields are initialized safely.

## Major gaps from the full request

- Photorealistic or licensed human assets, detailed faces/textures, eye blinking/lip sync, and natural sitting/meeting animation. Characters and the city remain stylized low-poly.
- Enterable cars, manual driving, AI driver, car-door and exit animations, first-/third-person vehicle cameras, public transport, and realistic traffic. The PM convoy follows existing on-foot movement; it is not a driveable vehicle.
- Visible police dispatch cars travelling across the city, physical officer arrival animations, and dispatch at the player's arbitrary map position. Current security arrival is a two-day simulation transition and visible follower count is abstracted.
- Complete phone suite (contacts, driver call, political messages, cabinet notifications, full government-alert inbox) and fully interactive notifications.
- Persistent AI political-party memory, evidence-backed warning investigations, unfair-pressure tracking and the full connected coalition consequences for unjustified warnings.
- 3D sitting/gesturing political meetings, animated MPs in the Parliament chamber, votes using every required motion-specific threshold, and full constituency/district development dashboards.
- Broader citizen/media reaction and public petitions tied to every investment or cabinet event; current project outcomes change modeled economic and government indicators, and existing protests have their own consequences.
- Full political career progression, constitutional President role/powers, legacy score, and every requested main-menu destination.

## Local setup and verification

- Open the extracted `rajneeti-3d` folder in VS Code. From `frontend`, run `npm ci`, then `npm run dev` and open the local Vite URL.
- No paid API, API key, account, subscription, hosted backend, or cloud inference is required. First-time dependency installation needs internet access.
- `npm run lint` passed.
- `npm run build` passed with real dependencies. Vite emits a non-fatal large-bundle advisory due to the Babylon.js bundle.
- `npm run test` passed: 10 files and 145 tests, including investment lifecycle, deterministic outcomes, security dispatch/cost/capacity, offline advisor state, v7 save migration, and partner approval/refusal for minister replacement.
- The repository's dependency installation reports six audit advisories across dependency classes; no dependency changes were needed for this feature work.

## Zero-cost boundary

The game code runs locally in a browser and does not depend on paid cloud services. The advisor intentionally uses a transparent deterministic heuristic rather than external AI inference. If you later choose photorealistic licensed models, hosted multiplayer, or cloud AI, those may add licensing or recurring costs; they are not needed to run this folder.
