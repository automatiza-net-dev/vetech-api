import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';

export default interface ICreateAnimalPhoto {
  tag: string;
  photos: MultipartFileContract[];
  technicianId: string;
  observation?: string;
  title?: string;
}
