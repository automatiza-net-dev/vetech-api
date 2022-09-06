import { DateTime } from 'luxon';

export default interface ICreateAppointment {
  tag: string;
  name: string;
  realizedAt: DateTime;
  technicianId: string;
  description: string;
}
