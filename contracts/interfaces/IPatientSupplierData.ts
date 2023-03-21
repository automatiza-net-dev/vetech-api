import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { TutorResidences } from 'App/Models/PatientTutor';

export default interface IPatientSupplierData {
  name: string;
  document?: string;
  email?: string;
  cellphone?: string;
  telephone?: string;

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
