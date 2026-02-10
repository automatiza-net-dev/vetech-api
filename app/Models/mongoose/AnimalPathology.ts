import { DateTime } from "luxon";

export type IAnimalPathology = {
  tag: string;
  pathology: string;
  realizedAt: DateTime;
  createdAt?: DateTime;
  technicianId: string;
  description: string;
  defaultProtocol: string;
};
