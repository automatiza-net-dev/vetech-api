export default interface IRoleData {
	name: string;
	externalAccess: boolean;
	profiles: {
		id: number;
	}[];
	screens: { id: number; permissions: { id: number }[] }[];
}
