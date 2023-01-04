import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { PatientGender } from 'App/Models/Patient';
import { TutorResidences } from 'App/Models/PatientTutor';
import { DateTime } from 'luxon';

export default interface IPatientTutorData {
  name: string;
  residence?: typeof TutorResidences[number];
  photo?: MultipartFileContract;
  gender?: PatientGender;
  tags?: string;
  birthDate?: DateTime;
  active?: boolean;
  document?: string;
  inscription?: string;
  corporate_name?: string;
  email: string;
  cellphone: string;
  telephone?: string;
  message_person_name?: string;
  message_person_phone?: string;
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  clientOriginId?: string;
}
