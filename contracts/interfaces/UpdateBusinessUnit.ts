import { TUnitStatus } from "App/Models/BusinessUnit";

export interface IUpdateBusinessUnit {
  identification?: string;
  fantasy_name?: string;
  company_name?: string;
  companyName?: string;
  email?: string;
  document?: string;
  phone?: string;
  postal_code?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  active?: boolean;

  state_registration?: string;
  city_registration?: string;
  cnae?: string;
  simple: boolean;
  cityCode?: string;

  status?: TUnitStatus;
}
