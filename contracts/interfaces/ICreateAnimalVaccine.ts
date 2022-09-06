import { DateTime } from 'luxon';

export default interface ICreateAnimalVaccine {
  tag: string;
  name: string;
  technicianId: string;
  expectedDate?: DateTime;
  applicationDate?: DateTime;
  laboratory?: string;
  batch?: string;
}
