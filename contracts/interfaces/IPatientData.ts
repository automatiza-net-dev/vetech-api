import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { PatientGender, PatientType } from 'App/Models/Patient';
import { DateTime } from 'luxon';

export default interface IPatientData {
  name: string;
  type: PatientType;
  photo?: MultipartFileContract;
  gender: PatientGender;
  tags: string;
  birthDate: DateTime;
  active: boolean;
  holderId: string;
}
