import { MINISTRY_DEFS, SECTORS, TAX_LIMITS, BILL_BY_ID, type BillRecord, type GovState } from './types';
import { validSpending, validTaxes } from './economy';
import { validateProtests } from '../world/validate';
import { CRISIS_BY_ID, type ActiveCrisis, type CrisisId, type CrisisRecord } from '../world/crises';
import { createInvestmentBoard } from './investments';
import { initialSecurity, validateSecurity } from './security';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Returns a clean GovState or null. `memberIds` are all valid member ids; ministers must be among them and unique. */
export function validateGovState(raw: unknown, memberIds: Set<string>, seed = 1): GovState | null {
  if (!isObj(raw)) return null;
  const { economy, taxes, spending, cabinet, satisfaction, partners, bills, history } = raw;
  for (const k of ['startDay', 'lastMonthDay', 'treasury', 'approval'] as const) if (!isNum(raw[k])) return null;
  if ((raw.treasury as number) < 0 || (raw.approval as number) < 0 || (raw.approval as number) > 100) return null;
  if ((raw.lastMonthDay as number) < (raw.startDay as number)) return null;
  if (raw.status !== 'governing' && raw.status !== 'fallen') return null;
  if (raw.fallenReason !== null && !isStr(raw.fallenReason)) return null;
  if (!isObj(economy) || !(['gdp', 'growth', 'inflation', 'unemployment', 'debt'] as const).every((k) => isNum(economy[k])) || (economy.gdp as number) <= 0 || (economy.debt as number) < 0) return null;
  if (!isObj(taxes) || !(Object.keys(TAX_LIMITS) as (keyof typeof TAX_LIMITS)[]).every((k) => isNum(taxes[k]))) return null;
  const t = { income: taxes.income as number, corporate: taxes.corporate as number, gst: taxes.gst as number };
  if (validTaxes(t)) return null;
  if (!isObj(spending) || !SECTORS.every((k) => isNum(spending[k]))) return null;
  const sp = Object.fromEntries(SECTORS.map((k) => [k, spending[k] as number])) as GovState['spending'];
  if (validSpending(sp)) return null;
  if (!isObj(cabinet)) return null;
  const cab: Record<string, string> = {};
  const seen = new Set<string>();
  for (const [k, v] of Object.entries(cabinet)) {
    if (!MINISTRY_DEFS.some((d) => d.id === k) || !isStr(v) || !memberIds.has(v) || seen.has(v)) return null;
    seen.add(v);
    cab[k] = v;
  }
  if (!Array.isArray(partners) || !partners.every(isStr) || !isObj(satisfaction)) return null;
  const sat: Record<string, number> = {};
  for (const [k, v] of Object.entries(satisfaction)) { if (!isNum(v) || v < 0 || v > 100) return null; sat[k] = v; }
  if (!Array.isArray(bills)) return null;
  const recs: BillRecord[] = [];
  for (const b of bills as unknown[]) {
    if (!isObj(b) || !isStr(b.billId) || !(b.billId in BILL_BY_ID) || !isNum(b.day) || typeof b.passed !== 'boolean' || !isNum(b.yes) || !isNum(b.no) || !isNum(b.abstain)) return null;
    recs.push({ billId: b.billId as BillRecord['billId'], day: b.day, passed: b.passed, yes: b.yes, no: b.no, abstain: b.abstain });
  }
  if (!Array.isArray(history) || !history.every(isStr)) return null;
  let crisis: ActiveCrisis | null = null;
  if (raw.crisis !== null) {
    const c = raw.crisis;
    if (!isObj(c) || !isStr(c.id) || !(c.id in CRISIS_BY_ID) || !isNum(c.startDay) || !isNum(c.deadline) || c.deadline < c.startDay) return null;
    crisis = { id: c.id as CrisisId, startDay: c.startDay, deadline: c.deadline };
  }
  if (!isNum(raw.lastCrisisDay) || !Array.isArray(raw.crisisLog)) return null;
  const clog: CrisisRecord[] = [];
  for (const r of raw.crisisLog as unknown[]) {
    if (!isObj(r) || !isStr(r.id) || !(r.id in CRISIS_BY_ID) || !isNum(r.day) || !isNum(r.approvalChange)) return null;
    if (r.choice !== null && (!Number.isInteger(r.choice) || (r.choice as number) < 0 || (r.choice as number) > 2)) return null;
    clog.push({ id: r.id as CrisisId, day: r.day, choice: r.choice as number | null, approvalChange: r.approvalChange });
  }
  const protests = validateProtests(raw.protests);
  if (!protests) return null;
  const requests = Array.isArray(raw.switchingRequests) ? raw.switchingRequests : [];
  const metrics = isObj(raw.ministryMetrics) ? raw.ministryMetrics : {};
  for (const v of Object.values(metrics)) { if (!isObj(v) || !isNum(v.performance) || v.performance < 0 || v.performance > 100 || !isNum(v.budget) || v.budget < 0 || !isNum(v.complaints) || v.complaints < 0 || !isNum(v.ministerSatisfaction) || v.ministerSatisfaction < 0 || v.ministerSatisfaction > 100) return null; }
  const meetings = Array.isArray(raw.meetings) ? raw.meetings : [];
  if (!meetings.every((m) => isObj(m) && isStr(m.id) && isStr(m.fromPartyId) && isStr(m.personName) && ['support', 'policy', 'ministries'].includes(String(m.topic)) && isNum(m.trust) && m.trust >= 0 && m.trust <= 100 && isStr(m.offer) && ['pending', 'accepted', 'rejected', 'countered', 'postponed'].includes(String(m.status)))) return null;
  for (const meeting of meetings as unknown[]) {
    if (!isObj(meeting)) return null;
    if (meeting.requestType !== undefined && meeting.requestType !== 'minister-replacement') return null;
    if (meeting.requestType === 'minister-replacement' && (!isStr(meeting.ministryId) || !MINISTRY_DEFS.some((m) => m.id === meeting.ministryId) || !isNum(meeting.day) || meeting.day < 1 || !['accepted', 'rejected'].includes(String(meeting.status)))) return null;
    if (meeting.requestType === undefined && (meeting.ministryId !== undefined || meeting.day !== undefined)) return null;
  }
  if (!requests.every((r) => isObj(r) && isStr(r.id) && (r.direction === 'in' || r.direction === 'out') && isStr(r.politicianName) && isStr(r.partyId) && isStr(r.constituency) && isNum(r.loyalty) && r.loyalty >= 0 && r.loyalty <= 100 && isStr(r.reason) && ['pending', 'accepted', 'rejected', 'negotiated'].includes(String(r.status)))) return null;
  const investmentsRaw = raw.investments;
  let investments: GovState['investments'];
  if (investmentsRaw === undefined) investments = createInvestmentBoard(seed); // v7 save migration
  else {
    if (!isObj(investmentsRaw) || !isNum(investmentsRaw.jobsCreated) || !Number.isInteger(investmentsRaw.jobsCreated) || investmentsRaw.jobsCreated < 0 || !Array.isArray(investmentsRaw.proposals)) return null;
    const seenInvestmentIds = new Set<string>();
    const proposals: GovState['investments']['proposals'] = [];
    for (const p of investmentsRaw.proposals as unknown[]) {
      const statuses = ['offered', 'reviewed', 'negotiated', 'approved', 'rejected', 'completed', 'failed'];
      if (!isObj(p) || !isStr(p.id) || seenInvestmentIds.has(p.id) || !isStr(p.company) || !isStr(p.sector)) return null;
      if (!isNum(p.investmentCrore) || p.investmentCrore <= 0 || !isNum(p.publicSupportCrore) || p.publicSupportCrore < 0 || !isNum(p.expectedJobs) || p.expectedJobs < 0 || !Number.isInteger(p.expectedJobs) || !isNum(p.successChance) || p.successChance < 0 || p.successChance > 100) return null;
      if (!isStr(p.status) || !statuses.includes(p.status) || typeof p.reviewed !== 'boolean' || typeof p.negotiated !== 'boolean') return null;
      if (p.decisionDay !== null && (!isNum(p.decisionDay) || p.decisionDay < 1) || p.dueDay !== null && (!isNum(p.dueDay) || p.dueDay < 1) || p.outcome !== null && !isStr(p.outcome)) return null;
      if (p.status === 'approved' && (p.decisionDay === null || p.dueDay === null || p.dueDay < p.decisionDay)) return null;
      if (['rejected', 'completed', 'failed'].includes(p.status) && (p.decisionDay === null || !isStr(p.outcome))) return null;
      seenInvestmentIds.add(p.id);
      proposals.push({ id: p.id, company: p.company, sector: p.sector, investmentCrore: p.investmentCrore, publicSupportCrore: p.publicSupportCrore, expectedJobs: p.expectedJobs, successChance: p.successChance, status: p.status as GovState['investments']['proposals'][number]['status'], reviewed: p.reviewed, negotiated: p.negotiated, decisionDay: p.decisionDay as number | null, dueDay: p.dueDay as number | null, outcome: p.outcome as string | null });
    }
    investments = { proposals, jobsCreated: investmentsRaw.jobsCreated };
  }
  const security = raw.security === undefined ? initialSecurity() : validateSecurity(raw.security);
  if (!security) return null;
  return {
    startDay: raw.startDay as number, lastMonthDay: raw.lastMonthDay as number, treasury: raw.treasury as number,
    taxes: t, spending: sp,
    economy: { gdp: economy.gdp as number, growth: economy.growth as number, inflation: economy.inflation as number, unemployment: economy.unemployment as number, debt: economy.debt as number },
    cabinet: cab, satisfaction: sat, partners: partners as string[], approval: raw.approval as number, bills: recs,
    status: raw.status, fallenReason: raw.fallenReason as string | null, history: history as string[],
    crisis, lastCrisisDay: raw.lastCrisisDay as number, crisisLog: clog, protests,
    switchingRequests: requests as GovState['switchingRequests'], meetings: meetings as GovState['meetings'], ministryMetrics: metrics as GovState['ministryMetrics'], ministryRemoved: Array.isArray(raw.ministryRemoved) && raw.ministryRemoved.every(isStr) ? raw.ministryRemoved as string[] : [],
    investments, security,
  };
}
