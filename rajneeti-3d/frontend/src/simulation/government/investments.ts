import { Rng, hashString } from '../core/rng';
import type { Economy, InvestmentBoard, InvestmentProposal } from './types';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const PROJECTS: ReadonlyArray<Omit<InvestmentProposal, 'id' | 'status' | 'reviewed' | 'decisionDay' | 'dueDay' | 'outcome' | 'negotiated'>> = [
  { company: 'Asterion Transit Works', sector: 'public transport', investmentCrore: 500, publicSupportCrore: 65, expectedJobs: 7200, successChance: 74 },
  { company: 'Bluefen Solar Cooperative', sector: 'clean energy', investmentCrore: 320, publicSupportCrore: 42, expectedJobs: 4100, successChance: 81 },
  { company: 'CivicLink Freight Systems', sector: 'regional logistics', investmentCrore: 680, publicSupportCrore: 88, expectedJobs: 9600, successChance: 66 },
];

export function createInvestmentBoard(seed: number): InvestmentBoard {
  const rng = new Rng(seed ^ hashString('initial-investment-offers'));
  return {
    jobsCreated: 0,
    proposals: PROJECTS.map((project, i) => ({
      ...project,
      id: `offer-${i + 1}-${Math.abs(seed % 100000)}`,
      successChance: clamp(project.successChance + rng.int(-5, 5), 45, 90),
      status: 'offered',
      reviewed: false,
      negotiated: false,
      decisionDay: null,
      dueDay: null,
      outcome: null,
    })),
  };
}

export type InvestmentDecision = 'review' | 'negotiate' | 'approve' | 'reject';
export type InvestmentAction = { ok: true; board: InvestmentBoard; treasury: number; message: string } | { ok: false; error: string };

export function decideInvestment(board: InvestmentBoard, treasury: number, proposalId: string, decision: InvestmentDecision, day: number): InvestmentAction {
  const proposal = board.proposals.find((item) => item.id === proposalId);
  if (!proposal || !['offered', 'reviewed', 'negotiated'].includes(proposal.status)) return { ok: false, error: 'That investment proposal is no longer open.' };
  if (decision === 'review') {
    if (proposal.reviewed) return { ok: false, error: 'The economic review is already available on this proposal.' };
    const proposals = board.proposals.map((item) => item.id === proposalId ? { ...item, reviewed: true, status: 'reviewed' as const } : item);
    return { ok: true, board: { ...board, proposals }, treasury, message: `Economic review completed for ${proposal.company}. It estimates a ${proposal.successChance}% chance of success; this is a forecast, not a guarantee.` };
  }
  if (decision === 'negotiate') {
    if (proposal.negotiated) return { ok: false, error: 'The company has already responded to one round of negotiations.' };
    const proposals = board.proposals.map((item) => item.id === proposalId ? {
      ...item,
      status: 'negotiated' as const,
      negotiated: true,
      publicSupportCrore: Math.max(10, Math.round(item.publicSupportCrore * 0.72)),
      successChance: Math.max(35, item.successChance - 5),
    } : item);
    return { ok: true, board: { ...board, proposals }, treasury, message: `${proposal.company} accepted revised terms: lower public support in exchange for a slightly higher delivery risk.` };
  }
  if (decision === 'reject') {
    const proposals = board.proposals.map((item) => item.id === proposalId ? { ...item, status: 'rejected' as const, decisionDay: day, outcome: 'The government declined the proposal; no public funds were committed.' } : item);
    return { ok: true, board: { ...board, proposals }, treasury, message: `The government rejected ${proposal.company}'s proposal without spending public money.` };
  }
  if (treasury < proposal.publicSupportCrore) return { ok: false, error: `The government treasury needs ₹${proposal.publicSupportCrore} crore of public support.` };
  const proposals = board.proposals.map((item) => item.id === proposalId ? {
    ...item,
    status: 'approved' as const,
    decisionDay: day,
    dueDay: day + (item.negotiated ? 120 : 90),
    outcome: null,
  } : item);
  return {
    ok: true,
    board: { ...board, proposals },
    treasury: treasury - proposal.publicSupportCrore,
    message: `${proposal.company} investment approved. ₹${proposal.publicSupportCrore} crore of public support is committed; the project outcome is due after implementation.` ,
  };
}

export interface InvestmentResolution { board: InvestmentBoard; economy: Economy; approval: number; events: string[] }

/** Resolves projects only at/after their saved due day, using a stable seed so save/load cannot reroll outcomes. */
export function resolveInvestments(board: InvestmentBoard, economy: Economy, approval: number, seed: number, day: number): InvestmentResolution {
  const events: string[] = [];
  let jobsCreated = board.jobsCreated;
  let nextEconomy = economy;
  let nextApproval = approval;
  const proposals = board.proposals.map((proposal) => {
    if (proposal.status !== 'approved' || proposal.dueDay === null || proposal.dueDay > day) return proposal;
    const rng = new Rng(seed ^ hashString(`investment-outcome:${proposal.id}`));
    if (rng.int(1, 100) <= proposal.successChance) {
      jobsCreated += proposal.expectedJobs;
      nextEconomy = {
        ...nextEconomy,
        gdp: Math.round(nextEconomy.gdp + proposal.investmentCrore * 0.08),
        growth: Math.round(clamp(nextEconomy.growth + 0.25, -4, 11) * 100) / 100,
        unemployment: Math.max(2, Math.round((nextEconomy.unemployment - Math.min(0.25, proposal.expectedJobs / 50000)) * 100) / 100),
      };
      nextApproval = clamp(nextApproval + 2, 0, 100);
      const outcome = `${proposal.company} completed its ${proposal.sector} project, creating ${proposal.expectedJobs.toLocaleString()} jobs.`;
      events.push(outcome);
      return { ...proposal, status: 'completed' as const, outcome };
    }
    nextEconomy = {
      ...nextEconomy,
      debt: Math.round(nextEconomy.debt + proposal.publicSupportCrore * 0.5),
      inflation: Math.min(15, Math.round((nextEconomy.inflation + 0.15) * 100) / 100),
    };
    nextApproval = clamp(nextApproval - 2, 0, 100);
    const outcome = `${proposal.company}'s project failed. The public support was lost, debt rose, and the government faces criticism.`;
    events.push(outcome);
    return { ...proposal, status: 'failed' as const, outcome };
  });
  return { board: { proposals, jobsCreated }, economy: nextEconomy, approval: Math.round(nextApproval * 10) / 10, events };
}
