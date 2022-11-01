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
  raceId: string;
  vaccineOrigin: PatientVaccineOrigin;
}
