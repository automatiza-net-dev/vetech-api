import { DateTime } from 'luxon';

export default interface IAttendanceData {
  schedule: string;
  status: string;
  complaint: string;
  clinicalExamination: string;
  startDate: DateTime;
  endDate: DateTime;
}
