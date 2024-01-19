export default interface IUpdateUserRole {
	user_id: string;
	role_id: number;
	default_sale_deposit_id: number | null | undefined;
	unit_id: string;
	active: boolean;
}
