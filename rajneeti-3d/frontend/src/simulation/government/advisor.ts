import type { GovState, MinistryMetrics } from './types';

export type AdviceSeverity = 'urgent' | 'warning' | 'opportunity' | 'info';
export interface AdvisorNote { severity: AdviceSeverity; title: string; detail: string }

/**
 * Deliberately deterministic and offline: advice is generated from visible simulation state,
 * does not call a cloud model, and never makes a decision on the player's behalf.
 */
export function politicalAdvice(state: GovState | null, seats: number | null, majority = 91): AdvisorNote[] {
  if (!state) return [{ severity: 'info', title: 'Before government', detail: 'Win or join a government to receive stability, cabinet, and economic analysis.' }];
  const notes: AdvisorNote[] = [];
  if (state.status === 'fallen') notes.push({ severity: 'urgent', title: 'Government has fallen', detail: state.fallenReason ?? 'The government can no longer govern. Consider calling an early election.' });
  if (seats !== null && seats < majority) notes.push({ severity: 'urgent', title: 'Majority at risk', detail: `Current support is ${seats} seats; ${majority} are required. Seek outside support or renegotiate the coalition.` });
  const weakestPartner = Object.entries(state.satisfaction).sort((a, b) => a[1] - b[1])[0];
  if (weakestPartner && weakestPartner[1] < 45) notes.push({ severity: weakestPartner[1] < 25 ? 'urgent' : 'warning', title: 'Coalition trust is low', detail: `${weakestPartner[0]} has ${Math.round(weakestPartner[1])}/100 satisfaction. Review ministry allocation and recent agreements before the next confidence vote.` });
  if (state.crisis) notes.push({ severity: 'urgent', title: 'Decision deadline', detail: `A crisis needs a decision by Day ${state.crisis.deadline}; allowing it to lapse will damage the economy and approval.` });
  const weakMinistry = Object.entries(state.ministryMetrics as Record<string, MinistryMetrics>).sort((a, b) => a[1].performance - b[1].performance)[0];
  if (weakMinistry && weakMinistry[1].performance < 45) notes.push({ severity: 'warning', title: 'Ministry performance needs attention', detail: `${weakMinistry[0]} is at ${Math.round(weakMinistry[1].performance)}/100 with ${weakMinistry[1].complaints} complaints. Check staffing and budget before issuing a warning.` });
  if (state.economy.inflation >= 8) notes.push({ severity: 'warning', title: 'Cost-of-living pressure', detail: `Inflation is ${state.economy.inflation}%. Broad spending or tax increases may worsen price pressure.` });
  if (state.economy.unemployment >= 9) notes.push({ severity: 'warning', title: 'Employment concern', detail: `Unemployment is ${state.economy.unemployment}%. Consider job-intensive infrastructure, clean energy, or regional projects and review their fiscal risk.` });
  if (state.treasury < 5000) notes.push({ severity: 'warning', title: 'Limited fiscal headroom', detail: `The treasury holds ₹${Math.round(state.treasury).toLocaleString()} crore. Review recurring costs and public guarantees before approving new commitments.` });
  const openOffer = state.investments.proposals.find((p) => ['offered', 'reviewed', 'negotiated'].includes(p.status));
  if (openOffer) notes.push({ severity: 'opportunity', title: 'Investment decision available', detail: `${openOffer.company} proposes ₹${openOffer.investmentCrore} crore in ${openOffer.sector}. An economic review is available; approval uses public support and outcomes are uncertain.` });
  if (notes.length === 0) notes.push({ severity: 'info', title: 'No immediate warning', detail: 'Current simulation indicators show no urgent coalition, fiscal, or ministry issue. Continue monitoring as the world advances.' });
  return notes.slice(0, 6);
}
