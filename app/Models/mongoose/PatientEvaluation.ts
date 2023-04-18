import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import { DateTime } from 'luxon';

export type IPatientEvaluation = {
  tag: string;
  resume: string;
  protocol: string;
  realizedAt: DateTime;
  technicianId: string;
  observation?: string;
  photos: MultipartFileContract[];
};
