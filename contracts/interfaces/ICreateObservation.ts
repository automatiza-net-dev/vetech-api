import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { DateTime } from 'luxon';

export interface ICreateObservation {
  tag: string;
  technicianId: string;
  observation: string;
  resume?: string;
  createdAt?: DateTime;
  medias?: Array<MultipartFileContract>;
}
