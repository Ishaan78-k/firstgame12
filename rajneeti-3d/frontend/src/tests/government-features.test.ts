import { describe, expect, it } from 'vitest';
import { politicalAdvice } from '../simulation/government/advisor';
import { createInvestmentBoard, decideInvestment, resolveInvestments } from '../simulation/government/investments';
import { START_ECONOMY } from '../simulation/government/economy';
import { initialSecurity, requestSecurity, advanceSecurity, dismissSecurity, monthlySecurityCost, validateSecurity } from '../simulation/government/security';
import { startGovernment } from '../simulation/government/state';
import { validateGovState } from '../simulation/government/validate';
import { requestPartnerMinisterReplacement } from '../simulation/government/phase7';
import { Rng, hashString } from '../simulation/core/rng';
import type { ElectionResult, Government } from '../simulation/election/types';
import type { GovContext } from '../simulation/government/state';
import type { GovState } from '../simulation/government/types';

const leader: Government = { type: 'majority', leaderId: 'PLAYER', partners: [], seats: 100, ministries: { PLAYER: 12 }, playerRole: 'leader' };
const coalition: Government = { type: 'coalition', leaderId: 'PLAYER', partners: ['ALLY'], seats: 180, ministries: { PLAYER: 6, ALLY: 6 }, playerRole: 'leader' };

function coalitionContext(seed: number): GovContext {
  const result: ElectionResult = { seed, day: 181, constituencies: [], seats: { PLAYER: 90, ALLY: 90 }, votes: {}, voteShare: {}, totalCast: 0, turnout: 0 };
  return { seed, government: coalition, result, ideologies: {}, members: [] };
}

function seedForDecision(probability: number, accepted: boolean, key: string): number {
  for (let seed = 1; seed < 10_000; seed++) {
    if ((new Rng(seed ^ hashString(key)).next() * 100 < probability) === accepted) return seed;
  }
  throw new Error('Could not find deterministic test seed for requested response.');
}

describe('government investment offers', () => {
  it('reviews and negotiates terms without spending, then commits support on approval', () => {
    const initial = createInvestmentBoard(41);
    const offer = initial.proposals[0];
    const review = decideInvestment(initial, 30000, offer.id, 'review', 10);
    expect(review.ok).toBe(true);
    if (!review.ok) return;
    expect(review.treasury).toBe(30000);
    expect(review.board.proposals[0].reviewed).toBe(true);
    const negotiation = decideInvestment(review.board, review.treasury, offer.id, 'negotiate', 10);
    expect(negotiation.ok).toBe(true);
    if (!negotiation.ok) return;
    expect(negotiation.board.proposals[0].publicSupportCrore).toBeLessThan(offer.publicSupportCrore);
    const approval = decideInvestment(negotiation.board, negotiation.treasury, offer.id, 'approve', 10);
    expect(approval.ok).toBe(true);
    if (!approval.ok) return;
    expect(approval.treasury).toBe(30000 - negotiation.board.proposals[0].publicSupportCrore);
    expect(approval.board.proposals[0].dueDay).toBe(130);
    expect(approval.board.proposals[0].status).toBe('approved');
  });

  it('resolves an approved project only when due and cannot reroll after save/load', () => {
    const board = createInvestmentBoard(52);
    const offer = board.proposals[0];
    const action = decideInvestment(board, 30000, offer.id, 'approve', 20);
    expect(action.ok).toBe(true);
    if (!action.ok) return;
    const early = resolveInvestments(action.board, START_ECONOMY, 60, 52, 109);
    expect(early.board.proposals[0].status).toBe('approved');
    const result1 = resolveInvestments(action.board, START_ECONOMY, 60, 52, 110);
    const result2 = resolveInvestments(action.board, START_ECONOMY, 60, 52, 110);
    expect(result1).toEqual(result2);
    expect(['completed', 'failed']).toContain(result1.board.proposals[0].status);
    expect(result1.events).toHaveLength(1);
    if (result1.board.proposals[0].status === 'completed') expect(result1.board.jobsCreated).toBe(offer.expectedJobs);
  });

  it('rejects approvals that exceed the available public treasury', () => {
    const board = createInvestmentBoard(9);
    const result = decideInvestment(board, 1, board.proposals[0].id, 'approve', 10);
    expect(result.ok).toBe(false);
  });
});

