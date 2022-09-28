import { DateTime } from 'luxon';

export interface IHospitalizationClinicParameterData {
  executedAt?: DateTime;
  releasedAt?: DateTime;
  value: string;
  resume: string;
  status: string;
  userId?: string;
  hospitalizationId: string;
  clinicParameterId: string;
}
