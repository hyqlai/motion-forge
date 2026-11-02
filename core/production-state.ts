import type {ProductionState} from './schema.ts';

export const createProductionState = (): ProductionState => ({
  status: 'design-review',
  notes: [],
});

export const approveDesign = (state: ProductionState, at: string): ProductionState => {
  if (state.status !== 'design-review') {
    throw new Error(`Design approval is not allowed from ${state.status}`);
  }
  return {...state, status: 'sample-review', designApprovedAt: at};
};

export const approveSample = (state: ProductionState, at: string): ProductionState => {
  if (state.status !== 'sample-review') {
    throw new Error(`Sample approval is not allowed from ${state.status}`);
  }
  return {...state, status: 'production', sampleApprovedAt: at};
};

export const resetForDesignRevision = (state: ProductionState, note: string): ProductionState => ({
  status: 'design-review',
  notes: [...state.notes, note],
});

export const assertRenderAllowed = (
  state: ProductionState,
  scope: 'sample' | 'film',
): void => {
  if (scope === 'sample' && state.status !== 'sample-review') {
    throw new Error('The design must be approved before rendering the sample scene');
  }
  if (scope === 'film' && state.status !== 'production' && state.status !== 'delivered') {
    throw new Error('The sample scene must be approved before rendering the full film');
  }
};
