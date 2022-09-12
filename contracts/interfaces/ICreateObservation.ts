import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';

export interface ICreateObservation {
  tag: string;
  technicianId: string;
  observation: string;
  medias: Array<MultipartFileContract>;
}
