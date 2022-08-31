import { DateTime } from 'luxon';

export type IAnimalHospitalizationData = {
  technician: {
    id: string;
    name: string;
  };
  situation: string;
  box: string;
  risk: string;
  expectedDate: DateTime;
  complaint: string;
  diagnosis: string;
  prognosis: string;
};

export type IAnimalDischargeData = {
  technician: {
    id: string;
    name: string;
  };
  dischargeDate: DateTime;
  observation: string;
};

export type HospitalizationType = 'hospitalization' | 'discharge';

export type IAnimalHospitalization = {
  tag: string;
  type: HospitalizationType;
  data: IAnimalHospitalizationData | IAnimalDischargeData;
};
