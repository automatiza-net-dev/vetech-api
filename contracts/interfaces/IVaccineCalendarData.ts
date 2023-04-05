import { DateTime } from 'luxon';

export interface IVaccineCalendarData {
  schedulingDate?: DateTime;
  applicationDate?: DateTime;
  productId?: string;
  dose: number;
  laboratory?: string;
  batch?: string;
}
