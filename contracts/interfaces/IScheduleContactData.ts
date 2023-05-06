import { DateTime } from 'luxon';

export default interface IScheduleContactData {
  scheduleId: string;
  statusId: string;
  observation: string;
  contactDate: DateTime;
}
