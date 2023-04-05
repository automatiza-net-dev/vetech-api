import { HospitalizationStatus } from 'App/Models/Hospitalization';
import { DateTime } from 'luxon';

export interface IHospitalizationData {
  tutorId: string;
  patientId: string;
  type: number;
  complaint: string;
  bedId?: string;
  risk?: number;
  expectedDischarge?: DateTime;
  diagnosis?: string;
  prognosis?: string;
  status?: HospitalizationStatus;
  userId?: string;
}
