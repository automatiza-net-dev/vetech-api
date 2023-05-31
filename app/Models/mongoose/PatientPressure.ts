import { DateTime } from 'luxon';

export type IPatientPressure = {
  tag: string;
  pressure: string;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
