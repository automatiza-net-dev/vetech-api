import { DateTime } from 'luxon';

export type IPatientGlycemia = {
  tag: string;
  value: string;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
