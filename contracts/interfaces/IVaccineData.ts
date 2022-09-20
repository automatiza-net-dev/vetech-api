import { VaccineType } from 'App/Models/Vaccine';

export interface IVaccineData {
  subgroupId?: string;
  name: string;
  description: string;
  type: VaccineType;
  active: boolean;
}
