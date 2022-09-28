import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { DateTime } from 'luxon';

export default interface IHospitalizationOccurrenceData {
  hospitalizationId: string;
  occurrenceId: string;
  hospitalizationMedicalPrescriptionId?: string;
  previewedAt?: DateTime;
  executedAt: DateTime;
  description: string;
  resume: string;
  active: boolean;
  attachments?: MultipartFileContract[];
}

export interface IHospitalizationOccurrenceAttachmentData {
  occurrenceId: string;
  attachments: MultipartFileContract[];
}
