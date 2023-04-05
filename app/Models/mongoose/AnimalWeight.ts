import { DateTime } from 'luxon';

export type IAnimalWeight = {
  tag: string;
  weight: number;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
};
