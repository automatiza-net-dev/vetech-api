import { DateTime } from 'luxon';

export type IPatientGlycemia = {
  tag: string;
  value: number;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