describe('Prime Minister security dispatch', () => {
  it('enforces roster capacity, has an arrival delay, and charges for deployed officers', () => {
    const request = requestSecurity(initialSecurity(), 20, 5);
    expect(request.ok).toBe(true);
    if (!request.ok) return;
    expect(request.state.inTransit).toBe(20);
    expect(request.state.arrivalDay).toBe(7);
    expect(advanceSecurity(request.state, 6)).toBeNull();
    const arrival = advanceSecurity(request.state, 7);
    expect(arrival?.ok).toBe(true);
    if (!arrival?.ok) return;
    expect(arrival.state.activeAdditional).toBe(20);
    expect(monthlySecurityCost(arrival.state)).toBe(1.6);
    expect(requestSecurity(arrival.state, 5, 8).ok).toBe(false);
    const dismissed = dismissSecurity(arrival.state);
    expect(dismissed.ok).toBe(true);
    if (dismissed.ok) expect(dismissed.state.activeAdditional).toBe(0);
    expect(validateSecurity({ ...initialSecurity(), inTransit: 31, arrivalDay: 8 })).toBeNull();
  });

  it('migrates older government states without investment/security fields', () => {
    const state = startGovernment(leader, 181, 45, 88);
    const v7State: Partial<GovState> = { ...state };
    delete v7State.investments;
    delete v7State.security;
    const migrated = validateGovState(v7State, new Set(), 88);
    expect(migrated?.investments.proposals).toHaveLength(3);
    expect(migrated?.security).toEqual(initialSecurity());
  });
});

describe('offline political advisor', () => {
  it('uses current game state and reports concrete risks without cloud dependencies', () => {
    const base = startGovernment(leader, 181, 45, 5);
    const state: GovState = {
      ...base,
      treasury: 4000,
      economy: { ...base.economy, inflation: 9, unemployment: 10 },
      satisfaction: { Coalition: 22 },
    };
    const notes = politicalAdvice(state, 85);
    expect(notes.map((n) => n.title)).toContain('Majority at risk');
    expect(notes.map((n) => n.title)).toContain('Cost-of-living pressure');
    expect(notes.map((n) => n.title)).toContain('Limited fiscal headroom');
    expect(politicalAdvice(null, null)[0].detail).toContain('Win or join a government');
  });
});

describe('PM requests to replace coalition ministers', () => {
  const requestKey = 'minister-replacement:infrastructure:200:0';
  const weakMinistry = (state: GovState, performance: number, complaints: number): GovState => ({
    ...state,
    ministryMetrics: { ...state.ministryMetrics, infrastructure: { performance, complaints, budget: 900, ministerSatisfaction: 35 } },
  });

  it('lets the PM request a partner replacement and applies the partner-approved result', () => {
    const seed = seedForDecision(95, true, requestKey);
    const state = weakMinistry(startGovernment(coalition, 181, 45, seed), 20, 12);
    const result = requestPartnerMinisterReplacement(state, coalitionContext(seed), 'infrastructure', 200);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.ministryMetrics.infrastructure.performance).toBe(55);
    expect(result.state.ministryMetrics.infrastructure.complaints).toBe(4);
    expect(result.state.satisfaction.ALLY).toBe(62);
    expect(result.state.meetings[result.state.meetings.length - 1]).toMatchObject({ requestType: 'minister-replacement', ministryId: 'infrastructure', status: 'accepted', day: 200 });
    expect(validateGovState(result.state, new Set(), seed)).toEqual(result.state);
    expect(requestPartnerMinisterReplacement(state, coalitionContext(seed), 'infrastructure', 200)).toEqual(result);
  });

  it('allows a partner to refuse a weaker-evidence request and lowers coalition trust', () => {
    const probability = Math.round(45 + (50 - 49) * 1.15 + 4 * 2.5);
    const seed = seedForDecision(probability, false, requestKey);
    const state = weakMinistry(startGovernment(coalition, 181, 45, seed), 49, 4);
    const result = requestPartnerMinisterReplacement(state, coalitionContext(seed), 'infrastructure', 200);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.ministryMetrics.infrastructure.performance).toBe(49);
    expect(result.state.satisfaction.ALLY).toBe(56);
    expect(result.state.meetings[result.state.meetings.length - 1]?.status).toBe('rejected');
    expect(result.state.history[0]).toContain('rejected your request');
  });

  it('requires evidence, only targets partner-held ministries, and enforces the 90-day cooldown', () => {
    const seed = 74;
    const base = startGovernment(coalition, 181, 45, seed);
    expect(requestPartnerMinisterReplacement(base, coalitionContext(seed), 'infrastructure', 200).ok).toBe(false);
    const weak = weakMinistry(base, 20, 12);
    expect(requestPartnerMinisterReplacement(weak, coalitionContext(seed), 'finance', 200).ok).toBe(false);
    const first = requestPartnerMinisterReplacement(weak, coalitionContext(seed), 'infrastructure', 200);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(requestPartnerMinisterReplacement(first.state, coalitionContext(seed), 'infrastructure', 230)).toMatchObject({ ok: false, error: expect.stringContaining('60 day(s)') });
    expect(requestPartnerMinisterReplacement(first.state, coalitionContext(seed), 'infrastructure', 290).ok).toBe(true);
  });
});
