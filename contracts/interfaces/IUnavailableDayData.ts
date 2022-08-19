import WeekDay from 'App/Models/shared/WeekDay';
import { DateTime } from 'luxon';

export default interface IUnavailableDayData {
  title: string;
  userId: string;
  frequency: WeekDay;
  startDate: DateTime;
  endDate: DateTime;
  startHour: string;
  endHour: string;
  active: boolean;
}
