export default interface IRoleData {
	name: string;
	externalAccess: boolean;
	profiles: {
		id: number;
		active: boolean;
	}[];
	screens: {
		id: number;
		permissions: { id: number; active: boolean; status: boolean }[];
	}[];
}
