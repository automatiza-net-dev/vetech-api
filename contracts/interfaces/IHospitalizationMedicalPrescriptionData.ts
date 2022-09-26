import { HospitalizationSchedulingStatus } from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import { DateTime } from 'luxon';

export default interface IHospitalizationMedicalPrescriptionData {
  hospitalizationId: string;
  type: MedicalPrescriptionType;
  prescribedAt: DateTime;
  executionStart: DateTime;
  frequency: MedicalPrescriptionFrequency;
  description: string;
  resume: string;
}

export interface IHospitalizationMedicalPrescriptionSchedulingData {
  type?: MedicalPrescriptionType;
  frequency?: MedicalPrescriptionFrequency;
  scheduledAt?: DateTime;
  executedAt?: DateTime;
  description?: string;
  resume?: string;
  status?: HospitalizationSchedulingStatus;
}
