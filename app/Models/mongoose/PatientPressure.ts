import { DateTime } from 'luxon';

export type IPatientPressure = {
  tag: string;
  pressure: number;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
