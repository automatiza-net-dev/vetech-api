import { DateTime } from 'luxon';

export interface ICreateHospitalization {
  tag: string;
  technicianId: string;
  situation: string;
  box: string;
  risk: string;
  expectedDate: DateTime;
  complaint: string;
  diagnosis: string;
  prognosis: string;
}

export interface ICreateDischarge {
  tag: string;
  technicianId: string;
  dischargeDate: DateTime;
  observation: string;
}
