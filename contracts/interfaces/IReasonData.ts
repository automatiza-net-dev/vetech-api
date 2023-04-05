import { REASON_TYPES } from 'App/Models/Reason';

export default interface IReasonData {
  reason: string;
  type: typeof REASON_TYPES[number];
  requiresObservation: boolean;
  active: boolean;
}
