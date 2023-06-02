import { DateTime } from 'luxon';

export type IAnimalWeight = {
  tag: string;
  weight: string;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
