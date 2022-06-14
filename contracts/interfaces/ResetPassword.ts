export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  hash: string;
  email: string;
  password: string;
}
