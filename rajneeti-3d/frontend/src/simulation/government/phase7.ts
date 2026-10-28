import type { Member } from '../parties/types';
import { groupMinistries, type GovContext, type Action } from './state';
import type { GovState, SwitchingRequest, MeetingRequest, MinistryAction } from './types';
import { MINISTRY_DEFS } from './types';
import { ministryOwners } from './cabinet';
import { confidenceVote } from './parliament';
import { PLAYER_ID } from '../election/types';
import { Rng, hashString } from '../core/rng';

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

export function seedSwitchingRequests(ctx: GovContext, members: Member[]): SwitchingRequest[] {
  const rival = Object.keys(ctx.result.seats).find((id) => id !== PLAYER_ID && (ctx.result.seats[id] ?? 0) > 0) ?? 'IND';
  const oppositionMember = members.find((m) => m.status === 'active');
  return [
    { id: 'switch-in-1', direction: 'in', politicianName: 'Kabir Malhotra', partyId: rival, constituency: 'C-042', loyalty: 63, reason: 'Our party has no credible path to government.', status: 'pending' },
    { id: 'switch-in-2', direction: 'in', politicianName: 'Nandita Rao', partyId: rival, constituency: 'C-117', loyalty: 48, reason: 'I want a ministry with real delivery power.', status: 'pending' },
    ...(oppositionMember ? [{ id: `switch-out-${oppositionMember.id}`, direction: 'out' as const, politicianName: oppositionMember.name, partyId: PLAYER_ID, constituency: oppositionMember.preferredConstituency, loyalty: oppositionMember.loyalty, reason: oppositionMember.opposesLeadership ? 'I no longer trust the party leadership.' : 'I have been promised a stronger political future.', memberId: oppositionMember.id, status: 'pending' as const }] : []),
  ];
}



export function manageMinistry(s: GovState, ctx: GovContext, ministryId: string, action: MinistryAction, day: number): Action {
  if (s.status !== 'governing') return { ok: false, error: 'The government has fallen.' };
  const def = MINISTRY_DEFS.find((m) => m.id === ministryId);
  if (!def) return { ok: false, error: 'Unknown ministry.' };
  const owners = ministryOwners({ ...ctx.government, partners: s.partners, ministries: groupMinistries(s, ctx) });
  if (s.ministryRemoved.includes(ministryId)) return { ok: false, error: 'The Prime Minister has withdrawn this ministry from your party.' };
  if (owners[ministryId] !== ctx.government.leaderId && owners[ministryId] !== PLAYER_ID) return { ok: false, error: 'Your party does not control this ministry.' };
  const before = s.ministryMetrics[ministryId] ?? { performance: 55, budget: 500, complaints: 0, ministerSatisfaction: 60 };
  const costs: Record<MinistryAction, number> = { fund: 80, services: 35, recruit: 45, policy: 25, complaints: 10 };
  const cost = costs[action];
  if (s.treasury < cost) return { ok: false, error: `The treasury needs ₹${cost} crore for that decision.` };
  const performance = Math.max(0, Math.min(100, before.performance + (action === 'fund' ? 5 : action === 'services' ? 8 : action === 'recruit' ? 6 : action === 'policy' ? 4 : 2)));
  const complaints = Math.max(0, before.complaints + (action === 'complaints' ? -8 : action === 'fund' ? -2 : 1));
  const satisfaction = Math.max(0, Math.min(100, before.ministerSatisfaction + (performance >= 60 ? 2 : -1)));
  const approval = Math.max(0, Math.min(100, s.approval + (action === 'complaints' ? 1 : performance >= 70 ? 2 : 0)));
  const label = action === 'fund' ? 'allocated extra budget' : action === 'services' ? 'improved public services' : action === 'recruit' ? 'recruited staff' : action === 'policy' ? 'introduced a new policy' : 'addressed public complaints';
  return { ok: true, state: { ...s, treasury: s.treasury - cost, approval, ministryMetrics: { ...s.ministryMetrics, [ministryId]: { performance, budget: before.budget + (action === 'fund' ? cost : 0), complaints, ministerSatisfaction: satisfaction } }, history: [`Day ${day}: ${def.name} ministry ${label}. Performance is now ${performance}/100.`, ...s.history].slice(0, 40) }, message: `${def.name}: ${label}.` };
}

