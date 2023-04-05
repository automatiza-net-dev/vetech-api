export interface ICreateTreatment {
  scheduleServiceId: string;
  patientId?: string;
  resume: string;
  protocol: string;

  scheduleId?: string;
}
