export interface IForgotPassword {
	systemId: number;
	email: string;
}

export interface IResetPassword {
	hash: string;
	password: string;
}
