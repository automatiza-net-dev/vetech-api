import { DateTime } from 'luxon';

export default interface IScheduleData {
  scheduleServiceTypeId: string;
  scheduleStatusId: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  startHour: DateTime;
  endHour: DateTime;
  age?: number;
  raceId?: string;
  majorComplaint?: string;
  userId?: string;
  ignoreOverlapping?: boolean;
}
