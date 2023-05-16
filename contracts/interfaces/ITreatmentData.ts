export interface ICreateTreatment {
  scheduleServiceId: string;
  patientId?: string;
  resume?: string;
  protocol: string;
  internalObservation?: string;

  scheduleId?: string;
}