export function seedMeetings(ctx: GovContext): MeetingRequest[] {
  const rival = Object.keys(ctx.result.seats).find((id) => id !== PLAYER_ID && (ctx.result.seats[id] ?? 0) > 0) ?? 'IND';
  return [
    { id: 'meeting-1', fromPartyId: rival, personName: 'Aarav Sen', topic: 'support', trust: 58, offer: 'Outside support on the next confidence vote', status: 'pending' },
    { id: 'meeting-2', fromPartyId: rival, personName: 'Leela Iyer', topic: 'ministries', trust: 44, offer: 'A stronger voice for regional development', status: 'pending' },
  ];
}

export function resolveMeeting(s: GovState, meetingId: string, decision: 'accept' | 'reject' | 'counter' | 'postpone', day: number): Action {
  const meeting = s.meetings.find((m) => m.id === meetingId);
  if (!meeting || meeting.status !== 'pending') return { ok: false, error: 'That meeting is no longer pending.' };
  const status = decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : decision === 'counter' ? 'countered' : 'postponed';
  const delta = decision === 'accept' ? 2 : decision === 'reject' ? -1 : decision === 'counter' ? 1 : 0;
  const message = decision === 'accept' ? `${meeting.personName} agreed to a private political understanding.` : decision === 'reject' ? `You rejected ${meeting.personName}'s private meeting proposal.` : decision === 'counter' ? `You sent ${meeting.personName} a counteroffer; trust will be tested at the next meeting.` : `The meeting with ${meeting.personName} was postponed.`;
  return { ok: true, state: { ...s, approval: clamp(s.approval + delta), meetings: s.meetings.map((m) => m.id === meetingId ? { ...m, status } : m), history: [`Day ${day}: ${message}`, ...s.history].slice(0, 40) }, message };
}

/** The PM may ask a coalition partner to replace a weak minister; the partner AI makes the final decision. */
export function requestPartnerMinisterReplacement(s: GovState, ctx: GovContext, ministryId: string, day: number): Action {
  if (s.status !== 'governing') return { ok: false, error: 'The government has fallen.' };
  if (ctx.government.playerRole !== 'leader') return { ok: false, error: 'Only the Prime Minister can ask a coalition partner to replace its minister.' };
  const def = MINISTRY_DEFS.find((m) => m.id === ministryId);
  if (!def) return { ok: false, error: 'Unknown ministry.' };
  const owners = ministryOwners({ ...ctx.government, partners: s.partners, ministries: groupMinistries(s, ctx) });
  const partnerId = owners[ministryId];
  if (!partnerId || partnerId === PLAYER_ID || !s.partners.includes(partnerId)) return { ok: false, error: `${def.name} is not held by a coalition partner.` };

  const metrics = s.ministryMetrics[ministryId] ?? { performance: 55, budget: 500, complaints: 0, ministerSatisfaction: 60 };
  if (metrics.performance >= 50 && metrics.complaints < 4) return { ok: false, error: `${def.name} has no clear underperformance case yet. Request a replacement when performance is below 50 or complaints reach 4.` };
  const previous = [...s.meetings].reverse().find((m) => m.requestType === 'minister-replacement' && m.ministryId === ministryId);
  if (previous?.day !== undefined) {
    const remaining = 90 - (day - previous.day);
    if (remaining > 0) return { ok: false, error: `The coalition partner needs time after its last decision. You can ask again in ${remaining} day(s).` };
  }

  const trust = s.satisfaction[partnerId] ?? 50;
  const acceptanceChance = Math.max(5, Math.min(95, Math.round(45 + (50 - metrics.performance) * 1.15 + metrics.complaints * 2.5 + (trust - 50) * 0.45)));
  const rng = new Rng(ctx.seed ^ hashString(`minister-replacement:${ministryId}:${day}:${s.meetings.length}`));
  const accepted = rng.next() * 100 < acceptanceChance;
  const status: MeetingRequest['status'] = accepted ? 'accepted' : 'rejected';
  const message = accepted
    ? `${partnerId} approved your request to replace its minister for ${def.name}. A new appointee takes over; performance returns to the 55-point baseline and complaints ease.`
    : `${partnerId} rejected your request to replace its ${def.name} minister. Coalition trust has fallen because the partner considers the request unjustified.`;
  const request = {
    id: `minister-replacement-${ministryId}-${day}-${s.meetings.length}`,
    fromPartyId: partnerId,
    personName: `${partnerId} coalition leadership`,
    topic: 'ministries' as const,
    trust,
    offer: message,
    status,
    requestType: 'minister-replacement' as const,
    ministryId,
    day,
  };
  const nextMetrics = accepted
    ? { ...metrics, performance: Math.max(55, metrics.performance), complaints: Math.floor(metrics.complaints * 0.4), ministerSatisfaction: 60 }
    : metrics;
  const next: GovState = {
    ...s,
    approval: clamp(s.approval + (accepted ? 1 : -1)),
    satisfaction: { ...s.satisfaction, [partnerId]: clamp(trust + (accepted ? 2 : -4)) },
    ministryMetrics: { ...s.ministryMetrics, [ministryId]: nextMetrics },
    meetings: [...s.meetings, request].slice(-80),
    history: [`Day ${day}: ${message}`, ...s.history].slice(0, 40),
  };
  return { ok: true, state: next, message };
}

