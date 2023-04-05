import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { TutorResidences } from 'App/Models/PatientTutor';
import { DateTime } from 'luxon';

export default interface IPatientSupplierData {
  name: string;
  document?: string;
  email?: string;
  cellphone?: string;
  telephone?: string;

  birthDate?: DateTime;
  stateInscription?: string;
  residence?: typeof TutorResidences[number];
  photo?: MultipartFileContract;
  tags?: string;
  active?: boolean;
  corporateName?: string;
  messagePersonName?: string;
  messagePersonPhone?: string;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  cityCode?: string;
}
