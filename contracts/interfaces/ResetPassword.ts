export interface IForgotPassword {
  email: string;
  systemName: string;
}

export interface IResetPassword {
  hash: string;
  email: string;
  password: string;
}
