import { OccurrenceType } from 'App/Models/Occurrence';

export default interface IOccurrenceData {
  description: string;
  type: OccurrenceType;
  active: boolean;
}
