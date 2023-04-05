import { DateTime } from 'luxon';

export default interface ICreateAppointment {
  scheduleServiceId: string;
  tag: string;
  realizedAt: DateTime;
  technicianId: string;
  resume: string;
  protocol: string;
}
