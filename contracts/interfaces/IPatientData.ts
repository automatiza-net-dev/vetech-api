import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { PatientGender } from 'App/Models/Patient';
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
}
