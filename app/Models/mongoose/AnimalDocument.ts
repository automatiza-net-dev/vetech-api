import { DateTime } from "luxon";

export type IAnimalDocument = {
  tag: string;
  type: string;
  value: string;
  technicianId: string;
  realizedAt?: DateTime;
  createdAt?: DateTime;
};
