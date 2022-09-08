import { DateTime } from 'luxon';

export interface IVaccineCalendarData {
  applicationDate?: DateTime;
  productId?: string;
  dose: number;
  laboratory?: string;
  batch?: string;
}
