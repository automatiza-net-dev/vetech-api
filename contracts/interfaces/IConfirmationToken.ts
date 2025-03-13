export interface ICreateConfirmationToken {
  systemId: number;
  name: string;
  phone: string;
  email: string;
}

export interface IConfirmConfirmationToken {
  code: string;
  email: string;
}
