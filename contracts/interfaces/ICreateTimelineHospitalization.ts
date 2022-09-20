import { DateTime } from 'luxon';

export interface ICreateTimelineHospitalization {
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

export interface ICreateTimelineDischarge {
  tag: string;
  technicianId: string;
  dischargeDate: DateTime;
  observation: string;
}
