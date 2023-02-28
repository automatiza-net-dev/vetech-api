import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import { DateTime } from 'luxon';

export default interface IMedicalPrescriptionData {
  type: MedicalPrescriptionType;
  prescribedAt: DateTime;
  frequency: MedicalPrescriptionFrequency;
  description: string;
  resume: string;
}
