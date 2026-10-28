# RAJNEETI 3D — Rise to Power (Phases 1-6: city, party management, elections, Prime Minister mode, living world, public protests)

A cartoon-style 3D political life simulation in the browser. Everything in it is fictional.

## Status (honest)

| Area | Status |
|---|---|
| Simulation and gameplay | Includes elections, coalition/ministry systems, protests, government investment outcomes, Prime Minister security, and offline advisor logic. |
| React/Babylon.js UI and 3D scene | Compiled with the real dependencies; manual playtesting is still needed for visual behavior and balance. |
| Vitest suite (`src/tests`) | 10 files and 142 tests passed with real Vitest; `npm run lint` and `npm run build` also passed. |
| Playwright, React Testing Library, backend, PostgreSQL | Not started |

Use [`README_VSCODE.md`](README_VSCODE.md) for the clean local VS Code setup and current commands. See the later scope note for verified work and known gaps.

## Prerequisites
Node.js 20+ and npm.

## Install and run
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run lint
npm run test
```

## What Phase 1 contains
- Main menu (New / Continue / Load / Settings / How to Play / Credits / Exit); Continue is disabled with no save.
- Leader and party creation (name, pronouns, party name, abbreviation, colour).
- Procedural low-poly city: party HQ (shows your party name, colour and flag), government building, election commission, park, residential and commercial blocks, rally ground, roads, sidewalks, parking, instanced trees, streetlights.
- Third-person controller: WASD, Shift, Space, mouse-drag camera, gravity, AABB collision, procedural walk/run/jump/wave animation. Touch joystick, run and act buttons share the same input state as the keyboard.
- Interactions (E): HQ door opens the President's Office dashboard, secretary and shopkeeper have branching dialogue that changes game state, other buildings show what unlocks later.
- Clock: 1 real minute = 1 game hour, speeds 1x/4x/12x, skip day, 180-day election countdown, day/night lighting and streetlights.
- Smartphone (I): news, calendar, popularity, finance, save. Map (M). Pause (Esc).
- Save/load: three IndexedDB slots, versioned and validated schema.

Only the HQ door, the two NPCs and the building prompts are interactive. Shops and houses are decoration.

## Phase 2 so far
- 300 seeded members (unique IDs, varied traits), 180 constituencies (1,000,000 voters total, six profiles with different indicators/issues).
- Candidate Selection Room (menu UI, opened from the dashboard): search, sort, compare, suitability score, assign/replace/remove, explicit Auto-select.
- Ticket rules enforced in code: one ticket per member, one candidate per seat, valid IDs only, max 180.
- Rebellion: displaced or passed-over senior members react by personality (accept, reconsider, dissatisfied, oppose, resign, defect, go independent); outcomes change loyalty, membership and party popularity.
- Not done yet: party customisation beyond name/colour, finance office UI, 3D interiors, nomination deadline.

## Phase 3: elections
- **Five rival parties** (NPA, JSM, HKP, RPD, GFF) with their own ideology, national strength and regional strongholds, generated from the game seed.
- **Voter model**: each of the 180 seats scores every candidate (candidate quality, party mood, local history, ideology fit for the seat type, campaign boost, local noise). Scores become vote shares, then whole votes. Votes always add up exactly (largest-remainder rounding) and turnout depends on the seat.
- **Your party's ideology** is the most common ideology among your official candidates. Seats with no official candidate give you no votes.
- **Rebellion has consequences**: a member who went independent stands in their home seat and can win it; a member who defected strengthens the rival party there; a candidate who opposes your leadership costs you votes.
- **Campaign** (Day 91 to Day 180, from the Election & Campaign Centre): rallies (₹1.5 crore, max 3 per seat), local ads, national ads. All paid from party funds. Returns diminish, so target close races. A poll estimate (deliberately noisy) lists the closest seats.
- **Election day** (Day 181): "Hold the national election" in the Election & Campaign Centre (dashboard button or the Election Commission building). The result is fixed by the game seed and your choices, so reloading a save cannot reroll it. Winners and losers keep their margin in their member record.
- **Coalitions**: with no majority (91 of 180) you choose partners, or sit in opposition and the other parties form a government. A deal needs 91 seats and every partner willing to serve under the largest party in the group. Ministries (12) are shared by seats.
- **Saves are now version 3** (Phase 2 saves will not load). Campaign spending and the election outcome are saved and validated.
- Not done yet: manifesto and promises, opinion polls over time, running the government (Phase 4), 3D polling-day scenes.

## Phase 4: Prime Minister mode
Available when your party **leads** the government (majority, or a coalition where you hold the most seats). Open it from the **Government Building** (E), the dashboard, or the Government tab of the Election Centre.
- **Time**: the government updates once every 30 days from the day it took office. Use the skip buttons (7 / 30 / 90 days) or let the clock run.
- **Budget**: three taxes (income, corporate, GST) and seven spending sectors, each from 40% to 200% of normal. Revenue, spending, interest and the monthly balance are shown. A deficit drains the treasury; when it is empty the state borrows and debt grows. The treasury is separate from party funds.
- **Economy**: growth, inflation, unemployment, debt and GDP respond to taxes, spending, deficits and cabinet quality, with a little seeded noise. Approval drifts toward how people feel about growth, prices, jobs, services and taxes.
- **Cabinet**: 12 ministries, shared between your party and partners by seats (you get the top posts first). Appoint any active party member to the posts you hold, or auto-fill with the best available. Each member has a skill score. Vacant posts count as weak. Ministers who leave your party lose their post at the next update.
- **Parliament**: seven bills (tax cut, GST rise, rural jobs, infrastructure, anti-corruption, labour reform, green transition). Every one of the 180 seats votes yes, no or abstains, by ideology fit and coalition loyalty. A bill passes if yes beats no. Failed bills wait 30 days; passed ones are law and change taxes, spending, growth and approval.
- **Allies**: each coalition partner has a satisfaction score (ministries versus seats, government popularity, laws that suit it). Below 20 a partner walks out and, if you drop under 91 seats, a confidence vote decides whether you survive with outside support. A lost vote, or collapsed approval without a safe majority, ends the government.
- **Saves are now version 4** (older saves will not load). The government state is validated on load: ranges, unique ministers, known bills.
- Not done yet: opposition and junior-partner play, the next election after your term, scandals and crises, manifesto promises, 3D interiors.

Tuning notes: in simulation, default policy over five years kept the economy stable in all 18 leader games tried, and no government fell. If you want more drama, change the thresholds in `simulation/government/state.ts` and `economy.ts`.

## Phase 5: the living world
- **Crises** (while you govern): about one every six months. Nine kinds (floods, drought, fuel shock, scandal, farm protest, border tension, outbreak, bank trouble, transport strike). Each has three answers: a costly one, a cheap one, and doing nothing. Costs come from the **government treasury**. The minister in the matching ministry changes the outcome: a strong one helps, an empty chair hurts, and a partner-held ministry is out of your hands. You have 30 days; an unanswered crisis gets worse. Government months wait while a crisis is open, so skipping time cannot silently burn it. Find it in the Government Office (Crises tab, red banner, HUD button).
- **Opposition play** (when a rival forms the government and you do not join it): the **Opposition Office** (Government Building, dashboard). Four actions paid from party funds with cooldowns: press conference, protest march, expose a scandal, grassroots drive. Marches and exposes can backfire. The ruling party's approval wanders month by month. Below 40% you can move a **no-confidence motion**: an unpopular government loses MPs to rebellion, and one that falls below 91 votes is out. A failed motion costs standing and has a 60-day cooldown.
- **Repeat elections**: a term is 1800 days (five years). The campaign opens 90 days before election day. Then tickets reset, members are five years older (the very old retire), rivals drift, and a rival that governed badly loses ground. Each election has its own seeded luck. Your old government keeps running until the new vote. The Election Centre keeps an **election history**.
- **Early elections**: a fallen government (or a successful motion) lets you call an election 45 days out.
- **Party donations**: after the first election, funds arrive monthly (more when you are popular and in power) so later campaigns are possible.
- **Saves are now version 5** (older saves will not load). Term, election history, opposition state, crisis state and donation date are validated on load, including that they agree with each other.
- 

Tuning notes: in simulation, a five-year government meets about nine to ten crises; a rival government's approval fell below 40% at some point in about six games out of ten, so a motion is usually reachable. Numbers live in `simulation/world/crises.ts` (chance, costs, effects) and `simulation/world/opposition.ts` (action effects, thresholds).

## Phase 6: public protests
The original Phase 6 specification was not in the project files, so this was built from the Phase 6A/6B brief.

**6A: simulation (while you are Prime Minister)**
- **Public anger** (0 to 100) is computed from unemployment, inflation, tax levels, health/education/farm spending, ignored scandals and farm crises, approval and broken promises, plus lingering unrest. It sets the monthly chance of a protest (at least 60 days apart). In default play expect roughly six to nine protests in five years.
- **Seven causes**: jobs, prices, taxes, farmers, public services, corruption, anti-government rally. Each has a crowd size, an anger level and three answers: a costly concession, a cheap promise with a deadline, or rejecting the demands. Costs come from the government treasury. Answer within 21 days or the protest lapses, with a default police response and an approval hit.
- **Police and security**: pick a posture (minimal, standard, heavy, full force) with a cost. The outcome (peaceful, property damage, or a clash with injuries and arrests) depends on crowd anger, size, force and public trust in the police. Heavy force on a calm crowd is heavy-handed. Results are seeded, so reloading cannot reroll them.
- **Promises** have a measurable target and a deadline (unemployment, inflation, a tax rate, sector spending, a bill, or approval). They only count on the day they fall due: kept promises raise approval, broken ones cut it and feed anger.
- **Election consequences**: kept promises add up to +3 points to your vote; broken promises and unrest subtract up to 12. Party popularity also follows approval as before.
- **Where**: Government Building, Prime Minister's Office, **Protests** tab (also a HUD chip when a crowd is outside). Saves are now **version 6** (older saves will not load); protest state is validated on load.

**6B: 3D scene**
- A crowd gathers outside the Government Building: up to 36 / 80 / 150 figures on low / medium / high quality, with signs, two banners, police barricades and officers whose number and gear follow your chosen posture. Two security officers always guard the door (press E near them).
- The crowd reacts to your decisions while it is outside: a tax cut or a popular bill makes it cheer, a GST hike or a failed bill makes it jeer, a clash makes it surge, and an answered protest disperses over about 25 to 40 seconds.
- Rendering is built for smooth play: thin instances (a handful of draw calls), 20 Hz crowd animation, no animation when the camera is over 110 units away or nobody is there, and nothing drawn at all when there is no protest.

## Phase 7 update in this delivery
- Added a persisted Secret Meetings tab to the Government Office. Meetings expose the counterpart, party, topic, trust and offer, with working Accept, Reject, Counteroffer and Postpone decisions. Outcomes affect approval and the government history, and are validated in browser saves.
- Existing coalition withdrawal, confidence votes, party-switching requests, minister resignations, protest security, office scene and PM escort remain integrated.
- Verification completed in this environment: `npm run build` passed and `npm run test` passed (135 tests).

## Coalition Minister Gameplay update
- Junior coalition partners now receive an assigned-ministry dashboard instead of the old “not built yet” fallback.
- Partner-only controls include appoint/replace ministers, ministry performance, budget allocation, service improvements, staff recruitment, policy actions, complaint handling, PM meeting requests, skip 7/30/90 days, coalition stability and End Alliance.
- Ministry performance, budgets, complaints and minister satisfaction are persisted in government saves. Decisions consume the government treasury and affect approval/history.
- Ending the alliance removes the player from the coalition, recalculates seats and transfers the player to opposition gameplay. PM-only budget, cabinet and parliament controls remain unavailable to junior partners.
- Final verification: production build passed and all 135 tests passed.

## Coalition Ministry Office update
- Added a dedicated 3D Coalition Ministry Office building at the new ministry location. Junior coalition partners can walk there and press E to open their restricted ministry dashboard.
- Assigned ministries expose performance, budget, complaints and minister satisfaction, with decisions for budget allocation, service improvement, staff recruitment, new policies and complaint handling.
- Ministry performance and complaints change during monthly simulation updates. Sustained poor performance can trigger an automatic PM/system review that withdraws the ministry from the junior partner. The dashboard reports which ministries were withdrawn.
- The junior partner remains blocked from PM-only powers and can continue to appoint/replace ministers in remaining assigned ministries.
- Verification: production build passed and all 135 tests passed.

## Ultimate Simulator — Membership Expansion update
- The dashboard now separates Total Party Members, Elected MPs, Party Workers, Senior Leaders and Active Volunteers.
- The original 300 generated members are ordinary party members/candidates; elected MPs are calculated only from election results. Recruiting ordinary members does not add parliamentary seats.
- Added funded recruitment methods: membership drives, youth programmes, local office drives, door-to-door campaigns, social media campaigns and experienced-politician outreach. Each consumes party funds and advances the clock by seven days.
- Recruited members are saved and can later be used in candidate selection and minister appointments.
- Save validation now supports more than 300 members while remaining compatible with existing 300-member saves.
- Verification: production build passed and all 135 tests passed.

## Ultimate Simulator — Fast Alliances and Parliament update
- Added a pre-election Political Alliances tab with fictional rival parties, AI acceptance probability based on ideology, popularity and party strength, proposal responses and accepted alliance tracking.
- Added a Parliament Chamber panel with live YES/NO/ABSTAIN totals and party-by-party voting rows using the existing loyalty, coalition satisfaction and ideology-aware voting engine.
- Government bill outcomes now remain visible in the Parliament Chamber after voting.
- This is the fast functional pass; detailed 3D MP hand-raising/camera cinematics, constituency-by-constituency seat-sharing tables, persistent AI leader personalities and the full Political War Room remain deeper follow-up work.
- Verification: production build passed and all 135 tests passed.

## Ultimate Simulator — Strategic Systems Deep Pass
- Added deterministic AI leader personalities, negotiation skill and ministry-demand traits to fictional rival parties.
- Added constituency-level seat-sharing controls for accepted pre-election allies. Offering a constituency removes the player candidate from that seat so ordinary membership does not create parliamentary seats. Seat-sharing agreements are saved.
- Added the Political War Room with coalition leader calls, stability review, parliament preparation and alliance/seat-sharing access.
- Added a Parliament Chamber location in the 3D city; approaching it and pressing E opens the voting chamber scoreboard.
- Added persistent-style leader personality display in alliance negotiations and connected War Room actions to the existing meeting, coalition and parliament systems.
- Production build passed successfully.

## Architecture
`frontend/src`: `game/engine` (Babylon scene, character, collision), `game/controllers` (shared input), `simulation` (pure game rules, no rendering), `state` (Zustand store), `services` (IndexedDB, save schema), `components` + `ui` (React), `data` (constants, dialogue, world layout).

## Deployment
`frontend/vercel.json` is included. Import the repo in Vercel with root directory `frontend`.

## Known limitations
Photorealistic/licensed human assets, enterable or drivable vehicles, physical dispatch cars, full smartphone suite, persistent political AI memory, full 3D meetings and a political legacy system are not complete. The junior-partner ministry gameplay is implemented but remains narrower than the full original brief. The election model has been balanced by simulation, not extensive manual playtesting; tune numbers in `simulation/election/model.ts` and `parties.ts`. No Havok physics (simple collision is used). No audio. Graphics quality changes apply on the next game start.

## Ultimate Simulator — Government investment, Prime Minister security, and offline advisor update
- Added a Government Office Investments tab with three fictional proposals, deterministic economic reviews, negotiation, approve/reject actions, seeded delayed results, and connected changes to jobs, growth, unemployment, debt, and approval.
- Added a smartphone Call Police Security app for the serving Prime Minister: 40-officer roster, 10 standing officers, 5/10/15/20/custom request sizes, two in-game day arrival, monthly deployment costs, dismissal, and a dynamically sized 3D follower group with the existing PM convoy.
- Added a local deterministic political advisor that reviews government stability, coalition satisfaction, ministry performance, fiscal risks, crises, and investment opportunities without paid APIs or cloud inference.
- Save format v8 migrates v7 saves without discarding player/campaign progress and supplies defaults for new government features.
- Latest verification with real dependencies: `npm run lint`, `npm run build`, and all 145 tests passed. Vite reports a non-fatal large-bundle advisory.

## PM Coalition Minister Replacement Requests
- The PM Cabinet tab now shows performance and complaints for all ministries, including coalition-partner-held posts.
- When a partner ministry has performance below 50 or at least 4 complaints, the PM can request that the coalition partner replace its minister; the PM cannot dismiss a partner's minister directly.
- The partner AI decides based on ministry performance, complaints, coalition trust, and the saved game seed. Acceptance resets the ministry's performance baseline to 55 and eases complaints; refusal reduces coalition trust and approval. Requests have a 90-day cooldown.
- Verification: `npm run lint`, `npm run build`, and all 145 tests passed.