export function breakAlliance(s: GovState, ctx: GovContext, partnerId: string, day: number): Action {
  if (s.status !== 'governing') return { ok: false, error: 'The government has already fallen.' };
  if (!s.partners.includes(partnerId)) return { ok: false, error: 'That party is not supporting your government.' };
  const next = { ...s, partners: s.partners.filter((p) => p !== partnerId), satisfaction: { ...s.satisfaction } };
  delete next.satisfaction[partnerId];
  const seats = [ctx.government.leaderId, ...next.partners].reduce((n, p) => n + (ctx.result.seats[p] ?? 0), 0);
  if (seats < 91) {
    const vote = confidenceVote({ seed: ctx.seed, day, seats: ctx.result.seats, ideologies: ctx.ideologies, leaderId: ctx.government.leaderId, govParties: [ctx.government.leaderId, ...next.partners], approval: next.approval });
    const survived = vote.survives;
    return { ok: true, state: { ...next, status: survived ? 'governing' : 'fallen', fallenReason: survived ? null : `Lost a confidence vote after ending the alliance with ${partnerId}.`, history: [`Day ${day}: Alliance with ${partnerId} ended. ${survived ? 'Confidence vote survived.' : 'Confidence vote lost; the government fell.'}`, ...next.history].slice(0, 40) }, message: survived ? `Alliance ended. Confidence vote survived with ${vote.yes} votes.` : `Alliance ended. Confidence vote lost (${vote.yes} yes). The government has fallen.` };
  }
  return { ok: true, state: { ...next, history: [`Day ${day}: Alliance with ${partnerId} ended by the Prime Minister.`, ...next.history].slice(0, 40) }, message: `Alliance with ${partnerId} ended. Your government still has ${seats} seats.` };
}

export function applyIncomingSwitch(s: GovState, req: SwitchingRequest, day: number, negotiated: boolean): Action {
  if (s.status !== 'governing') return { ok: false, error: 'The government has fallen.' };
  const boost = negotiated ? 8 : 2;
  return { ok: true, state: { ...s, approval: clamp(s.approval + boost), history: [`Day ${day}: ${req.politicianName} joined the ruling party${negotiated ? ' after negotiations' : ''}.`, ...s.history].slice(0, 40) }, message: `${req.politicianName} has joined the ruling party.` };
}

export function applyOutgoingSwitch(s: GovState, req: SwitchingRequest, day: number): Action {
  if (s.status !== 'governing') return { ok: false, error: 'The government has fallen.' };
  return { ok: true, state: { ...s, approval: clamp(s.approval - 4), history: [`Day ${day}: ${req.politicianName} defected to the opposition.`, ...s.history].slice(0, 40) }, message: `${req.politicianName} left the ruling party. Anti-defection rules require a by-election review.` };
}

export function resignMinister(s: GovState, memberId: string, day: number): GovState {
  const cabinet = Object.fromEntries(Object.entries(s.cabinet).filter(([, id]) => id !== memberId));
  return { ...s, cabinet, approval: clamp(s.approval - 2), history: [`Day ${day}: A minister resigned from the cabinet.`, ...s.history].slice(0, 40) };
}
