import { DateTime } from 'luxon';

export type IAnimalPathology = {
  tag: string;
  pathology: string;
  realizedAt: DateTime;
  technicianId: string;
};
