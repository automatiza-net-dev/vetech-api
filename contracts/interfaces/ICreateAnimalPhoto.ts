import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';

export default interface ICreateAnimalPhoto {
  tag: string;
  photo: MultipartFileContract;
  technicianId: string;
  observation?: string;
}
