import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { TutorResidences } from 'App/Models/PatientTutor';

export default interface IPatientSupplierData {
  name: string;
  document: string;
  email: string;
  cellphone: string;

  stateInscription?: string;
  residence?: typeof TutorResidences[number];
  photo?: MultipartFileContract;
  tags?: string;
  active?: boolean;
  corporate_name?: string;
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
  cityCode?: string;
}
