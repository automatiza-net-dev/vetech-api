import { DateTime } from 'luxon';

export default interface IPatientExamData {
  realizedAt?: DateTime;
  laboratory: string;
  report: string;
  examId: string;
  patientId: string;
  scheduleId: string;
}
