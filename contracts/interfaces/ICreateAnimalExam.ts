import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { DateTime } from 'luxon';

export default interface ICreateAnimalExam {
  tag: string;
  name: string;
  realizedAt: DateTime;
  requesterId: string;
  technicianId: string;
  description: string;
  attachments: Array<MultipartFileContract>;
}
