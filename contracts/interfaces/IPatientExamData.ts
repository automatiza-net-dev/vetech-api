import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { DateTime } from 'luxon';

export default interface IPatientExamData {
  realizedAt?: DateTime;
  laboratory: string;
  report: string;
  examId: string;
  patientId: string;
  scheduleId: string;
}
export interface IPatientExamAttachmentData {
  realizedAt: DateTime;
  patientId: string;
  attachment: MultipartFileContract;
}
