export interface ICreateBusinessUnit {
  economic_group_id: string;
  document: string;
  email: string;
  phone?: string;
  identification?: string;
  fantasyName?: string;
  companyName?: string;
  postalCode?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  active?: boolean;
}
