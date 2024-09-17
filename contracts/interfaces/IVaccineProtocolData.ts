export interface IVaccineProtocolData {
  name: string;
  vaccineId: string;
  specieId?: string;
  doses: number;
  interval: number;
  active: boolean;
  expirationDays?: number
}
