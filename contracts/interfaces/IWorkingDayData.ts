import WeekDay from 'App/Models/shared/WeekDay';
import { DateTime } from 'luxon';

export default interface IWorkingDayData {
  userId: string;
  dayOfWeek: WeekDay;
  startHour: DateTime;
  endHour: DateTime;
}
