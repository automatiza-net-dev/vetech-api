import { DateTime } from 'luxon';

export default interface IUnavailableDayData {
  userId: string;
  startHour: DateTime;
  endHour: DateTime;
}
