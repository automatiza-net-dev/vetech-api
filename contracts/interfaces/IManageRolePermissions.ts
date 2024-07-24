export default interface IManageRolePermissions {
	data: Array<{
		role: number;
		permissions: Array<{
			id: number;
			active?: boolean | null;
		}>;
	}>;
}
