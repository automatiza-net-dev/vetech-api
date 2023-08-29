import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { PatientGender, PatientVaccineOrigin } from 'App/Models/Patient';
import { DateTime } from 'luxon';

export default interface IPatientData {
  name: string;
  photo?: MultipartFileContract;
  gender?: PatientGender;
  tags?: string;
  birthDate?: DateTime;
  active: boolean;
  holderId: string;
  castrated: boolean;
  microchip?: string;
  hypertension?: boolean;
  diabetes?: boolean;
  glycemia?: number;
  pressure?: string;

  raceId: string;
  vaccineOrigin?: PatientVaccineOrigin;
  hairId?: string;
}

export interface IFastStorePatient {
  tutorName?: string;
  tutorEmail?: string;
  tutorPhone: string;
  tutorOriginId?: string;

  patientName?: string;
  patientRaceId?: string;
  patientGender?: PatientGender;
}
