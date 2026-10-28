import type { SecurityDeployment } from './types';

export function initialSecurity(): SecurityDeployment {
  return { availableOfficers: 40, baselineAssigned: 10, activeAdditional: 0, inTransit: 0, arrivalDay: null, requestDay: null };
}

export type SecurityAction = { ok: true; state: SecurityDeployment; message: string } | { ok: false; error: string };

export function requestSecurity(state: SecurityDeployment, additional: number, day: number): SecurityAction {
  if (!Number.isInteger(additional) || additional < 1 || additional > 30) return { ok: false, error: 'Choose between 1 and 30 additional officers.' };
  if (![5, 10, 15, 20].includes(additional) && additional % 5 !== 0) return { ok: false, error: 'Choose 5, 10, 15, 20, or a custom multiple of five.' };
  if (state.activeAdditional > 0 || state.inTransit > 0) return { ok: false, error: 'Dismiss the current deployment before requesting another convoy.' };
  const remaining = state.availableOfficers - state.baselineAssigned;
  if (additional > remaining) return { ok: false, error: `Only ${remaining} additional officers are currently available.` };
  const arrivalDay = day + 2;
  return {
    ok: true,
    state: { ...state, inTransit: additional, arrivalDay, requestDay: day },
    message: `Police headquarters dispatched ${additional} officers. Estimated arrival: Day ${arrivalDay}.`,
  };
}

export function advanceSecurity(state: SecurityDeployment, day: number): SecurityAction | null {
  if (state.inTransit === 0 || state.arrivalDay === null || day < state.arrivalDay) return null;
  return {
    ok: true,
    state: { ...state, activeAdditional: state.inTransit, inTransit: 0, arrivalDay: null },
    message: `${state.inTransit} additional officers reported for duty. They are assigned to accompany the Prime Minister.`,
  };
}

export function dismissSecurity(state: SecurityDeployment): SecurityAction {
  if (state.activeAdditional === 0 && state.inTransit === 0) return { ok: false, error: 'No additional security deployment is active.' };
  const released = state.activeAdditional + state.inTransit;
  return {
    ok: true,
    state: { ...state, activeAdditional: 0, inTransit: 0, arrivalDay: null, requestDay: null },
    message: `${released} additional officers returned to public duty.`,
  };
}

/** Monthly security operating cost in crore; the baseline ten officers are not charged here. */
export function monthlySecurityCost(state: SecurityDeployment): number {
  return Math.round(state.activeAdditional * 0.08 * 100) / 100;
}

export function validateSecurity(state: unknown): SecurityDeployment | null {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
  const s = state as Record<string, unknown>;
  const numbers = ['availableOfficers', 'baselineAssigned', 'activeAdditional', 'inTransit'] as const;
  if (!numbers.every((key) => typeof s[key] === 'number' && Number.isInteger(s[key]))) return null;
  if ((s.availableOfficers as number) !== 40 || (s.baselineAssigned as number) !== 10) return null;
  if ((s.activeAdditional as number) < 0 || (s.inTransit as number) < 0 || (s.activeAdditional as number) + (s.inTransit as number) > 30) return null;
  if (s.arrivalDay !== null && (typeof s.arrivalDay !== 'number' || !Number.isInteger(s.arrivalDay) || s.arrivalDay < 1)) return null;
  if (s.requestDay !== null && (typeof s.requestDay !== 'number' || !Number.isInteger(s.requestDay) || s.requestDay < 1)) return null;
  if (((s.inTransit as number) > 0) !== (s.arrivalDay !== null)) return null;
  return {
    availableOfficers: 40, baselineAssigned: 10,
    activeAdditional: s.activeAdditional as number, inTransit: s.inTransit as number,
    arrivalDay: s.arrivalDay as number | null, requestDay: s.requestDay as number | null,
  };
}
