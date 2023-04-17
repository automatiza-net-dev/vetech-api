export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  document?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  licensingJob?: string;
  onDuty?: boolean;
}
