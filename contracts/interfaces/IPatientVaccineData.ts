import { DateTime } from "luxon";

export default interface IPatientVaccineData {
  vaccineId: string;
  vaccineProtocolId: string;
  patientId: string;
  scheduleId?: string;
  userId?: string;
  importField?: string;
  applications?: Array<{ dose: number; date: DateTime }>;
  createdAt?: DateTime;
}
